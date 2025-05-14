document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginSection = document.getElementById('loginSection');
    const publicViewSection = document.getElementById('publicViewSection');
    const loginToggleButton = document.getElementById('loginToggleButton');
    const logoutButton = document.getElementById('logoutButton'); // On index.html
    const adminLogoutButton = document.getElementById('adminLogoutButton'); // On admin.html

    const addIncomeForm = document.getElementById('addIncomeForm');
    const addExpenseForm = document.getElementById('addExpenseForm');

    const incomeTablePublicBody = document.getElementById('incomeTablePublicBody');
    const expenseTablePublicBody = document.getElementById('expenseTablePublicBody');
    const incomeTableAdminBody = document.getElementById('incomeTableAdminBody');
    const expenseTableAdminBody = document.getElementById('expenseTableAdminBody');

    const totalIncomePublicEl = document.getElementById('totalIncomePublic');
    const totalExpensesPublicEl = document.getElementById('totalExpensesPublic');
    const remainingBalancePublicEl = document.getElementById('remainingBalancePublic');
    const totalIncomeAdminEl = document.getElementById('totalIncomeAdmin');
    const totalExpensesAdminEl = document.getElementById('totalExpensesAdmin');
    const remainingBalanceAdminEl = document.getElementById('remainingBalanceAdmin');

    const cancelIncomeEditBtn = document.getElementById('cancelIncomeEdit');
    const cancelExpenseEditBtn = document.getElementById('cancelExpenseEdit');

    // PDF Export Buttons (already in your code, just listing for completeness)
    // const exportIncomePdfBtn = document.getElementById('exportIncomePdf');
    // const exportExpensePdfBtn = document.getElementById('exportExpensePdf');

    // Excel Export Buttons (IDs for new buttons)
    const exportIncomeExcelBtn = document.getElementById('exportIncomeExcel');
    const exportExpenseExcelBtn = document.getElementById('exportExpenseExcel');


    const HARDCODED_USERNAME = "Admin";
    const HARDCODED_PASSWORD = "Panduranga@123";

    let summaryChartPublicInstance = null;
    let summaryChartAdminInstance = null;

    let allIncomeData = {};
    let allExpenseData = {};

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
            }
        } else { // index.html
            loadPublicData();
            if (isAdminLoggedIn()) {
                if (loginToggleButton) loginToggleButton.textContent = 'Go to Admin Dashboard';
                if (loginToggleButton) loginToggleButton.classList.remove('btn-outline-primary');
                if (loginToggleButton) loginToggleButton.classList.add('btn-success');
                if (logoutButton) logoutButton.style.display = 'block';
                if (loginSection) loginSection.style.display = 'none';
            } else {
                if (loginToggleButton) loginToggleButton.textContent = 'Admin Login';
                if (loginToggleButton) loginToggleButton.classList.remove('btn-success');
                if (loginToggleButton) loginToggleButton.classList.add('btn-outline-primary');
                if (logoutButton) logoutButton.style.display = 'none';
                // Don't hide public view, it's always visible on index.html
            }
        }
    }

    if (loginToggleButton) {
        loginToggleButton.addEventListener('click', () => {
            if (isAdminLoggedIn()) {
                window.location.href = 'admin.html';
            } else {
                if (loginSection) loginSection.style.display = loginSection.style.display === 'none' ? 'block' : 'none';
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
        if (!publicViewSection) return; // Only on index.html

        database.ref('income').on('value', snapshot => {
            allIncomeData = snapshot.val() || {};
            renderIncomeTable(incomeTablePublicBody, allIncomeData, false);
            updateTotalsAndChart();
        });

        database.ref('expenses').on('value', snapshot => {
            allExpenseData = snapshot.val() || {};
            renderExpenseTable(expenseTablePublicBody, allExpenseData, false);
            updateTotalsAndChart();
        });
    }

    function loadAdminData() {
        if (!isAdminLoggedIn() || !document.getElementById('adminLogoutButton')) return; // Only on admin.html

        database.ref('income').on('value', snapshot => {
            allIncomeData = snapshot.val() || {};
            renderIncomeTable(incomeTableAdminBody, allIncomeData, true);
            updateTotalsAndChart();
        });

        database.ref('expenses').on('value', snapshot => {
            allExpenseData = snapshot.val() || {};
            renderExpenseTable(expenseTableAdminBody, allExpenseData, true);
            updateTotalsAndChart();
        });
    }

    function getNextSNo(dataObject) {
        const sNos = Object.values(dataObject).map(item => item.sNo || 0).filter(sNo => typeof sNo === 'number' && !isNaN(sNo));
        return sNos.length > 0 ? Math.max(0, ...sNos) + 1 : 1;
    }


    // --- Income Operations (Admin) ---
    if (addIncomeForm) {
        addIncomeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('incomeEditId').value;
            const incomeData = {
                sNo: editId ? allIncomeData[editId].sNo : getNextSNo(allIncomeData), // Preserve S.No on edit
                devoteeName: document.getElementById('devoteeName').value,
                description: document.getElementById('incomeDescription').value,
                amount: parseFloat(document.getElementById('incomeAmount').value),
                address: document.getElementById('devoteeAddress').value,
                contact: document.getElementById('contactNumber').value,
                reference: document.getElementById('reference').value,
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
        if (cancelIncomeEditBtn) cancelIncomeEditBtn.style.display = 'none';
    }
    if (cancelIncomeEditBtn) cancelIncomeEditBtn.addEventListener('click', resetIncomeForm);


    // --- Expense Operations (Admin) ---
    if (addExpenseForm) {
        ['totalExpense', 'advancePaid'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', calculateBalanceDue);
        });

        addExpenseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('expenseEditId').value;
            const expenseData = {
                sNo: editId ? allExpenseData[editId].sNo : getNextSNo(allExpenseData),
                date: document.getElementById('expenseDate').value,
                description: document.getElementById('expenseDescription').value,
                totalExpense: parseFloat(document.getElementById('totalExpense').value),
                advancePaid: parseFloat(document.getElementById('advancePaid').value) || 0,
                balanceDue: parseFloat(document.getElementById('balanceDue').value),
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
        calculateBalanceDue(); // Reset balance due field
    }
    if (cancelExpenseEditBtn) cancelExpenseEditBtn.addEventListener('click', resetExpenseForm);


    function calculateBalanceDue() {
        const totalExpenseEl = document.getElementById('totalExpense');
        const advancePaidEl = document.getElementById('advancePaid');
        const balanceDueEl = document.getElementById('balanceDue');

        if (totalExpenseEl && advancePaidEl && balanceDueEl) {
            const total = parseFloat(totalExpenseEl.value) || 0;
            const advance = parseFloat(advancePaidEl.value) || 0;
            balanceDueEl.value = (total - advance).toFixed(2);
        }
    }


    // --- Table Rendering ---
    function renderIncomeTable(tbody, data, isAdminTable) {
    if (!tbody) return;
    tbody.innerHTML = '';
    let displaySNo = 1; // Initialize the display serial number

    // Sort data based on the sNo stored in the database for consistent ordering
    // but we will use 'displaySNo' for the actual table display.
    const sortedData = Object.entries(data).sort(([,a], [,b]) => (a.sNo || Infinity) - (b.sNo || Infinity));

    for (const [id, record] of sortedData) {
        const row = tbody.insertRow();
        // ALWAYS use displaySNo for the first cell and then increment it
        row.insertCell().textContent = displaySNo++;
        row.insertCell().textContent = record.devoteeName;
        row.insertCell().textContent = record.description;
        row.insertCell().textContent = `₹${(record.amount || 0).toFixed(2)}`;
        row.insertCell().textContent = record.address || '-';
        row.insertCell().textContent = record.contact || '-';
        row.insertCell().textContent = record.reference || '-';

        if (isAdminTable) {
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'me-1');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.onclick = () => editIncomeRecord(id, record); // Pass original record with its DB sNo for editing
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = () => deleteRecord('income', id);
            actionsCell.appendChild(deleteBtn);
        }
    }
}

    function renderExpenseTable(tbody, data, isAdminTable) {
    if (!tbody) return;
    tbody.innerHTML = '';
    let displaySNo = 1; // Initialize the display serial number

    // Sort data based on the sNo stored in the database for consistent ordering
    const sortedData = Object.entries(data).sort(([,a], [,b]) => (a.sNo || Infinity) - (b.sNo || Infinity));

    for (const [id, record] of sortedData) {
        const row = tbody.insertRow();
        // ALWAYS use displaySNo for the first cell and then increment it
        row.insertCell().textContent = displaySNo++;
        row.insertCell().textContent = record.date;
        row.insertCell().textContent = record.description;
        row.insertCell().textContent = `₹${(record.totalExpense || 0).toFixed(2)}`;
        row.insertCell().textContent = `₹${(record.advancePaid || 0).toFixed(2)}`;
        row.insertCell().textContent = `₹${(record.balanceDue || 0).toFixed(2)}`;

        if (isAdminTable) {
            const actionsCell = row.insertCell();
            const editBtn = document.createElement('button');
            editBtn.classList.add('btn', 'btn-sm', 'btn-warning', 'action-btn', 'me-1');
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editBtn.onclick = () => editExpenseRecord(id, record); // Pass original record
            actionsCell.appendChild(editBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'action-btn');
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
            deleteBtn.onclick = () => deleteRecord('expenses', id);
            actionsCell.appendChild(deleteBtn);
        }
    }
}

    // --- Edit/Delete Functions (Admin) ---
    function editIncomeRecord(id, record) {
        document.getElementById('incomeEditId').value = id;
        document.getElementById('devoteeName').value = record.devoteeName;
        document.getElementById('incomeDescription').value = record.description;
        document.getElementById('incomeAmount').value = record.amount;
        document.getElementById('devoteeAddress').value = record.address || '';
        document.getElementById('contactNumber').value = record.contact || '';
        document.getElementById('reference').value = record.reference || '';
        if (cancelIncomeEditBtn) cancelIncomeEditBtn.style.display = 'inline-block';
        if (addIncomeForm) addIncomeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function editExpenseRecord(id, record) {
        document.getElementById('expenseEditId').value = id;
        document.getElementById('expenseDate').value = record.date;
        document.getElementById('expenseDescription').value = record.description;
        document.getElementById('totalExpense').value = record.totalExpense;
        document.getElementById('advancePaid').value = record.advancePaid || 0;
        calculateBalanceDue(); // This will set balanceDueEl.value
        if (cancelExpenseEditBtn) cancelExpenseEditBtn.style.display = 'inline-block';
        if (addExpenseForm) addExpenseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function deleteRecord(type, id) {
        if (confirm(`Are you sure you want to delete this ${type.slice(0,-1)} record?`)) {
            database.ref(`${type}/${id}`).remove()
                .catch(err => console.error(`Error deleting ${type}:`, err));
        }
    }

    // --- Totals and Chart ---
    function updateTotalsAndChart() {
        let currentTotalIncome = 0;
        Object.values(allIncomeData).forEach(item => currentTotalIncome += (item.amount || 0));

        let currentTotalExpenses = 0;
        Object.values(allExpenseData).forEach(item => currentTotalExpenses += (item.totalExpense || 0));

        const currentRemainingBalance = currentTotalIncome - currentTotalExpenses;

        if (totalIncomePublicEl) totalIncomePublicEl.textContent = `₹${currentTotalIncome.toFixed(2)}`;
        if (totalExpensesPublicEl) totalExpensesPublicEl.textContent = `₹${currentTotalExpenses.toFixed(2)}`;
        if (remainingBalancePublicEl) remainingBalancePublicEl.textContent = `₹${currentRemainingBalance.toFixed(2)}`;
        
        if (totalIncomeAdminEl) totalIncomeAdminEl.textContent = `₹${currentTotalIncome.toFixed(2)}`;
        if (totalExpensesAdminEl) totalExpensesAdminEl.textContent = `₹${currentTotalExpenses.toFixed(2)}`;
        if (remainingBalanceAdminEl) remainingBalanceAdminEl.textContent = `₹${currentRemainingBalance.toFixed(2)}`;

        renderChart('summaryChartPublic', currentTotalIncome, currentTotalExpenses);
        renderChart('summaryChartAdmin', currentTotalIncome, currentTotalExpenses);
    }

    function renderChart(canvasId, income, expenses) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        let chartInstance;
        if (canvasId === 'summaryChartPublic') {
            if (summaryChartPublicInstance) summaryChartPublicInstance.destroy();
            chartInstance = summaryChartPublicInstance; // This line was incorrect, it should be reassigned after new Chart
        } else if (canvasId === 'summaryChartAdmin') {
            if (summaryChartAdminInstance) summaryChartAdminInstance.destroy();
            chartInstance = summaryChartAdminInstance; // This line was incorrect
        }

        const chartIncome = Math.max(0, income);
        const chartExpenses = Math.max(0, expenses);

        const newChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    label: 'Fund Summary',
                    data: [chartIncome, chartExpenses],
                    backgroundColor: [
                        'rgba(248, 74, 5, 0.94)',
                        'rgba(163, 48, 167, 0.89)'
                    ],
                    borderColor: [
                        'rgba(163, 48, 167, 0.89)',
                        'rgba(248, 74, 5, 0.94)'
                    ],
                    borderWidth: 1,
                    hoverOffset: 25, // Explodes the segment by 15 pixels on hover
                // Optionally, change background color on hover
                hoverBackgroundColor: [
                    'rgba(248, 74, 5, 0.94)',
                    'rgba(163, 48, 167, 0.89)' // Brighter/more opaque expense color on hover
                ],
                // Optionally, change border on hover
                hoverBorderColor: [
                    'rgba(163, 48, 167, 0.89)',
                    'rgba(248, 74, 5, 0.94)'  // Example: Orange border for expense on hover
                ],
                hoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout : {
                    padding: {
                    // Add padding to all sides, or just bottom if that's the issue
                    // Adjust this value based on your hoverOffset
                    top: 5,    // Or your hoverOffset / 2, or more
                    bottom: 10, // Increase this if bottom is still cut. Should be >= hoverOffset
                    left: 1,   // Or your hoverOffset / 2, or more
                    right: 1   // Or your hoverOffset / 2, or more
                }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
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

        if (canvasId === 'summaryChartPublic') {
            summaryChartPublicInstance = newChart; // Correct reassignment
        } else if (canvasId === 'summaryChartAdmin') {
            summaryChartAdminInstance = newChart; // Correct reassignment
        }
    }

    // --- PDF Export ---
    if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
        console.log("jsPDF core appears to be loaded.");
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(); // Test instance

        if (typeof doc.autoTable === 'function') {
            console.log("jsPDF-AutoTable plugin appears to be loaded and attached to jsPDF instances.");

            const exportIncomePdfBtn = document.getElementById('exportIncomePdf');
            const exportExpensePdfBtn = document.getElementById('exportExpensePdf');

            if (exportIncomePdfBtn) {
                console.log("Export Income PDF button found.");
                exportIncomePdfBtn.addEventListener('click', () => {
                    console.log("Export Income PDF button CLICKED.");
                    exportTableToPDF('incomeTableAdminBody', 'Temple_Income_Records.pdf', 'Temple Income Records', ['S.No', 'Devotee Name', 'Description', 'Amount (₹)', 'Address', 'Contact', 'Reference']);
                });
            } else if (isAdminLoggedIn() && document.getElementById('adminLogoutButton')) { // Only log error if on admin page
                console.error("Export Income PDF button NOT found.");
            }

            if (exportExpensePdfBtn) {
                console.log("Export Expense PDF button found.");
                exportExpensePdfBtn.addEventListener('click', () => {
                    console.log("Export Expense PDF button CLICKED.");
                    exportTableToPDF('expenseTableAdminBody', 'Temple_Expense_Records.pdf', 'Temple Expense Records', ['S.No', 'Date', 'Description', 'Total Expense (₹)', 'Advance Paid (₹)', 'Balance Due (₹)']);
                });
            } else if (isAdminLoggedIn() && document.getElementById('adminLogoutButton')) { // Only log error if on admin page
                console.error("Export Expense PDF button NOT found.");
            }

            function exportTableToPDF(tableBodyId, filename, title, headers) {
                console.log(`exportTableToPDF called with: tableBodyId=${tableBodyId}, filename=${filename}, title=${title}`);
                try {
                    const pdfDoc = new jsPDF();
                    console.log("jsPDF instance created for export:", pdfDoc);

                    const tableBodyElement = document.getElementById(tableBodyId);
                    if (!tableBodyElement) {
                        console.error("Table body element NOT FOUND for PDF export. ID:", tableBodyId);
                        alert(`Error: Table body with ID '${tableBodyId}' not found.`);
                        return;
                    }
                    console.log("Table body element found:", tableBodyElement);
                    
                    // Create a temporary table with a header for autoTable to parse correctly
                    const table = document.createElement('table');
                    const thead = table.createTHead();
                    const headerRow = thead.insertRow();
                    headers.forEach(headerText => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        headerRow.appendChild(th);
                    });
                    // table.appendChild(tableBodyElement.cloneNode(true)); // Use a clone of the body
                    const clonedTbody = tableBodyElement.cloneNode(true); // Use a clone of the body
        const rows = clonedTbody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            for (let j = 0; j < cells.length; j++) {
                // Check if the cell content includes the Rupee symbol
                if (cells[j].textContent.includes('₹')) {
                    // Replace the Rupee symbol with an empty string and trim whitespace
                    cells[j].textContent = cells[j].textContent.replace(/₹/g, '').trim();
                }
            }
        }
        table.appendChild(clonedTbody); 


                    // pdfDoc.text(title, 14, 16);
                    // --- START: ADDING CUSTOM MULTI-LINE HEADER FOR INCOME PDF ---
        let currentY = 15; // Initial Y position for text
        const pageMargin = 14; // Standard page margin
        const lineHeight = 7; // Adjust as needed for spacing between lines

        if (filename.toLowerCase().includes('income')) { // Check if it's an income report
            pdfDoc.setFontSize(12); // Set font size for the main header
            pdfDoc.text("Sri Krishna Panduranga Vittala Baktha Samajam", pageMargin, currentY);
            currentY += lineHeight;
            pdfDoc.text("And Park Development Account", pageMargin, currentY);
            currentY += lineHeight;

            pdfDoc.setFontSize(10); // Smaller font for address
            pdfDoc.text("Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.", pageMargin, currentY);
            currentY += lineHeight + 2; // Extra space before the statement title

            pdfDoc.setFontSize(11); // Font for the statement title
            pdfDoc.text("Contribution Income Statement", pageMargin, currentY);
            currentY += lineHeight + 5; // More space before the table
        } else {
            pdfDoc.setFontSize(12); // Set font size for the main header
            pdfDoc.text("Sri Krishna Panduranga Vittala Baktha Samajam", pageMargin, currentY);
            currentY += lineHeight;
            pdfDoc.text("And Park Development Account", pageMargin, currentY);
            currentY += lineHeight;

            pdfDoc.setFontSize(10); // Smaller font for address
            pdfDoc.text("Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041.", pageMargin, currentY);
            currentY += lineHeight + 2; // Extra space before the statement title

            pdfDoc.setFontSize(11); // Font for the statement title
            pdfDoc.text("Expense Statement", pageMargin, currentY);
            currentY += lineHeight + 5; // More space before the table
        }
                    console.log("Title added to PDF.");

                    if (typeof pdfDoc.autoTable !== 'function') {
                        console.error("pdfDoc.autoTable is not a function!");
                        alert("Error: PDF generation feature is not working (autoTable missing on instance).");
                        return;
                    }
                    
                    console.log("Calling pdfDoc.autoTable...");
                    pdfDoc.autoTable({
                        html: table, // Use the constructed table with header
                        startY: currentY,
                        theme: 'grid',
                        headStyles: { fillColor: [22, 160, 133] },
                    });
                    console.log("pdfDoc.autoTable finished.");

                    pdfDoc.save(filename);
                    console.log(`PDF ${filename} save initiated.`);
                } catch (error) {
                    console.error("Error during PDF generation:", error);
                    alert("An error occurred while generating the PDF: " + error.message);
                }
            }
        } else {
            console.error("jsPDF-AutoTable plugin loaded BUT 'autoTable' method NOT FOUND on jsPDF instances.");
            disablePdfButtonsWithError("PDF Export: AutoTable plugin issue (method not found).");
        }
    } else {
        console.error("jsPDF core (window.jspdf or window.jspdf.jsPDF) not loaded. PDF export will not be available.");
        disablePdfButtonsWithError("PDF Export: Core jsPDF library not loaded.");
    }

    function disablePdfButtonsWithError(errorMessage) {
        const exportIncomePdfBtn = document.getElementById('exportIncomePdf');
        const exportExpensePdfBtn = document.getElementById('exportExpensePdf');
        const pdfErrorMsg = errorMessage + " Please check console for details or contact support.";
        if (exportIncomePdfBtn) {
            exportIncomePdfBtn.onclick = () => alert(pdfErrorMsg);
            exportIncomePdfBtn.disabled = true;
        }
        if (exportExpensePdfBtn) {
            exportExpensePdfBtn.onclick = () => alert(pdfErrorMsg);
            exportExpensePdfBtn.disabled = true;
        }
    }

    // --- Excel Export Function Definition ---
    function exportDataToExcel(dataObject, columnsConfig, filename, sheetName) {
        try {
            // const headers = columnsConfig.map(c => c.header);
            const dataRows = [];

            // --- START: ADDING CUSTOM MULTI-LINE HEADER FOR INCOME EXCEL ---
        if (filename.toLowerCase().includes('income')) { // Check if it's an income report
            // Add empty rows for spacing if desired, or directly add header lines
            dataRows.push(["Sri Krishna Panduranga Vittala Baktha Samajam"]);
            dataRows.push(["And Park Development Account"]);
            dataRows.push(["Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041."]);
            dataRows.push(["Contribution Income Statement"]);
            dataRows.push([]); // Add an empty row for spacing before table headers
        } else {
            dataRows.push(["Sri Krishna Panduranga Vittala Baktha Samajam"]);
            dataRows.push(["And Park Development Account"]);
            dataRows.push(["Middle Street, NATCO Colony, Kottivakkam, Chennai 600 041."]);
            dataRows.push(["Expense Statement"]);
            dataRows.push([]); // Add an empty row for spacing before table headers
        }

            // dataRows.push(headers);
            const tableHeaders = columnsConfig.map(c => c.header);
        dataRows.push(tableHeaders);

            const sortedEntries = Object.entries(dataObject).sort(([,a], [,b]) => (a.sNo || Infinity) - (b.sNo || Infinity));
            
            let runningSNo = 1;
            sortedEntries.forEach(([, record]) => {
                const row = [];
                columnsConfig.forEach(col => {
                    let value;
                    if (col.key === 'sNo') {
                        //value = record.sNo !== undefined && record.sNo !== null ? Number(record.sNo) : runningSNo;
                        value = runningSNo;
                        // if (record.sNo === undefined || record.sNo === null) {
                        //     // This sNo was generated, so next generated should be higher
                        // } else if (Number(record.sNo) >= runningSNo) {
                        //      runningSNo = Number(record.sNo); // Align runningSNo if explicit sNo is higher
                        // }
                    } else if (['amount', 'totalExpense', 'advancePaid', 'balanceDue'].includes(col.key)) {
                        const numVal = parseFloat(record[col.key]);
                        value = isNaN(numVal) ? 0 : numVal;
                    } else {
                        value = record[col.key] !== undefined && record[col.key] !== null ? String(record[col.key]) : '-';
                    }
                    row.push(value);
                });
                runningSNo++; // Increment for the next potential generated sNo
                dataRows.push(row);
            });

            const ws = XLSX.utils.aoa_to_sheet(dataRows);

            // --- START: MERGE CELLS FOR INCOME EXCEL HEADER ---
        if (columnsConfig.length > 1) {
            const mergeOptions = { // s: start, e: end, r: row, c: column (0-indexed)
                '!merges': [
                    // Sri Krishna Panduranga Vittala Baktha Samajam
                    { s: { r: 0, c: 0 }, e: { r: 0, c: columnsConfig.length - 1 } },
                    // And Park Development Account
                    { s: { r: 1, c: 0 }, e: { r: 1, c: columnsConfig.length - 1 } },
                    // Middle Street...
                    { s: { r: 2, c: 0 }, e: { r: 2, c: columnsConfig.length - 1 } },
                    // Contribution Income Statement
                    { s: { r: 3, c: 0 }, e: { r: 3, c: columnsConfig.length - 1 } },
                ]
            };
            XLSX.utils.sheet_add_json(ws, [], { header: ["A1"], skipHeader: true, origin: -1, ...mergeOptions }); // Apply merges
        }

            const colWidths = columnsConfig.map(col => {
                if (col.key === 'description' || col.key === 'address') return { wch: 35 };
                if (col.key === 'devoteeName' || col.key === 'reference') return { wch: 25 };
                if (col.key === 'sNo') return {wch: 5};
                return { wch: 18 };
            });
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, filename);
            console.log(`Excel ${filename} save initiated.`);

        } catch (error) {
            console.error("Error during Excel generation:", error);
            alert("An error occurred while generating the Excel file: " + error.message);
        }
    }

    // --- Excel Export UI Setup ---
    // NB: Ensure xlsx.full.min.js is included in your HTML for this to work:
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    
    // Element fetching for Excel buttons is done at the top of DOMContentLoaded

    if (typeof XLSX !== 'undefined') {
        console.log("XLSX (SheetJS) library loaded.");

        if (exportIncomeExcelBtn) {
            console.log("Export Income Excel button found.");
            exportIncomeExcelBtn.addEventListener('click', () => {
                console.log("Export Income Excel button CLICKED.");
                const incomeColumnsConfig = [
                    { header: 'S.No', key: 'sNo' },
                    { header: 'Devotee Name', key: 'devoteeName' },
                    { header: 'Description', key: 'description' },
                    { header: 'Amount (₹)', key: 'amount' },
                    { header: 'Address', key: 'address' },
                    { header: 'Contact', key: 'contact' },
                    { header: 'Reference', key: 'reference' }
                ];
                exportDataToExcel(allIncomeData, incomeColumnsConfig, 'Temple_Income_Records.xlsx', 'Income Records');
            });
        } else if (isAdminLoggedIn() && document.getElementById('adminLogoutButton')) { // Only log error if on admin page
             console.error("Export Income Excel button NOT found.");
        }


        if (exportExpenseExcelBtn) {
            console.log("Export Expense Excel button found.");
            exportExpenseExcelBtn.addEventListener('click', () => {
                console.log("Export Expense Excel button CLICKED.");
                const expenseColumnsConfig = [
                    { header: 'S.No', key: 'sNo' },
                    { header: 'Date', key: 'date' },
                    { header: 'Description', key: 'description' },
                    { header: 'Total Expense (₹)', key: 'totalExpense' },
                    { header: 'Advance Paid (₹)', key: 'advancePaid' },
                    { header: 'Balance Due (₹)', key: 'balanceDue' }
                ];
                exportDataToExcel(allExpenseData, expenseColumnsConfig, 'Temple_Expense_Records.xlsx', 'Expense Records');
            });
        } else if (isAdminLoggedIn() && document.getElementById('adminLogoutButton')) { // Only log error if on admin page
            console.error("Export Expense Excel button NOT found.");
        }

    } else {
        console.warn("XLSX (SheetJS) library not loaded. Excel export will not be available.");
        const excelErrorMsg = "Excel export feature is unavailable: XLSX library not loaded. Please include it in your HTML or contact support.";
        if (exportIncomeExcelBtn) {
            exportIncomeExcelBtn.onclick = () => alert(excelErrorMsg);
            exportIncomeExcelBtn.disabled = true;
        }
        if (exportExpenseExcelBtn) {
            exportExpenseExcelBtn.onclick = () => alert(excelErrorMsg);
            exportExpenseExcelBtn.disabled = true;
        }
    }

    // --- Initial Load ---
    checkAuth(); // This will call loadPublicData or loadAdminData as appropriate

});