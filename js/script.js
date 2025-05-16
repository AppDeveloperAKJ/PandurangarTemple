document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const loginToggleButton = document.getElementById('loginToggleButton');
    const logoutButton = document.getElementById('logoutButton'); 
    const adminLogoutButton = document.getElementById('adminLogoutButton'); 

    // Income/Expense Forms and Elements
    const addIncomeForm = document.getElementById('addIncomeForm');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const incomeStatementTablePublicBody = document.getElementById('incomeStatementTablePublicBody');
    const materialsTablePublicBody = document.getElementById('materialsTablePublicBody');
    const miscellaneousTablePublicBody = document.getElementById('miscellaneousTablePublicBody');
    const expenseTablePublicBody = document.getElementById('expenseTablePublicBody'); 
    const incomeStatementTableAdminBody = document.getElementById('incomeStatementTableAdminBody');
    const materialsTableAdminBody = document.getElementById('materialsTableAdminBody');
    const miscellaneousTableAdminBody = document.getElementById('miscellaneousTableAdminBody');
    const expenseTableAdminBody = document.getElementById('expenseTableAdminBody'); 
    const incomeStatementTotalAdminEl = document.getElementById('incomeStatementTotalAdmin');
    const materialsTotalAdminEl = document.getElementById('materialsTotalAdmin');
    const miscellaneousTotalAdminEl = document.getElementById('miscellaneousTotalAdmin');
    const expenseTotalAdminEl = document.getElementById('expenseTotalAdmin');
    const totalIncomePublicEl = document.getElementById('totalIncomePublic');
    const totalExpensesPublicEl = document.getElementById('totalExpensesPublic');
    const remainingBalancePublicEl = document.getElementById('remainingBalancePublic');
    const totalIncomeAdminEl = document.getElementById('totalIncomeAdmin');
    const totalExpensesAdminEl = document.getElementById('totalExpensesAdmin');
    const remainingBalanceAdminEl = document.getElementById('remainingBalanceAdmin');
    const cancelIncomeEditBtn = document.getElementById('cancelIncomeEdit');
    const cancelExpenseEditBtn = document.getElementById('cancelExpenseEdit');
    const exportIncomeExcelBtn = document.getElementById('exportIncomeExcel');
    const exportExpenseExcelBtn = document.getElementById('exportExpenseExcel');
    const uploadIncomeExcelButton = document.getElementById('uploadIncomeExcelButton');
    const incomeExcelFileInput = document.getElementById('incomeExcelFileInput');
    const uploadExpenseExcelButton = document.getElementById('uploadExpenseExcelButton');
    const expenseExcelFileInput = document.getElementById('expenseExcelFileInput');
    const titleSelect = document.getElementById('titleSelect');
    const nameInput = document.getElementById('nameInput');
    const referralInput = document.getElementById('referralInput');
    const locationCityInput = document.getElementById('locationCityInput');
    const phoneNoInput = document.getElementById('phoneNoInput');
    const typeOfContributionInput = document.getElementById('typeOfContributionInput');
    const remarksInput = document.getElementById('remarksInput');

    // Event Management Elements (Admin & Public)
    const addEventForm = document.getElementById('addEventForm');
    const eventsTableAdminBody = document.getElementById('eventsTableAdminBody');
    const cancelEventEditBtn = document.getElementById('cancelEventEdit');
    const eventsGridPublic = document.getElementById('eventsGridPublic'); 

    // Gallery Management Elements (Admin & Public)
    const addGalleryImageForm = document.getElementById('addGalleryImageForm');
    const galleryImagesTableAdminBody = document.getElementById('galleryImagesTableAdminBody');
    const cancelGalleryImageEditBtn = document.getElementById('cancelGalleryImageEdit');
    const templeGalleryGrid = document.getElementById('templeGalleryGrid');

    const HARDCODED_USERNAME = "Admin";
    const HARDCODED_PASSWORD = "Panduranga@123";

    let summaryChartPublicInstance = null;
    let summaryChartAdminInstance = null;

    let allIncomeData = {};
    let allExpenseData = {};
    let allEventsData = {}; 
    let allGalleryData = {}; // For gallery images

    const currentYearEl = document.getElementById('currentYear');
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }

    // --- Authentication & Page Mode ---
    function isAdminLoggedIn() {
        return sessionStorage.getItem('isAdminLoggedIn') === 'true';
    }

    function checkAuth() {
        const currentPage = window.location.pathname.split("/").pop();
        if (currentPage === 'admin.html') {
            if (!isAdminLoggedIn()) {
                window.location.href = 'index.html';
            } else {
                loadAdminData();
                if (adminLogoutButton) adminLogoutButton.style.display = 'block';
                setupExcelUploadListeners();
            }
        } else { // index.html
            loadPublicData();
            if (isAdminLoggedIn()) {
                if (loginToggleButton) loginToggleButton.textContent = 'Admin Dashboard';
                if (loginToggleButton) loginToggleButton.classList.remove('btn-outline-light'); 
                if (loginToggleButton) loginToggleButton.classList.add('btn-success');
                if (logoutButton) logoutButton.style.display = 'inline-block'; 
                if (loginSection) loginSection.style.display = 'none';
            } else {
                if (loginToggleButton) loginToggleButton.textContent = 'Admin Login';
                if (loginToggleButton) loginToggleButton.classList.remove('btn-success');
                if (loginToggleButton) loginToggleButton.classList.add('btn-outline-light'); 
                if (logoutButton) logoutButton.style.display = 'none';
            }
        }
    }

    if (loginToggleButton) {
        loginToggleButton.addEventListener('click', () => {
            if (isAdminLoggedIn()) {
                window.location.href = 'admin.html';
            } else {
                if (loginSection) loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
                if (loginSection && loginSection.style.display === 'block') {
                    loginSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const loginError = document.getElementById('loginError');

            if (username === HARDCODED_USERNAME && password === HARDCODED_PASSWORD) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                window.location.href = 'admin.html';
            } else {
                if (loginError) loginError.textContent = 'Invalid username or password.';
            }
        });
    }

    function logout() {
        sessionStorage.removeItem('isAdminLoggedIn');
        window.location.href = 'index.html';
    }

    if (logoutButton) logoutButton.addEventListener('click', logout);
    if (adminLogoutButton) adminLogoutButton.addEventListener('click', logout);


    // --- Data Fetching and Rendering ---
    function loadPublicData() {
        // Fetch Income
        database.ref('income').on('value', snapshot => {
            allIncomeData = snapshot.val() || {};
            updateTotalsAndChart();
        });

        // Fetch Expenses
        database.ref('expenses').on('value', snapshot => {
            allExpenseData = snapshot.val() || {};
            updateTotalsAndChart();
        });

        // Fetch Events for Public Page
        database.ref('events').orderByChild('date').on('value', snapshot => { 
            allEventsData = snapshot.val() || {};
            if (eventsGridPublic) renderPublicEventsGrid(allEventsData);
        });

        // Fetch Gallery Images for Public Page
        database.ref('gallery').orderByChild('timestamp').on('value', snapshot => { 
            allGalleryData = snapshot.val() || {};
            if (templeGalleryGrid) renderPublicGalleryGrid(allGalleryData);
        });
    }

    function loadAdminData() {
        if (!isAdminLoggedIn() || !(document.getElementById('adminLogoutButton') || (document.querySelector('.navbar-brand') && document.querySelector('.navbar-brand').textContent.includes('Admin Panel')))) return;


        // Income for Admin
        database.ref('income').on('value', snapshot => {
            allIncomeData = snapshot.val() || {};
            if(incomeStatementTableAdminBody) renderCategorizedIncomeTable(incomeStatementTableAdminBody, allIncomeData, 'incomeStatement', true);
            if(materialsTableAdminBody) renderCategorizedIncomeTable(materialsTableAdminBody, allIncomeData, 'materials', true);
            if(miscellaneousTableAdminBody) renderCategorizedIncomeTable(miscellaneousTableAdminBody, allIncomeData, 'miscellaneous', true);
            updateTotalsAndChart();
        });

        // Expenses for Admin
        database.ref('expenses').on('value', snapshot => {
            allExpenseData = snapshot.val() || {};
            if(expenseTableAdminBody) renderExpenseTable(expenseTableAdminBody, allExpenseData, true);
            updateTotalsAndChart();
        });

        // Events for Admin
        database.ref('events').orderByChild('date').on('value', snapshot => {
            allEventsData = snapshot.val() || {};
            if(eventsTableAdminBody) renderEventsTableAdmin(allEventsData);
        });

        // Gallery Images for Admin
        database.ref('gallery').orderByChild('timestamp').on('value', snapshot => { 
            allGalleryData = snapshot.val() || {};
            if(galleryImagesTableAdminBody) renderGalleryTableAdmin(allGalleryData);
        });
    }

    function getNextSNo(dataObject) {
        if (!dataObject || Object.keys(dataObject).length === 0) return 1;
        const sNos = Object.values(dataObject).map(item => parseInt(item.sNo, 10) || 0).filter(sNo => !isNaN(sNo));
        return sNos.length > 0 ? Math.max(0, ...sNos) + 1 : 1;
    }


    // --- Income Operations (Admin) ---
    if (addIncomeForm) {
        addIncomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('incomeEditId').value;
            const incomeData = {
                sNo: editId && allIncomeData[editId] ? allIncomeData[editId].sNo : getNextSNo(allIncomeData),
                category: document.getElementById('incomeCategory').value,
                title: titleSelect.value,
                name: nameInput.value,
                referral: referralInput.value,
                locationCity: locationCityInput.value,
                phoneNo: phoneNoInput.value,
                typeOfContribution: typeOfContributionInput.value,
                amount: parseFloat(document.getElementById('incomeAmount').value),
                remarks: remarksInput.value,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            if (editId) {
                database.ref('income/' + editId).update(incomeData)
                    .then(() => resetIncomeForm())
                    .catch(err => console.error("Error updating income:", err));
            } else {
                const newIncomeRef = database.ref('income').push();
                newIncomeRef.set(incomeData)
                    .then(() => resetIncomeForm())
                    .catch(err => console.error("Error adding income:", err));
            }
        });
    }

    function resetIncomeForm() {
        if (addIncomeForm) addIncomeForm.reset();
        if (document.getElementById('incomeEditId')) document.getElementById('incomeEditId').value = '';
        if (document.getElementById('incomeCategory')) document.getElementById('incomeCategory').value = 'incomeStatement';
        if (titleSelect) titleSelect.value = '';
        if (cancelIncomeEditBtn) cancelIncomeEditBtn.style.display = 'none';
    }
    if (cancelIncomeEditBtn) cancelIncomeEditBtn.addEventListener('click', resetIncomeForm);


    // --- Expense Operations (Admin) ---
    if (addExpenseForm) {
        addExpenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('expenseEditId').value;
            const expenseData = {
                sNo: editId && allExpenseData[editId] ? allExpenseData[editId].sNo : getNextSNo(allExpenseData),
                date: document.getElementById('expenseDate').value,
                description: document.getElementById('expenseDescription').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            if (editId) {
                database.ref('expenses/' + editId).update(expenseData)
                    .then(() => resetExpenseForm())
                    .catch(err => console.error("Error updating expense:", err));
            } else {
                const newExpenseRef = database.ref('expenses').push();
                newExpenseRef.set(expenseData)
                    .then(() => resetExpenseForm())
                    .catch(err => console.error("Error adding expense:", err));
            }
        });
    }

    function resetExpenseForm() {
        if (addExpenseForm) addExpenseForm.reset();
        if (document.getElementById('expenseEditId')) document.getElementById('expenseEditId').value = '';
        if (cancelExpenseEditBtn) cancelExpenseEditBtn.style.display = 'none';
    }
    if (cancelExpenseEditBtn) cancelExpenseEditBtn.addEventListener('click', resetExpenseForm);

    // --- Event Operations (Admin) ---
    if (addEventForm) {
        addEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('eventEditId').value;
            const eventData = {
                name: document.getElementById('eventName').value,
                date: document.getElementById('eventDate').value,
                description: document.getElementById('eventDescription').value,
                imageUrl: document.getElementById('eventImageUrl').value,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            if (editId) {
                database.ref('events/' + editId).update(eventData)
                    .then(() => resetEventForm())
                    .catch(err => console.error("Error updating event:", err));
            } else {
                const newEventRef = database.ref('events').push();
                newEventRef.set(eventData)
                    .then(() => resetEventForm())
                    .catch(err => console.error("Error adding event:", err));
            }
        });
    }

    function resetEventForm() {
        if (addEventForm) addEventForm.reset();
        if (document.getElementById('eventEditId')) document.getElementById('eventEditId').value = '';
        if (cancelEventEditBtn) cancelEventEditBtn.style.display = 'none';
    }
    if (cancelEventEditBtn) cancelEventEditBtn.addEventListener('click', resetEventForm);

    // --- Gallery Image Operations (Admin) ---
    if (addGalleryImageForm) {
        addGalleryImageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('galleryImageEditId').value;
            const galleryImageData = {
                imageUrl: document.getElementById('galleryImageUrl').value,
                caption: document.getElementById('galleryImageCaption').value || "", 
                timestamp: firebase.database.ServerValue.TIMESTAMP 
            };

            if (editId) {
                database.ref('gallery/' + editId).update(galleryImageData)
                    .then(() => resetGalleryImageForm())
                    .catch(err => console.error("Error updating gallery image:", err));
            } else {
                const newGalleryImageRef = database.ref('gallery').push();
                newGalleryImageRef.set(galleryImageData)
                    .then(() => resetGalleryImageForm())
                    .catch(err => console.error("Error adding gallery image:", err));
            }
        });
    }

    function resetGalleryImageForm() {
        if (addGalleryImageForm) addGalleryImageForm.reset();
        if (document.getElementById('galleryImageEditId')) document.getElementById('galleryImageEditId').value = '';
        if (cancelGalleryImageEditBtn) cancelGalleryImageEditBtn.style.display = 'none';
    }
    if (cancelGalleryImageEditBtn) cancelGalleryImageEditBtn.addEventListener('click', resetGalleryImageForm);


    // --- Table Rendering ---
    function renderCategorizedIncomeTable(tbody, allData, categoryFilter, isAdminTable) {
        if (!tbody) return;
        tbody.innerHTML = '';
        let displaySNo = 1;
        let categoryTotalAmount = 0;

        const filteredAndSortedData = Object.entries(allData)
            .filter(([, record]) => categoryFilter === null || record.category === categoryFilter)
            .sort(([, a], [, b]) => (a.sNo || Infinity) - (b.sNo || Infinity));

        for (const [id, record] of filteredAndSortedData) {
            const row = tbody.insertRow();
            row.insertCell().textContent = displaySNo++;
            row.insertCell().textContent = record.title || '-';
            row.insertCell().textContent = record.name;
            row.insertCell().textContent = record.referral || '-';
            row.insertCell().textContent = record.locationCity || '-';
            row.insertCell().textContent = record.phoneNo || '-';
            row.insertCell().textContent = record.typeOfContribution;
            row.insertCell().textContent = `₹${(record.amount || 0).toFixed(2)}`;
            row.insertCell().textContent = record.remarks || '-';

            categoryTotalAmount += (record.amount || 0);

            if (isAdminTable) {
                const actionsCell = row.insertCell();
                const editBtn = document.createElement('button');
                editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'mr-1');
                editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editBtn.onclick = () => editIncomeRecord(id, record);
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteBtn.onclick = () => deleteRecord('income', id);
                actionsCell.appendChild(deleteBtn);
            }
        }

        if (isAdminTable) {
            if (categoryFilter === 'incomeStatement' && incomeStatementTotalAdminEl) {
                incomeStatementTotalAdminEl.textContent = `₹${categoryTotalAmount.toFixed(2)}`;
            } else if (categoryFilter === 'materials' && materialsTotalAdminEl) {
                materialsTotalAdminEl.textContent = `₹${categoryTotalAmount.toFixed(2)}`;
            } else if (categoryFilter === 'miscellaneous' && miscellaneousTotalAdminEl) {
                miscellaneousTotalAdminEl.textContent = `₹${categoryTotalAmount.toFixed(2)}`;
            }
        }
    }

    function renderExpenseTable(tbody, data, isAdminTable) {
        if (!tbody) return;
        tbody.innerHTML = '';
        let displaySNo = 1;
        let tableTotalAmount = 0;

        const sortedData = Object.entries(data).sort(([,a], [,b]) => (a.sNo || Infinity) - (b.sNo || Infinity));

        for (const [id, record] of sortedData) {
            const row = tbody.insertRow();
            row.insertCell().textContent = displaySNo++;
            row.insertCell().textContent = record.date;
            row.insertCell().textContent = record.description;
            row.insertCell().textContent = `₹${(record.amount || 0).toFixed(2)}`;

            tableTotalAmount += (record.amount || 0);

            if (isAdminTable) {
                const actionsCell = row.insertCell();
                const editBtn = document.createElement('button');
                editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'mr-1');
                editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
                editBtn.onclick = () => editExpenseRecord(id, record);
                actionsCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
                deleteBtn.onclick = () => deleteRecord('expenses', id);
                actionsCell.appendChild(deleteBtn);
            }
        }

        if (isAdminTable && expenseTotalAdminEl) {
            expenseTotalAdminEl.textContent = `₹${tableTotalAmount.toFixed(2)}`;
        }
    }

    function renderEventsTableAdmin(data) {
        if (!eventsTableAdminBody) return;
        eventsTableAdminBody.innerHTML = '';

        const sortedEvents = Object.entries(data).sort(([,a], [,b]) => new Date(b.date) - new Date(a.date)); 

        if (sortedEvents.length === 0) {
            const row = eventsTableAdminBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = 'No events found.';
            cell.style.textAlign = 'center';
            return;
        }
        
        for (const [id, event] of sortedEvents) {
            const row = eventsTableAdminBody.insertRow();
            row.insertCell().textContent = event.name;
            row.insertCell().textContent = new Date(event.date).toLocaleDateString('en-CA'); 
            const descCell = row.insertCell();
            descCell.textContent = event.description.substring(0, 50) + (event.description.length > 50 ? '...' : '');
            descCell.title = event.description; 
            
            const imgCell = row.insertCell();
            const img = document.createElement('img');
            img.src = event.imageUrl;
            img.alt = event.name;
            img.style.width = '60px'; 
            img.style.height = '60px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            imgCell.appendChild(img);

            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'mr-1');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.onclick = () => editEventRecord(id, event);
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = () => deleteRecord('events', id);
            actionsCell.appendChild(deleteBtn);
        }
    }

    function renderPublicEventsGrid(data) {
        if (!eventsGridPublic) return;
        eventsGridPublic.innerHTML = ''; 

        const today = new Date(new Date().toDateString()); 

        const upcomingEvents = Object.entries(data)
            .map(([id, event]) => ({ ...event, id })) 
            .filter(event => {
                const eventDate = new Date(event.date);
                return !isNaN(eventDate.getTime()) && eventDate >= today; 
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date)); 

        if (upcomingEvents.length === 0) {
            eventsGridPublic.innerHTML = '<div class="col-12"><p class="no-events-message">No upcoming events scheduled at this time. Please check back later.</p></div>';
            return;
        }
        
        const eventsToShow = upcomingEvents.slice(0, 6); 

        for (const event of eventsToShow) {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4 mb-4 d-flex align-items-stretch'; 

            const card = document.createElement('div');
            card.className = 'card event-card h-100 shadow-sm w-100'; 

            const img = document.createElement('img');
            img.src = event.imageUrl || 'https://via.placeholder.com/350x200.png?text=Event+Image'; 
            img.className = 'card-img-top event-image';
            img.alt = event.name;
            img.onerror = function() { 
                this.onerror=null; this.src='https://via.placeholder.com/350x200.png?text=Image+Not+Found';
            };


            const cardBody = document.createElement('div');
            cardBody.className = 'card-body d-flex flex-column';

            const title = document.createElement('h5');
            title.className = 'card-title event-name';
            title.textContent = event.name;

            const date = document.createElement('p');
            date.className = 'card-text event-date';
            const eventDateObj = new Date(event.date);
            date.innerHTML = `<i class="fas fa-calendar-alt"></i> ${eventDateObj.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}`;
            
            const description = document.createElement('p');
            description.className = 'card-text event-description mt-2';
            description.textContent = event.description.substring(0, 100) + (event.description.length > 100 ? '...' : '');
            if (event.description.length > 100) description.title = event.description; 

            cardBody.appendChild(title);
            cardBody.appendChild(date);
            cardBody.appendChild(description);

            card.appendChild(img);
            card.appendChild(cardBody);
            col.appendChild(card);
            eventsGridPublic.appendChild(col);
        }
    }

    function renderGalleryTableAdmin(data) {
        if (!galleryImagesTableAdminBody) return;
        galleryImagesTableAdminBody.innerHTML = '';

        const sortedGalleryImages = Object.entries(data).sort(([,a], [,b]) => (b.timestamp || 0) - (a.timestamp || 0)); // Newest first

        if (sortedGalleryImages.length === 0) {
            const row = galleryImagesTableAdminBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 3; 
            cell.textContent = 'No gallery images found.';
            cell.style.textAlign = 'center';
            return;
        }
        
        for (const [id, imageItem] of sortedGalleryImages) {
            const row = galleryImagesTableAdminBody.insertRow();
            
            const imgCell = row.insertCell();
            const img = document.createElement('img');
            img.src = imageItem.imageUrl;
            img.alt = imageItem.caption || 'Gallery Image';
            imgCell.appendChild(img); // CSS handles admin table image style

            row.insertCell().textContent = imageItem.caption || '-';

            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'mr-1');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.onclick = () => editGalleryImageRecord(id, imageItem);
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = () => deleteRecord('gallery', id); 
            actionsCell.appendChild(deleteBtn);
        }
    }

    function renderPublicGalleryGrid(data) {
        if (!templeGalleryGrid) return;
        templeGalleryGrid.innerHTML = ''; 

        const sortedImages = Object.entries(data)
            .map(([id, item]) => ({ ...item, id })) 
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); 

        if (sortedImages.length === 0) {
            templeGalleryGrid.innerHTML = '<div class="col-12"><p class="no-gallery-message">No images in the gallery yet. Please check back later.</p></div>';
            return;
        }
        
        const imagesToShow = sortedImages.slice(0, 12); 

        for (const item of imagesToShow) {
            const col = document.createElement('div');
            col.className = 'col-sm-6 col-md-4 col-lg-3 mb-4'; 

            const galleryItemDiv = document.createElement('div');
            galleryItemDiv.className = 'gallery-item h-100'; 

            const img = document.createElement('img');
            img.src = item.imageUrl || 'https://via.placeholder.com/300x250.png?text=Temple+Image';
            img.alt = item.caption || 'Temple Gallery Image';
            img.onerror = function() { 
                this.onerror=null; this.src='https://via.placeholder.com/300x250.png?text=Image+Error';
            };

            galleryItemDiv.appendChild(img);

            if (item.caption && item.caption.trim() !== "") { // Check if caption exists and is not empty
                const captionDiv = document.createElement('div');
                captionDiv.className = 'gallery-caption';
                captionDiv.textContent = item.caption;
                galleryItemDiv.appendChild(captionDiv);
            }
            
            col.appendChild(galleryItemDiv);
            templeGalleryGrid.appendChild(col);
        }
    }

    // --- Edit/Delete Functions (Admin) ---
    function editIncomeRecord(id, record) {
        document.getElementById('incomeEditId').value = id;
        document.getElementById('incomeCategory').value = record.category || 'incomeStatement';
        if(titleSelect) titleSelect.value = record.title || '';
        if(nameInput) nameInput.value = record.name || '';
        if(referralInput) referralInput.value = record.referral || '';
        if(locationCityInput) locationCityInput.value = record.locationCity || '';
        if(phoneNoInput) phoneNoInput.value = record.phoneNo || '';
        if(typeOfContributionInput) typeOfContributionInput.value = record.typeOfContribution || '';
        document.getElementById('incomeAmount').value = record.amount || 0;
        if(remarksInput) remarksInput.value = record.remarks || '';

        if (cancelIncomeEditBtn) cancelIncomeEditBtn.style.display = 'inline-block';
        if (addIncomeForm) addIncomeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function editExpenseRecord(id, record) {
        document.getElementById('expenseEditId').value = id;
        document.getElementById('expenseDate').value = record.date;
        document.getElementById('expenseDescription').value = record.description;
        document.getElementById('expenseAmount').value = record.amount || 0;

        if (cancelExpenseEditBtn) cancelExpenseEditBtn.style.display = 'inline-block';
        if (addExpenseForm) addExpenseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function editEventRecord(id, event) {
        document.getElementById('eventEditId').value = id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date; 
        document.getElementById('eventDescription').value = event.description;
        document.getElementById('eventImageUrl').value = event.imageUrl;

        if (cancelEventEditBtn) cancelEventEditBtn.style.display = 'inline-block';
        if (addEventForm) addEventForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function editGalleryImageRecord(id, imageItem) {
        if (document.getElementById('galleryImageEditId')) document.getElementById('galleryImageEditId').value = id;
        if (document.getElementById('galleryImageUrl')) document.getElementById('galleryImageUrl').value = imageItem.imageUrl;
        if (document.getElementById('galleryImageCaption')) document.getElementById('galleryImageCaption').value = imageItem.caption || '';

        if (cancelGalleryImageEditBtn) cancelGalleryImageEditBtn.style.display = 'inline-block';
        if (addGalleryImageForm) addGalleryImageForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function deleteRecord(type, id) { 
        const recordNameMapping = {
            'income': 'contribution',
            'expenses': 'expense',
            'events': 'event',
            'gallery': 'gallery image'
        };
        const recordName = recordNameMapping[type] || type.slice(0,-1);

        if (confirm(`Are you sure you want to delete this ${recordName} record? This action cannot be undone.`)) {
            database.ref(`${type}/${id}`).remove()
                .then(() => {
                    console.log(`${type} record ${id} deleted successfully.`);
                    if (type === 'events') resetEventForm(); 
                    else if (type === 'income') resetIncomeForm();
                    else if (type === 'expenses') resetExpenseForm();
                    else if (type === 'gallery') resetGalleryImageForm();
                })
                .catch(err => console.error(`Error deleting ${type}:`, err));
        }
    }

    // --- Totals and Chart ---
    function updateTotalsAndChart() {
        let totalIncomeStatement = 0;
        let totalMaterials = 0;
        let totalMiscellaneous = 0;
        let currentTotalIncome = 0;

        Object.values(allIncomeData).forEach(item => {
            const amount = item.amount || 0;
            currentTotalIncome += amount;
            if (item.category === 'incomeStatement') {
                totalIncomeStatement += amount;
            } else if (item.category === 'materials') {
                totalMaterials += amount;
            } else if (item.category === 'miscellaneous') {
                totalMiscellaneous += amount;
            }
        });

        let currentTotalExpenses = 0;
        Object.values(allExpenseData).forEach(item => currentTotalExpenses += (item.amount || 0));

        const currentRemainingBalance = currentTotalIncome - currentTotalExpenses;

        if (totalIncomePublicEl) totalIncomePublicEl.textContent = `₹${currentTotalIncome.toFixed(2)}`;
        if (totalExpensesPublicEl) totalExpensesPublicEl.textContent = `₹${currentTotalExpenses.toFixed(2)}`;
        if (remainingBalancePublicEl) remainingBalancePublicEl.textContent = `₹${currentRemainingBalance.toFixed(2)}`;

        if (totalIncomeAdminEl) totalIncomeAdminEl.textContent = `₹${currentTotalIncome.toFixed(2)}`;
        if (totalExpensesAdminEl) totalExpensesAdminEl.textContent = `₹${currentTotalExpenses.toFixed(2)}`;
        if (remainingBalanceAdminEl) remainingBalanceAdminEl.textContent = `₹${currentRemainingBalance.toFixed(2)}`;

        renderChart('summaryChartPublic', totalIncomeStatement, totalMaterials, totalMiscellaneous, currentTotalExpenses);
        renderChart('summaryChartAdmin', totalIncomeStatement, totalMaterials, totalMiscellaneous, currentTotalExpenses);
    }

    function renderChart(canvasId, incomeStatementAmt, materialsAmt, miscellaneousAmt, expensesAmt) { 
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        let chartInstanceToUpdate = null;
        if (canvasId === 'summaryChartPublic') {
            if (summaryChartPublicInstance) summaryChartPublicInstance.destroy();
            chartInstanceToUpdate = summaryChartPublicInstance;
        } else if (canvasId === 'summaryChartAdmin') {
            if (summaryChartAdminInstance) summaryChartAdminInstance.destroy();
            chartInstanceToUpdate = summaryChartAdminInstance;
        }


        const chartDataValues = [
            Math.max(0, incomeStatementAmt),
            Math.max(0, materialsAmt),
            Math.max(0, miscellaneousAmt),
            Math.max(0, expensesAmt)
        ];

        const chartLabels = ['Income Stmt.', 'Materials', 'Misc.', 'Expenses']; 
        
        const chartBackgroundColors = [
            'rgba(230, 15, 147, 0.9)',  
            'rgba(147, 253, 48, 0.9)',   
            'rgba(124, 84, 161, 0.9)',   
            'rgba(253, 145, 22, 0.9)'    
        ];
        const chartBorderColors = [ 
            'rgba(0, 123, 255, 1)',
            'rgba(40, 167, 69, 1)',
            'rgba(255, 193, 7, 1)',
            'rgb(44, 223, 124)'
        ];

        const newChart = new Chart(ctx.getContext('2d'), {
            type: 'pie', 
            data: {
                labels: chartLabels, 
                datasets: [{
                    label: 'Fund Summary',
                    data: chartDataValues, 
                    backgroundColor: chartBackgroundColors, 
                    borderColor: chartBorderColors, 
                    borderWidth: 1,
                    hoverOffset: 15, 
                    hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true, 
                maintainAspectRatio: false,
                layout : { padding: { top: 5, bottom: 10, left: 5, right: 5 } }, 
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: {
                            boxWidth: 20,
                            padding: 15,
                            font: { size: 10 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.labels ? context.dataset.labels[context.dataIndex] : context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        if (canvasId === 'summaryChartPublic') summaryChartPublicInstance = newChart;
        else if (canvasId === 'summaryChartAdmin') summaryChartAdminInstance = newChart;
    }


    // --- PDF Export ---
    if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
        const { jsPDF } = window.jspdf;
        const pdfInstanceForCheck = new jsPDF();
        if (typeof pdfInstanceForCheck.autoTable === 'function') {
            const exportIncomePdfBtn = document.getElementById('exportIncomePdf');
            const exportExpensePdfBtn = document.getElementById('exportExpensePdf');

            if (exportIncomePdfBtn) {
                exportIncomePdfBtn.addEventListener('click', () => {
                    exportCombinedIncomeToPDF_SingleFile(allIncomeData, 'Temple_Overall_Contribution_Records.pdf', 'Overall Contribution Records');
                });
            }
            if (exportExpensePdfBtn) {
                exportExpensePdfBtn.addEventListener('click', () => {
                    const expenseHeaders = ['S.No', 'Date', 'Description', 'Amount'];
                    exportTableToPDF('expenseTableAdminBody', 'Temple_Expense_Records.pdf', 'Temple Expense Records', expenseHeaders, 'expenseTotalAdmin');
                });
            }

            function exportCombinedIncomeToPDF_SingleFile(incomeData, filename, title) {
                try {
                    const pdfDoc = new jsPDF({ orientation: 'landscape' });
                    const newHeaders = ['S.No', 'Mr/Mrs', 'Name', 'Referral', 'Location/City', 'Phone No', 'Type Of Contribution', 'Amount', 'Remarks'];

                    let grandTotalCombinedIncome = 0;
                    const categories = {
                        incomeStatement: { name: "Income Statement", color: [52, 152, 219] },
                        materials: { name: "Materials", color: [46, 204, 113] },
                        miscellaneous: { name: "Miscellaneous Expenditures", color: [243, 156, 18] }
                    };
                    const categoryTotalStyle = { fillColor: [52, 73, 94], textColor: [255, 255, 255] };

                    let currentY = 15;
                    const pageMargin = 10;
                    const lineHeight = 6;
                    const sectionSpacing = 8;
                    const sectionTitleSpacing = 7;

                    const mainHeaderText = ["Sri Krishna Panduranga Vittala Baktha Samajam", "And Park Development Account"];
                    const addressText = "Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.";
                    const overallDocTitle = title;
                    const pageWidth = pdfDoc.internal.pageSize.getWidth();

                    pdfDoc.setFontSize(14);
                    pdfDoc.setFont(undefined, 'bold');
                    mainHeaderText.forEach(line => {
                        pdfDoc.text(line, pageWidth / 2, currentY, { align: 'center' });
                        currentY += lineHeight + 1;
                    });
                    pdfDoc.setFont(undefined, 'normal');

                    pdfDoc.setFontSize(10);
                    pdfDoc.text(addressText, pageWidth / 2, currentY, { align: 'center' });
                    currentY += lineHeight + 2;

                    pdfDoc.setFontSize(12);
                    pdfDoc.setFont(undefined, 'bold');
                    pdfDoc.text(overallDocTitle, pageWidth / 2, currentY, { align: 'center' });
                    currentY += lineHeight + 5;
                    pdfDoc.setFont(undefined, 'normal');


                    for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
                        const categoryData = Object.values(incomeData)
                            .filter(record => record.category === categoryKey)
                            .sort((a, b) => (a.sNo || Infinity) - (b.sNo || Infinity));

                        if (categoryData.length === 0) continue;

                        if (currentY + sectionTitleSpacing + 20 > pdfDoc.internal.pageSize.getHeight() - pageMargin) {
                            pdfDoc.addPage();
                            currentY = pageMargin;
                        }

                        pdfDoc.setFontSize(13);
                        pdfDoc.setFont(undefined, 'bold');
                        pdfDoc.text(categoryInfo.name, pageMargin, currentY);
                        pdfDoc.setFont(undefined, 'normal');
                        currentY += sectionTitleSpacing;

                        let categorySNo = 1;
                        let categoryTotalAmount = 0;
                        const bodyRows = categoryData.map(record => {
                            categoryTotalAmount += (record.amount || 0);
                            return [
                                categorySNo++,
                                record.title || '-',
                                record.name || '-',
                                record.referral || '-',
                                record.locationCity || '-',
                                record.phoneNo || '-',
                                record.typeOfContribution || '-',
                                (record.amount || 0).toFixed(2),
                                record.remarks || '-'
                            ];
                        });
                        grandTotalCombinedIncome += categoryTotalAmount;

                        const categoryFooterRow = [
                            { content: `Total for ${categoryInfo.name}:`, colSpan: newHeaders.length - 2, styles: { halign: 'right', fontStyle: 'bold', ...categoryTotalStyle } },
                            { content: `${categoryTotalAmount.toFixed(2)}`, styles: { fontStyle: 'bold', halign: 'right', ...categoryTotalStyle } },
                            { content: '', styles: { ...categoryTotalStyle } } 
                        ];

                        pdfDoc.autoTable({
                            head: [newHeaders],
                            body: bodyRows,
                            startY: currentY,
                            theme: 'grid',
                            headStyles: { fillColor: categoryInfo.color, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                            bodyStyles: { fontSize: 7, cellPadding: 1.5 },
                            foot: [categoryFooterRow],
                            footStyles: { fontSize: 8, fontStyle: 'bold' },
                            columnStyles: {
                                0: { cellWidth: 10 }, 1: { cellWidth: 15 }, 2: { cellWidth: 35 },
                                3: { cellWidth: 25 }, 4: { cellWidth: 30 }, 5: { cellWidth: 25 },
                                6: { cellWidth: 40 }, 7: { cellWidth: 20, halign: 'right' }, 8: { cellWidth: 'auto' },
                            },
                            margin: { left: pageMargin, right: pageMargin }
                        });
                        currentY = pdfDoc.lastAutoTable.finalY + sectionSpacing;
                    }

                    if (currentY + lineHeight + 5 > pdfDoc.internal.pageSize.getHeight() - pageMargin) {
                        pdfDoc.addPage();
                        currentY = pageMargin;
                    }
                    pdfDoc.setFontSize(12);
                    pdfDoc.setFont(undefined, 'bold');
                    pdfDoc.text(`Grand Total All Contributions: ${grandTotalCombinedIncome.toFixed(2)}`, pageMargin, currentY);

                    pdfDoc.save(filename);
                } catch (error) {
                    console.error("Error during PDF generation for combined income (single file):", error);
                    alert("An error occurred while generating the PDF: " + error.message);
                }
            }


            function exportTableToPDF(tableBodyId, filename, title, headers, tableTotalElementId) {
                try {
                    const pdfDoc = new jsPDF();
                    const tableBodyElement = document.getElementById(tableBodyId);
                    if (!tableBodyElement) { alert(`Error: Table body with ID '${tableBodyId}' not found.`); return; }

                    const clonedTbody = tableBodyElement.cloneNode(true);
                    const dataRows = Array.from(clonedTbody.rows).map(row => {
                        const cells = Array.from(row.cells);
                        return cells.slice(0, headers.length).map(cell => {
                            let text = cell.textContent.trim();
                            if (text.startsWith('₹')) text = text.substring(1);
                            return text;
                        });
                    });


                    let currentY = 15; const pageMargin = 14; const lineHeight = 7;
                    const mainHeaderText = ["Sri Krishna Panduranga Vittala Baktha Samajam", "And Park Development Account"];
                    const addressText = "Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.";
                    const pageWidth = pdfDoc.internal.pageSize.getWidth();

                    pdfDoc.setFontSize(14); pdfDoc.setFont(undefined, 'bold');
                    mainHeaderText.forEach(line => { pdfDoc.text(line, pageWidth / 2, currentY, { align: 'center' }); currentY += lineHeight +1; });
                    pdfDoc.setFont(undefined, 'normal');

                    pdfDoc.setFontSize(10);
                    pdfDoc.text(addressText, pageWidth / 2, currentY, { align: 'center' }); currentY += lineHeight + 2;

                    pdfDoc.setFontSize(12); pdfDoc.setFont(undefined, 'bold');
                    pdfDoc.text(title, pageWidth / 2, currentY, { align: 'center' }); currentY += lineHeight + 5;
                    pdfDoc.setFont(undefined, 'normal');

                    let footerRowConfig = [];
                    if (tableTotalElementId) {
                        const totalAmountEl = document.getElementById(tableTotalElementId);
                        if (totalAmountEl) {
                            let totalAmountText = totalAmountEl.textContent.trim();
                            if (totalAmountText.startsWith('₹')) totalAmountText = totalAmountText.substring(1);

                            const amountColIndex = headers.findIndex(h => h.toLowerCase() === 'amount');
                            if (amountColIndex !== -1) {
                                let footerCells = [];
                                if (amountColIndex > 0) {
                                    footerCells.push({ content: 'Total Amount:', colSpan: amountColIndex, styles: { halign: 'right', fontStyle: 'bold', fillColor: [52, 73, 94], textColor: [255,255,255] } });
                                } else { 
                                     footerCells.push({ content: 'Total Amount:', styles: { halign: 'right', fontStyle: 'bold', fillColor: [52, 73, 94], textColor: [255,255,255] } });
                                }
                                footerCells.push({ content: totalAmountText, styles: { fontStyle: 'bold', halign: 'right', fillColor: [52, 73, 94], textColor: [255,255,255] } });
                                
                                const remainingCols = headers.length - (amountColIndex + 1);
                                if (remainingCols > 0) {
                                    footerCells.push({ content: '', colSpan: remainingCols, styles: {fillColor: [52, 73, 94], textColor: [255,255,255]}});
                                }
                                footerRowConfig.push(footerCells);
                            }
                        }
                    }
                    
                    pdfDoc.autoTable({
                        head: [headers],
                        body: dataRows,
                        startY: currentY,
                        theme: 'grid',
                        headStyles: { fillColor: [22, 160, 133], textColor: [255,255,255], fontStyle: 'bold' },
                        foot: footerRowConfig.length > 0 ? footerRowConfig : undefined,
                        footStyles: { fontSize: 10, fontStyle: 'bold'},
                        margin: { left: pageMargin, right: pageMargin }
                    });
                    pdfDoc.save(filename);
                } catch (error) {
                    console.error("Error during PDF generation:", error);
                    alert("An error occurred while generating the PDF: " + error.message);
                }
            }
        } else { console.error("PDF Export: AutoTable plugin not found or not correctly loaded."); disablePdfButtonsWithError("PDF Export: AutoTable plugin issue."); }
    } else { console.error("PDF Export: Core jsPDF library not loaded."); disablePdfButtonsWithError("PDF Export: Core jsPDF library not loaded."); }

    function disablePdfButtonsWithError(errorMessage) {
        const btns = [document.getElementById('exportIncomePdf'), document.getElementById('exportExpensePdf')];
        const pdfErrorMsg = errorMessage + " Please check console or contact support.";
        btns.forEach(btn => { if (btn) { btn.onclick = () => alert(pdfErrorMsg); btn.disabled = true; btn.title = pdfErrorMsg; } });
    }

    // --- Excel Export ---
    function exportCategorizedIncomeToExcel_SingleSheet(allIncomeData, baseFilename) {
        try {
            const wb = XLSX.utils.book_new();
            const categories = {
                incomeStatement: { name: "Income Statement", headerBgColor: "FF3498DB", headerFontColor: "FFFFFFFF" },
                materials: { name: "Materials", headerBgColor: "FF2ECC71", headerFontColor: "FFFFFFFF" },
                miscellaneous: { name: "Miscellaneous Expenditures", headerBgColor: "FFF39C12", headerFontColor: "FFFFFFFF" }
            };
            const incomeColumnsConfig = [
                { header: 'S.No', key: 'excelSNo' }, { header: 'Mr/Mrs', key: 'title' },
                { header: 'Name', key: 'name' }, { header: 'Referral', key: 'referral' },
                { header: 'Location/City', key: 'locationCity' }, { header: 'Phone No', key: 'phoneNo' },
                { header: 'Type Of Contribution', key: 'typeOfContribution' },
                { header: 'Amount', key: 'amount', isCurrency: true },
                { header: 'Remarks', key: 'remarks' }
            ];

            const dataRowsForSheet = [];
            const thinBorder = { style: "thin", color: { rgb: "FF000000" } };
            const allSideBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

            const mainTitleStyle = (sz = 14, bold = true) => ({ font: { bold: bold, sz: sz }, alignment: { horizontal: "center", vertical: "center" }, border: allSideBorders });
            const categoryTitleStyle = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "FFE0E0E0" } }, alignment: { horizontal: "center", vertical: "center" }, border: allSideBorders };
            const categoryTotalLabelStyle = { font: { bold: true, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF34495E" } }, alignment: { horizontal: "right" }, border: allSideBorders };
            const categoryTotalValueStyle = { ...categoryTotalLabelStyle, numFmt: "₹#,##0.00" }; 
            const categoryTotalEmptyCellStyle = { fill: { fgColor: { rgb: "FF34495E" } }, border: allSideBorders };
            const grandTotalLabelStyle = { font: { bold: true, sz: 12, color: { rgb: "FFFFFFFF" } }, fill: { fgColor: { rgb: "FF2C3E50" } }, alignment: { horizontal: "right" }, border: allSideBorders };
            const grandTotalValueStyle = { ...grandTotalLabelStyle, numFmt: "₹#,##0.00" }; 
            const grandTotalEmptyCellStyle = { fill: { fgColor: { rgb: "FF2C3E50" } }, border: allSideBorders };

            const mainHeaderTexts = [
                "Sri Krishna Panduranga Vittala Baktha Samajam",
                "And Park Development Account",
                "Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.",
                "Overall Contribution Records"
            ];
            mainHeaderTexts.forEach(text => dataRowsForSheet.push([text]));
            dataRowsForSheet.push([]); 

            let excelRowIdx = 0;
            const merges = [];
            for(let i=0; i<mainHeaderTexts.length; i++) {
                 merges.push({ s: { r: i, c: 0 }, e: { r: i, c: incomeColumnsConfig.length - 1 } });
            }
            excelRowIdx = mainHeaderTexts.length + 1; 
            let grandTotalIncome = 0;

            Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
                const categoryData = Object.values(allIncomeData)
                                        .filter(record => record.category === categoryKey)
                                        .sort((a, b) => (a.sNo || Infinity) - (b.sNo || Infinity));
                if (categoryData.length === 0) return;
                dataRowsForSheet.push([]); excelRowIdx++;
                dataRowsForSheet.push([categoryInfo.name]);
                merges.push({ s: { r: excelRowIdx, c: 0 }, e: { r: excelRowIdx, c: incomeColumnsConfig.length - 1 } });
                excelRowIdx++;
                const headerRowValues = incomeColumnsConfig.map(c => c.header);
                dataRowsForSheet.push(headerRowValues); excelRowIdx++;
                let runningSNo = 1; let categoryTotal = 0;
                categoryData.forEach(record => {
                    const row = incomeColumnsConfig.map(col => {
                        if (col.key === 'excelSNo') return runningSNo;
                        if (col.key === 'amount') {
                            const numVal = parseFloat(record[col.key]);
                            categoryTotal += (isNaN(numVal) ? 0 : numVal);
                            return isNaN(numVal) ? 0 : numVal;
                        }
                        return record[col.key] !== undefined && record[col.key] !== null ? String(record[col.key]) : '-';
                    });
                    runningSNo++; dataRowsForSheet.push(row); excelRowIdx++;
                });
                grandTotalIncome += categoryTotal;
                dataRowsForSheet.push([]); excelRowIdx++; 
                const totalRow = new Array(incomeColumnsConfig.length).fill(null);
                const typeOfContributionColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Type Of Contribution'); 
                const amountColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Amount');
                totalRow[typeOfContributionColIdx] = `Total for ${categoryInfo.name}:`;
                totalRow[amountColIdx] = categoryTotal;
                dataRowsForSheet.push(totalRow); excelRowIdx++;
            });

            if (Object.values(allIncomeData).length > 0) {
                dataRowsForSheet.push([]); excelRowIdx++; 
                const grandTotalRowArray = new Array(incomeColumnsConfig.length).fill(null);
                const typeOfContributionColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Type Of Contribution'); 
                const amountColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Amount');
                grandTotalRowArray[typeOfContributionColIdx] = 'GRAND TOTAL CONTRIBUTIONS:';
                grandTotalRowArray[amountColIdx] = grandTotalIncome;
                dataRowsForSheet.push(grandTotalRowArray); excelRowIdx++;
            }

            if (dataRowsForSheet.length > 5) { 
                const ws = XLSX.utils.aoa_to_sheet(dataRowsForSheet);
                ws['!merges'] = merges;
                ws['!cols'] = incomeColumnsConfig.map(col => {
                    if (['name', 'typeOfContribution', 'remarks'].includes(col.key)) return { wch: 30 };
                    if (['referral', 'locationCity'].includes(col.key)) return { wch: 22 };
                    if (col.key === 'excelSNo') return {wch: 6};
                    return { wch: 15 };
                });

                excelRowIdx = 0;
                for(let i=0; i < mainHeaderTexts.length; i++) {
                    const cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: 0});
                    if(!ws[cellAddress]) ws[cellAddress] = {}; 
                    ws[cellAddress].s = mainTitleStyle(i < 2 ? 16 : (i < 3 ? 12 : 14));
                    excelRowIdx++;
                }
                excelRowIdx++; 

                Object.entries(categories).forEach(([categoryKey, categoryInfo]) => {
                    const categoryData = Object.values(allIncomeData).filter(r => r.category === categoryKey).sort((a,b) => (a.sNo||Infinity) - (b.sNo||Infinity));
                    if (categoryData.length === 0) return;
                    excelRowIdx++; 
                    let cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: 0});
                    if(!ws[cellAddress]) ws[cellAddress] = {}; ws[cellAddress].s = categoryTitleStyle;
                    excelRowIdx++;
                    const headerRowValues = incomeColumnsConfig.map(c => c.header);
                    for(let c=0; c < headerRowValues.length; c++) {
                        cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: c});
                        if(!ws[cellAddress]) ws[cellAddress] = {};
                        ws[cellAddress].s = { font: { bold: true, color: {rgb: categoryInfo.headerFontColor} }, fill: { fgColor: {rgb: categoryInfo.headerBgColor} }, alignment: { horizontal: "center", vertical: "center" }, border: allSideBorders };
                    }
                    excelRowIdx++;
                    categoryData.forEach(() => {
                        for(let c=0; c < incomeColumnsConfig.length; c++) {
                            cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: c});
                            if(!ws[cellAddress]) ws[cellAddress] = {}; 
                            let currentStyle = { border: allSideBorders };
                            if (incomeColumnsConfig[c].key === 'amount' && typeof ws[cellAddress].v === 'number') {
                                ws[cellAddress].t = 'n'; ws[cellAddress].z = '₹#,##0.00'; 
                                currentStyle.alignment = { horizontal: "right" };
                            }
                            ws[cellAddress].s = currentStyle;
                        }
                        excelRowIdx++;
                    });
                    excelRowIdx++; 
                    const typeOfContributionColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Type Of Contribution');
                    const amountColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Amount');
                    for(let c=0; c < incomeColumnsConfig.length; c++) {
                        cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: c});
                        if(!ws[cellAddress]) ws[cellAddress] = {};
                        if (c === typeOfContributionColIdx) ws[cellAddress].s = categoryTotalLabelStyle;
                        else if (c === amountColIdx && typeof ws[cellAddress].v === 'number') ws[cellAddress].s = categoryTotalValueStyle;
                        else ws[cellAddress].s = categoryTotalEmptyCellStyle; 
                    }
                    excelRowIdx++;
                });

                if (Object.values(allIncomeData).length > 0) {
                    excelRowIdx++; 
                    const typeOfContributionColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Type Of Contribution');
                    const amountColIdx = incomeColumnsConfig.findIndex(c => c.header === 'Amount');
                     for(let c=0; c < incomeColumnsConfig.length; c++) {
                        cellAddress = XLSX.utils.encode_cell({r: excelRowIdx, c: c});
                        if(!ws[cellAddress]) ws[cellAddress] = {};
                        if (c === typeOfContributionColIdx) ws[cellAddress].s = grandTotalLabelStyle;
                        else if (c === amountColIdx && typeof ws[cellAddress].v === 'number') ws[cellAddress].s = grandTotalValueStyle;
                        else ws[cellAddress].s = grandTotalEmptyCellStyle; 
                    }
                }
                XLSX.utils.book_append_sheet(wb, ws, "All Contributions");
                XLSX.writeFile(wb, baseFilename);
            } else { alert("No contribution data found to export for any category."); }
        } catch (error) {
            console.error("Error during single-sheet categorized income Excel generation:", error);
            alert("An error occurred while generating the Excel file: " + error.message);
        }
    }

    function exportDataToExcel(dataObject, columnsConfig, filename, sheetName, mainTitle) {
        try {
            const dataRowsForSheet = [];
            const mainHeaderTexts = [
                "Sri Krishna Panduranga Vittala Baktha Samajam", "And Park Development Account",
                "Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.", mainTitle
            ];
            mainHeaderTexts.forEach(text => dataRowsForSheet.push([text]));
            dataRowsForSheet.push([]); 

            const headerValues = columnsConfig.map(c => c.header);
            dataRowsForSheet.push(headerValues);

            const sortedEntries = Object.entries(dataObject).sort(([,a], [,b]) => (a.sNo || Infinity) - (b.sNo || Infinity));
            let runningSNo = 1;
            let sheetTotal = 0;
            const amountColumnKey = columnsConfig.find(col => col.key === 'amount')?.key || 'amount';


            sortedEntries.forEach(([, record]) => {
                const row = columnsConfig.map(col => {
                    if (col.key === 'sNo') return runningSNo;
                    if (col.isCurrency) { 
                        const numVal = parseFloat(record[col.key]);
                        if (col.key === amountColumnKey && !isNaN(numVal)) {
                            sheetTotal += numVal;
                        }
                        return isNaN(numVal) ? 0 : numVal;
                    }
                    return record[col.key] !== undefined && record[col.key] !== null ? String(record[col.key]) : '-';
                });
                runningSNo++;
                dataRowsForSheet.push(row);
            });

            const thinBorder = { style: "thin", color: { rgb: "FF000000" } };
            const allSideBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

            const mainTitleStyle = (sz=14) => ({ font: { bold: true, sz: sz }, alignment: { horizontal: "center" }, border:allSideBorders});
            const dataHeaderStyle = { font: { bold: true, color: {rgb: "FFFFFFFF"} }, fill: { fgColor: {rgb: "FF16A085"} }, alignment: { horizontal: "center" }, border:allSideBorders };
            const totalLabelStyle = { font: { bold: true }, alignment: { horizontal: "right" }, border:allSideBorders, fill: { fgColor: {rgb: "FFBDC3C7"} }  };
            const totalValueStyle = { font: { bold: true }, numFmt: "₹#,##0.00", alignment: { horizontal: "right" }, border:allSideBorders, fill: { fgColor: {rgb: "FFBDC3C7"} } }; 
            const emptyTotalCellStyle = { border:allSideBorders, fill: { fgColor: {rgb: "FFBDC3C7"} } };

            if (sortedEntries.length > 0 && filename.toLowerCase().includes('expense')) { 
                 dataRowsForSheet.push([]); 
                 const totalRow = new Array(columnsConfig.length).fill(null);
                 const descriptionColIndex = columnsConfig.findIndex(c => c.key === 'description'); 
                 const amountColIndex = columnsConfig.findIndex(c => c.key === 'amount');    

                 if (descriptionColIndex !== -1) totalRow[descriptionColIndex] = 'Total Amount:'; 
                 if (amountColIndex !== -1) totalRow[amountColIndex] = sheetTotal;
                 dataRowsForSheet.push(totalRow);
            }

            const ws = XLSX.utils.aoa_to_sheet(dataRowsForSheet);
            const merges = [];
            for(let i=0; i < mainHeaderTexts.length; i++) {
                merges.push({ s: { r: i, c: 0 }, e: { r: i, c: columnsConfig.length - 1 } });
            }
            ws['!merges'] = merges;

            ws['!cols'] = columnsConfig.map(col => {
                if (col.key === 'description') return { wch: 35 };
                if (col.key === 'sNo') return {wch: 6};
                return { wch: 18 };
            });

            for (let R = 0; R < dataRowsForSheet.length; ++R) {
                for (let C = 0; C < (dataRowsForSheet[R] ? dataRowsForSheet[R].length : 0) ; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) ws[cellAddress] = { v: dataRowsForSheet[R][C] }; 
                    else if (dataRowsForSheet[R][C] === null && ws[cellAddress].v === undefined) { ws[cellAddress].v = ""; } 

                    let cellStyle = { border: allSideBorders }; 

                    if (R < mainHeaderTexts.length) { 
                        cellStyle = mainTitleStyle(R < 2 ? 16 : 12);
                    } else if (R === mainHeaderTexts.length + 1) { 
                        cellStyle = dataHeaderStyle;
                    } else { 
                        if (columnsConfig[C]?.isCurrency && typeof ws[cellAddress].v === 'number') {
                            ws[cellAddress].t = 'n'; ws[cellAddress].z = '₹#,##0.00'; 
                            cellStyle.alignment = { horizontal: "right" };
                        }
                        if (R === dataRowsForSheet.length -1 && filename.toLowerCase().includes('expense')) {
                            const descriptionColIndex = columnsConfig.findIndex(c => c.key === 'description');
                            const amountColIndex = columnsConfig.findIndex(c => c.key === 'amount');
                            if (C === descriptionColIndex && String(ws[cellAddress].v).startsWith('Total Amount:')) { 
                                cellStyle = totalLabelStyle;
                            } else if (C === amountColIndex && typeof ws[cellAddress].v === 'number') {
                                cellStyle = totalValueStyle; 
                            } else if (ws[cellAddress].v === null || ws[cellAddress].v === "") { 
                                cellStyle = emptyTotalCellStyle;
                            }
                        }
                    }
                     ws[cellAddress].s = cellStyle;
                }
            }

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error("Error during Excel generation:", error);
            alert("An error occurred while generating the Excel file: " + error.message);
        }
    }


    if (typeof XLSX !== 'undefined') {
        console.log("XLSX (SheetJS) library loaded.");
        if (exportIncomeExcelBtn) {
            exportIncomeExcelBtn.addEventListener('click', () => {
                exportCategorizedIncomeToExcel_SingleSheet(allIncomeData, 'Temple_Overall_Contribution_Records.xlsx');
            });
        }
        if (exportExpenseExcelBtn) {
            exportExpenseExcelBtn.addEventListener('click', () => {
                const expenseColumnsConfig = [ 
                    { header: 'S.No', key: 'sNo' }, { header: 'Date', key: 'date' },
                    { header: 'Description', key: 'description' },
                    { header: 'Amount', key: 'amount', isCurrency: true }
                ];
                exportDataToExcel(allExpenseData, expenseColumnsConfig, 'Temple_Expense_Records.xlsx', 'Expense Records', 'Expense Statement');
            });
        }
    } else {
        console.warn("XLSX (SheetJS) library not loaded. Excel export AND import will not be available.");
        const excelErrorMsg = "Excel features unavailable: XLSX library not loaded.";
        if (exportIncomeExcelBtn) { exportIncomeExcelBtn.onclick = () => alert(excelErrorMsg); exportIncomeExcelBtn.disabled = true; exportIncomeExcelBtn.title = excelErrorMsg; }
        if (exportExpenseExcelBtn) { exportExpenseExcelBtn.onclick = () => alert(excelErrorMsg); exportExpenseExcelBtn.disabled = true; exportExpenseExcelBtn.title = excelErrorMsg;}
        if (uploadIncomeExcelButton) { uploadIncomeExcelButton.onclick = () => alert(excelErrorMsg); uploadIncomeExcelButton.disabled = true; uploadIncomeExcelButton.title = excelErrorMsg;}
        if (uploadExpenseExcelButton) { uploadExpenseExcelButton.onclick = () => alert(excelErrorMsg); uploadExpenseExcelButton.disabled = true; uploadExpenseExcelButton.title = excelErrorMsg;}
    }

    // --- Excel Upload Functionality ---
    function setupExcelUploadListeners() {
        if (uploadIncomeExcelButton && incomeExcelFileInput) {
            uploadIncomeExcelButton.addEventListener('click', () => incomeExcelFileInput.click());
            incomeExcelFileInput.addEventListener('change', (event) => handleExcelUpload(event, 'income', uploadIncomeExcelButton));
        }

        if (uploadExpenseExcelButton && expenseExcelFileInput) {
            uploadExpenseExcelButton.addEventListener('click', () => expenseExcelFileInput.click());
            expenseExcelFileInput.addEventListener('change', (event) => handleExcelUpload(event, 'expenses', uploadExpenseExcelButton));
        }
    }

    async function deleteAllRecords(path) {
        try {
            await database.ref(path).set(null);
            console.log(`All records at ${path} deleted successfully.`);
            return true;
        } catch (error) {
            console.error(`Error deleting records at ${path}:`, error);
            alert(`Failed to delete existing records from ${path}. Please try again or check console.`);
            return false;
        }
    }

    async function handleExcelUpload(event, firebasePath, buttonElement) {
        const file = event.target.files[0];
        if (!file || (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls'))) {
            alert('Please select an Excel file (.xlsx or .xls).');
            event.target.value = null;
            return;
        }

        const originalButtonText = buttonElement.innerHTML;
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const confirmationMessage = `Are you sure you want to replace ALL existing ${firebasePath} records with the content of this Excel file? This action cannot be undone.`;
        if (!confirm(confirmationMessage)) {
            event.target.value = null;
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalButtonText;
            alert(`${firebasePath.charAt(0).toUpperCase() + firebasePath.slice(1)} import cancelled.`);
            return;
        }

        const deletionSuccess = await deleteAllRecords(firebasePath);

        if (!deletionSuccess) {
            event.target.value = null;
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalButtonText;
            return;
        }

        try {
            const fileReader = new FileReader();
            fileReader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;

                    if (firebasePath === 'income') {
                        allIncomeData = {}; 
                        const categorizedRows = await parseCategorizedIncomeExcel(arrayBuffer);
                        if (categorizedRows && categorizedRows.length > 0) {
                            await processAndSaveImportedCategorizedData(categorizedRows, firebasePath);
                        } else {
                            alert('No valid data rows found or correctly identified in the Excel sheet for contributions. Ensure the sheet contains sections like "Income Statement", "Materials", "Miscellaneous Expenditures" followed by their data and recognizable headers.');
                        }
                    } else if (firebasePath === 'expenses') {
                        allExpenseData = {}; 
                        const expenseRows = await parseSimpleExcelToTableData(arrayBuffer); 
                         if (expenseRows && expenseRows.length > 0) {
                            await processAndSaveImportedExpenseData(expenseRows, firebasePath); 
                        } else {
                            alert('No valid data rows found in the Excel sheet for expenses. Ensure the first sheet contains data with recognizable headers (e.g., Date, Description, Amount).');
                        }
                    }
                } catch (parseError) {
                    console.error(`Error parsing Excel for ${firebasePath}:`, parseError);
                    alert(`Failed to parse Excel: ${parseError.message}. Check console for details.`);
                } finally {
                    event.target.value = null;
                    buttonElement.disabled = false;
                    buttonElement.innerHTML = originalButtonText;
                }
            };
            fileReader.onerror = (err) => {
                console.error("FileReader error for Excel:", err);
                alert("Failed to read Excel file.");
                event.target.value = null;
                buttonElement.disabled = false;
                buttonElement.innerHTML = originalButtonText;
            };
            fileReader.readAsArrayBuffer(file);
        } catch (error) {
            console.error(`Error processing Excel for ${firebasePath}:`, error);
            alert(`Failed to process Excel: ${error.message}.`);
            event.target.value = null;
            buttonElement.disabled = false;
            buttonElement.innerHTML = originalButtonText;
        }
    }

    async function parseCategorizedIncomeExcel(arrayBuffer) {
        if (typeof XLSX === 'undefined') {
            throw new Error("XLSX library is not loaded. Cannot parse Excel files.");
        }
        console.log("Starting categorized income Excel parsing...");

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            throw new Error("No sheets found in the Excel file.");
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd", defval: "" });

        let categorizedDataRows = [];
        let currentCategory = null;
        let dataHeaderSkippedForCurrentCategory = false;

        const sectionMarkers = { 
            "income statement": "incomeStatement",
            "materials": "materials",
            "miscellaneous expenditures": "miscellaneous"
        };
        const dataColumnKeywords = [ 
            "name", "amount", "contribution", "referral", "location", "phone", "remarks", "mr/mrs", "s.no"
        ];

        for (const rowCells of allRows) {
            if (!rowCells || rowCells.every(cell => String(cell).trim() === "")) continue; 

            const firstCellTrimmedLower = String(rowCells[0]).trim().toLowerCase();
            let isSectionMarkerRow = false;

            for (const markerText in sectionMarkers) {
                if (firstCellTrimmedLower.includes(markerText)) {
                    currentCategory = sectionMarkers[markerText];
                    dataHeaderSkippedForCurrentCategory = false; 
                    isSectionMarkerRow = true;
                    console.log(`Excel parser (Income): Switched to category '${currentCategory}' from row:`, rowCells);
                    break;
                }
            }
            if (isSectionMarkerRow) continue; 
            if (!currentCategory) continue; 

            if (!dataHeaderSkippedForCurrentCategory) {
                const lowerCells = rowCells.map(c => String(c).trim().toLowerCase());
                let keywordMatches = 0;
                dataColumnKeywords.forEach(keyword => {
                    if (lowerCells.some(lc => lc.includes(keyword))) keywordMatches++;
                });
                if (keywordMatches >= 3) { 
                    dataHeaderSkippedForCurrentCategory = true;
                    console.log(`Excel parser (Income): Skipped data header for '${currentCategory}':`, rowCells);
                    continue;
                }
            }

            const sNoPresent = sNoLikelyPresentInRow(rowCells);
            const nameIndex = sNoPresent ? 2 : (rowCells.length > 1 ? 1: 0) ; 
            const amountIndex = sNoPresent ? 7 : (rowCells.length > 6 ? 6 : (rowCells.length > 2 ? 2 : -1)); 

            const potentialName = String(rowCells[nameIndex] || "").trim();
            const potentialAmountStr = amountIndex !== -1 ? String(rowCells[amountIndex] || "").trim() : "";


            if ( (potentialName || (potentialAmountStr && parseFloat(potentialAmountStr.replace(/[^0-9.-]+/g, "")) !== 0)) && 
                 !firstCellTrimmedLower.includes("total for") && !firstCellTrimmedLower.includes("grand total") &&
                 !String(rowCells[nameIndex] || "").toLowerCase().includes("total")) {
                categorizedDataRows.push({ category: currentCategory, cells: rowCells });
            } else {
                // console.log(`Excel parser (Income): Skipping row (likely total or not data) for '${currentCategory}':`, rowCells);
            }
        }
        console.log(`Categorized income Excel parsing complete. Found ${categorizedDataRows.length} potential data rows.`);
        return categorizedDataRows;
    }

    function sNoLikelyPresentInRow(rowCells) {
        return rowCells && rowCells[0] && !isNaN(parseFloat(String(rowCells[0]))) && String(rowCells[0]).trim().length > 0 && String(rowCells[0]).trim().length < 4 ;
    }

    async function parseSimpleExcelToTableData(arrayBuffer) { 
        if (typeof XLSX === 'undefined') throw new Error("XLSX library is not loaded.");
        console.log(`Starting simple Excel parsing (e.g., for expenses)...`);

        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error("No sheets found in the Excel file.");

        const worksheet = workbook.Sheets[firstSheetName];
        const allRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd", defval: null });

        let dataRows = [];
        let headerFound = false;
        let headerRowIndex = -1;
        const expectedHeaderKeywords = ["date", "description", "amount", "s.no"]; 

        for (let i = 0; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.every(cell => cell === null || String(cell).trim() === "")) continue;

            const lowerCaseRowCells = row.map(cell => String(cell || "").toLowerCase().trim());
            let matchCount = 0;
            expectedHeaderKeywords.forEach(keyword => {
                if (lowerCaseRowCells.some(lc => lc.includes(keyword))) matchCount++;
            });

            if (matchCount >= 2) { 
                headerFound = true;
                headerRowIndex = i;
                console.log("Simple Excel parser: Data header row found at index", headerRowIndex, ":", row);
                break; 
            }
        }
        
        const startRowIndex = headerFound ? headerRowIndex + 1 : (allRows.length > 4 ? 4 : 0); 

        for (let i = startRowIndex; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.every(cell => cell === null || String(cell).trim() === "")) continue;

            const sNoIsItselfData = sNoLikelyPresentInRow(row); 
            const dateIndex = sNoIsItselfData ? 1 : 0;
            const descIndex = sNoIsItselfData ? 2 : 1;
            const amountIndex = sNoIsItselfData ? 3 : 2;
            
            const potentialDate = String(row[dateIndex] || "").trim();
            const potentialDesc = String(row[descIndex] || "").trim();
            const potentialAmount = String(row[amountIndex] || "").trim();

            const rowContentLower = row.join(" ").toLowerCase();
            if ((potentialDate || potentialDesc || (potentialAmount && parseFloat(potentialAmount.replace(/[^0-9.-]+/g,"")) !==0 )) && 
                !rowContentLower.includes("total amount") && !rowContentLower.includes("grand total")) {
                dataRows.push(row);
            } else if (rowContentLower.includes("total")) {
                // console.log("Simple Excel parser: Skipping potential total row:", row);
            }
        }
        
        if (!headerFound && dataRows.length > 0) {
             console.warn(`Simple Excel parser: Could not identify a standard data header row. Imported ${dataRows.length} rows assuming data starts near row ${startRowIndex}.`);
        } else if (!headerFound && dataRows.length === 0 && allRows.length > startRowIndex) {
            console.warn(`Simple Excel parser: No header found and no data rows could be confidently identified after row ${startRowIndex}. Please check Excel format.`);
        }


        console.log(`Simple Excel parsing complete. Found ${dataRows.length} potential data rows.`);
        return dataRows;
    }


    async function processAndSaveImportedCategorizedData(importedEntries, firebasePath) {
        let successCount = 0;
        let errorCount = 0;
        let nextSNoCounter = getNextSNo(allIncomeData); 

        console.log(`Processing ${importedEntries.length} imported categorized rows for path: ${firebasePath}. Starting S.No: ${nextSNoCounter}`);

        for (const entry of importedEntries) {
            const category = entry.category;
            const rawCells = entry.cells;

            const dataOffset = sNoLikelyPresentInRow(rawCells) ? 1 : 0;
            const cleanRowCells = rawCells.slice(dataOffset).map(cell => (cell === undefined || cell === null) ? "" : String(cell).trim());

            if (cleanRowCells.every(cell => cell === "")) {
                // console.log("Skipping fully empty categorized row (after offset). Original:", rawCells);
                continue;
            }

            try {
                const title = cleanRowCells[0] || "";
                const name = cleanRowCells[1] || "";
                const referral = cleanRowCells[2] || "";
                const locationCity = cleanRowCells[3] || "";
                const phoneNo = cleanRowCells[4] || "";
                const typeOfContribution = cleanRowCells[5] || "";
                const amountStr = (cleanRowCells[6] || "0").replace(/[^0-9.-]+/g, ""); 
                const remarks = cleanRowCells[7] || "";

                if (!name.trim() && !typeOfContribution.trim() && (!amountStr || parseFloat(amountStr) === 0)) {
                    console.warn("Skipping categorized row (core fields: Name, Type of Contribution empty and zero/invalid amount):", rawCells);
                    errorCount++; continue;
                }

                const amount = parseFloat(amountStr);
                if (isNaN(amount)) { 
                     console.warn("Skipping categorized row (invalid amount string):", rawCells, "Amount string:", cleanRowCells[6]);
                     errorCount++; continue;
                }

                const recordData = {
                    sNo: nextSNoCounter,
                    category: category,
                    title: title, name: name, referral: referral, locationCity: locationCity,
                    phoneNo: phoneNo, typeOfContribution: typeOfContribution, amount: amount,
                    remarks: remarks, timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref(firebasePath).push().set(recordData);
                successCount++; nextSNoCounter++;
            } catch (dbError) {
                errorCount++;
                console.error(`Error saving imported categorized data row to Firebase for ${firebasePath}:`, dbError, "Original Row data:", rawCells);
            }
        }
        alertUserAboutImportStatus(successCount, errorCount, importedEntries.length, "categorized contributions");
    }

    async function processAndSaveImportedExpenseData(parsedRows, firebasePath) { 
        let successCount = 0;
        let errorCount = 0;
        let nextSNoCounter = getNextSNo(allExpenseData); 

        console.log(`Processing ${parsedRows.length} imported expense rows for path: ${firebasePath}. Starting S.No: ${nextSNoCounter}`);

        for (const rawCells of parsedRows) {
            const dataOffset = sNoLikelyPresentInRow(rawCells) ? 1 : 0; 
            const cleanRowCells = rawCells.slice(dataOffset).map(cell => (cell === undefined || cell === null) ? "" : String(cell).trim());

            if (cleanRowCells.every(cell => cell === "")) {
                // console.log("Skipping fully empty expense row (after offset). Original:", rawCells);
                continue;
            }

            try {
                const dateStr = cleanRowCells[0] || "";
                const description = cleanRowCells[1] || "";
                const amountStr = (cleanRowCells[2] || "0").replace(/[^0-9.-]+/g, "");

                if (!dateStr.trim() && !description.trim() && (!amountStr || parseFloat(amountStr) === 0)) {
                    errorCount++; console.warn("Skipping expense row (core fields: Date, Description empty and zero/invalid amount):", rawCells); continue;
                }

                const amount = parseFloat(amountStr);
                 if (isNaN(amount)) {
                    errorCount++; console.warn("Skipping expense row (invalid amount string):", rawCells, "Amount string:", cleanRowCells[2]); continue;
                }

                let finalDate = dateStr;
                if (dateStr) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(finalDate)) { 
                        let parsedDateAttempt;
                        if (typeof dateStr === 'number') { 
                           parsedDateAttempt = new Date(Date.UTC(0, 0, dateStr - 1)); 
                        } else if (dateStr.includes('/') || dateStr.includes('-')) {
                            const separator = dateStr.includes('/') ? '/' : '-';
                            const parts = dateStr.split(separator);
                            if (parts.length === 3) {
                                let day, month, year;
                                if (parseInt(parts[1]) <=12 && parseInt(parts[0]) <=31) {
                                    day = parseInt(parts[0]); month = parseInt(parts[1]); year = parseInt(parts[2]);
                                } 
                                else if (parseInt(parts[0]) <=12 && parseInt(parts[1]) <=31) {
                                    month = parseInt(parts[0]); day = parseInt(parts[1]); year = parseInt(parts[2]);
                                }
                                if (year < 100) year += 2000; 
                                if (day && month && year) parsedDateAttempt = new Date(year, month - 1, day);
                            }
                        } else { 
                           parsedDateAttempt = new Date(finalDate); 
                        }
                        
                        if(!isNaN(parsedDateAttempt?.getTime()) && parsedDateAttempt.getFullYear() > 1900){
                            finalDate = parsedDateAttempt.toISOString().split('T')[0];
                        } else {
                             console.warn(`Could not reliably parse date: "${dateStr}". Using current date as fallback for row:`, rawCells);
                             finalDate = new Date().toISOString().split('T')[0]; 
                        }
                    }
                } else { 
                    console.warn(`Empty date string provided. Using current date as fallback for row:`, rawCells);
                    finalDate = new Date().toISOString().split('T')[0]; 
                }

                const recordData = {
                    sNo: nextSNoCounter,
                    date: finalDate,
                    description: description,
                    amount: amount, 
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };

                await database.ref(firebasePath).push().set(recordData);
                successCount++;
                nextSNoCounter++;
            } catch (dbError) {
                 errorCount++;
                console.error(`Error saving imported expense data row to Firebase:`, dbError, "Original Row data:", rawCells);
            }
        }
        alertUserAboutImportStatus(successCount, errorCount, parsedRows.length, "expenses");
    }

    function alertUserAboutImportStatus(successCount, errorCount, totalParsed, typeName) {
        let alertMessage = "";
        if (successCount > 0) alertMessage += `${successCount} ${typeName} record(s) imported successfully. `;
        if (errorCount > 0) alertMessage += `${errorCount} ${typeName} record(s) had issues or were skipped. `;

        if (alertMessage) {
             alert(alertMessage + (errorCount > 0 ? "Check console for details on skipped records." : ""));
        } else if (totalParsed === 0) {
            alert(`No data rows were found to process for ${typeName}. The Excel sheet might be empty or incorrectly formatted. Check for required headers and data format.`);
        } else if (successCount === 0 && errorCount === totalParsed) {
            alert(`All ${totalParsed} parsed ${typeName} records were skipped due to issues. Check console for details.`);
        } else { 
            console.log(`Import status for ${typeName}. Parsed: ${totalParsed}, Success: ${successCount}, Errors: ${errorCount}`);
            alert(`Import for ${typeName} finished. Success: ${successCount}, Skipped: ${errorCount}.`);
        }
    }

    // --- Initial Load ---
    checkAuth();

});