/**
 * E-Khata Personal Budget Web Application - Core Controller & Engine
 * Built for: FinVerse Finance Club of IIEBM Personal Budget Challenge
 * Adheres strictly to Standalone Budget Template & Student Guide Logic
 */

// ==========================================================================
// 1. CONSTANTS & PREDEFINED CATEGORIES (From MasterList Sheet 1 & Template)
// ==========================================================================

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PREDEFINED_CATEGORIES = {
  Income: [
    "After Tax Salary - Self",
    "After Tax Salary - Spouse",
    "Interest/Dividend income",
    "Rental income",
    "Business sale proceed",
    "Asset sale proceed",
    "Pension income (govt)",
    "Annuity Payout",
    "Others"
  ],
  Expense: [
    "Grocery",
    "Electronics purchase",
    "TV/OTT",
    "Internet",
    "Mobile",
    "Furniture",
    "Home Repair works",
    "Medicines",
    "Vegetables",
    "Hotel/Restaurants",
    "Clothes",
    "School fees",
    "College fees",
    "Tuition fees",
    "Rent payments",
    "Loan payments - Vehicle",
    "Loan payments - House",
    "Loan payments - Education",
    "Loan payments - Personal",
    "Travel expenses",
    "Maids wages",
    "Garderner wages",
    "Driver wages",
    "Cook wages",
    "School transport",
    "Books/newspapers/periodicals",
    "Electricity bills",
    "Property tax bills",
    "Telephone bills",
    "Vehicle maintenance",
    "Petrol/Diesel",
    "Cooking gas",
    "Donations",
    "Ornaments, jewels",
    "Movies/theaters/concerts",
    "Music purchase",
    "Gifts - birthdays, marriages etc",
    "Life Insurance Premium",
    "Term Insurance Premium",
    "Health Insurance Premium",
    "Vehicle Insurance Premium",
    "Miscellaneous"
  ],
  Investment: [
    "Investments towards portfolio",
    "Mutual Funds / SIP",
    "Stocks & Direct Equity",
    "Fixed Deposits / Bonds",
    "Public Provident Fund (PPF)",
    "National Pension Scheme (NPS)",
    "Gold / Sovereign Gold Bonds",
    "Real Estate Investment"
  ]
};

// Storage Keys
const STORAGE_DATA_KEY = "finverse_budget_data_v1";
const STORAGE_CUSTOM_CATS_KEY = "finverse_custom_categories_v1";
const STORAGE_THEME_KEY = "finverse_theme_pref";

// State
let appState = {
  entries: [],
  customCategories: { Income: [], Expense: [], Investment: [] },
  activeView: "dashboard",
  selectedYear: 2026,
  selectedMonth: "January", // "ALL" or Month Name
  editingEntryId: null,
  charts: {}
};

// ==========================================================================
// 2. CURRENCY & NUMBER FORMATTING (Indian Rupee Formatting: ₹1,00,000)
// ==========================================================================

function formatINR(amount, includeDecimals = false) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  
  const formatted = absVal.toLocaleString("en-IN", {
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0
  });

  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

function formatPercent(val) {
  if (val === null || val === undefined || isNaN(val)) {
    return "N/A";
  }
  return `${val.toFixed(1)}%`;
}

// ==========================================================================
// 3. FINANCIAL CALCULATION ENGINE (Exact FinVerse Template Formulas)
// ==========================================================================

/**
 * Calculates all metrics for a given subset of entries:
 * 1. Sub Total Income = SUM(Income)
 * 2. Sub Total Expenses = SUM(Expense)
 * 3. Expenses as % of Income = (Expenses / Income) * 100 (N/A if Income == 0)
 * 4. Investable Surplus = Income - Expenses
 * 5. Savings Rate = (Surplus / Income) * 100 (N/A if Income == 0)
 * 6. Investments towards portfolio = SUM(Investment)
 * 7. Investments as % of Income = (Investments / Income) * 100 (N/A if Income == 0)
 * 8. Uninvested Savings = Investable Surplus - Investments
 */
function calculateFinancialMetrics(entriesList) {
  let subTotalIncome = 0;
  let subTotalExpenses = 0;
  let subTotalInvestments = 0;

  const incomeByCategory = {};
  const expenseByCategory = {};
  const investmentByCategory = {};

  entriesList.forEach(entry => {
    const amt = Number(entry.amount) || 0;
    if (entry.type === "Income") {
      subTotalIncome += amt;
      incomeByCategory[entry.category] = (incomeByCategory[entry.category] || 0) + amt;
    } else if (entry.type === "Expense") {
      subTotalExpenses += amt;
      expenseByCategory[entry.category] = (expenseByCategory[entry.category] || 0) + amt;
    } else if (entry.type === "Investment") {
      subTotalInvestments += amt;
      investmentByCategory[entry.category] = (investmentByCategory[entry.category] || 0) + amt;
    }
  });

  const investableSurplus = subTotalIncome - subTotalExpenses;
  
  // Safe percentage calculations (Division by zero prevention)
  const expensePercentage = subTotalIncome > 0 
    ? (subTotalExpenses / subTotalIncome) * 100 
    : null;

  const savingsRate = subTotalIncome > 0 
    ? (investableSurplus / subTotalIncome) * 100 
    : null;

  const investmentPercentage = subTotalIncome > 0 
    ? (subTotalInvestments / subTotalIncome) * 100 
    : null;

  const uninvestedSavings = investableSurplus - subTotalInvestments;
  const isDeficit = investableSurplus < 0;

  return {
    subTotalIncome,
    subTotalExpenses,
    subTotalInvestments,
    investableSurplus,
    uninvestedSavings,
    expensePercentage,
    savingsRate,
    investmentPercentage,
    isDeficit,
    incomeByCategory,
    expenseByCategory,
    investmentByCategory
  };
}

// Get entries filtered by Year and Month
function getFilteredEntries(year, month) {
  return appState.entries.filter(e => {
    const matchYear = Number(e.year) === Number(year);
    const matchMonth = (month === "ALL" || e.month === month);
    return matchYear && matchMonth;
  });
}

// ==========================================================================
// 4. STORAGE & INITIAL SAMPLE DATA SEEDING
// ==========================================================================

function loadStateFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_DATA_KEY);
    const rawCats = localStorage.getItem(STORAGE_CUSTOM_CATS_KEY);
    
    if (rawCats) {
      appState.customCategories = JSON.parse(rawCats);
    }
    
    if (rawData) {
      appState.entries = JSON.parse(rawData);
    } else {
      // Start with clean empty state for live competition presentations
      appState.entries = [];
    }
  } catch (err) {
    console.error("Failed to load from localStorage:", err);
    appState.entries = [];
  }
}

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(appState.entries));
    localStorage.setItem(STORAGE_CUSTOM_CATS_KEY, JSON.stringify(appState.customCategories));
  } catch (err) {
    console.error("Failed to save to localStorage:", err);
    showToast("Error saving data to browser storage", "error");
  }
}

// ==========================================================================
// 5. UI INITIALIZATION & EVENT HANDLERS
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadStateFromStorage();
  populateCategorySelects();
  bindEvents();
  updateUI();
  runCalculationTests();
});

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  const btn = document.getElementById("theme-toggle-btn");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

function bindEvents() {
  // Navigation Links
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const view = btn.dataset.view;
      navigateTo(view);
    });
  });

  // Mobile Menu Toggle
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      document.getElementById("sidebar").classList.toggle("open");
    });
  }

  // Theme Toggle
  const themeBtn = document.getElementById("theme-toggle-btn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(STORAGE_THEME_KEY, next);
      updateThemeToggleIcon(next);
      renderAllCharts(); // refresh chart themes
    });
  }

  // Topbar Filters
  const yearSelect = document.getElementById("global-year-select");
  const monthSelect = document.getElementById("global-month-select");

  if (yearSelect) {
    yearSelect.addEventListener("change", (e) => {
      appState.selectedYear = Number(e.target.value);
      updateUI();
    });
  }

  if (monthSelect) {
    monthSelect.addEventListener("change", (e) => {
      appState.selectedMonth = e.target.value;
      updateUI();
    });
  }

  // Quick Add Button
  const quickAddBtn = document.getElementById("btn-quick-add-entry");
  if (quickAddBtn) {
    quickAddBtn.addEventListener("click", () => {
      navigateTo("entry");
      resetEntryForm();
      // Pre-select current filter month/year
      if (appState.selectedMonth !== "ALL") {
        document.getElementById("entry-month").value = appState.selectedMonth;
      }
      document.getElementById("entry-year").value = appState.selectedYear;
      updateFormPreview();
    });
  }

  // Topbar Quick Blank / Clear Slate
  const topbarClearBtn = document.getElementById("btn-topbar-clear");
  if (topbarClearBtn) {
    topbarClearBtn.addEventListener("click", () => {
      if (appState.entries.length === 0) {
        showToast("Dashboard is already clear and ready for presentation!", "info");
        return;
      }
      if (confirm("✨ Start fresh with a blank dashboard for your presentation?")) {
        appState.entries = [];
        saveStateToStorage();
        updateUI();
        showToast("Dashboard cleared! Ready for on-the-spot budget entry.", "success");
      }
    });
  }

  // Topbar Quick Demo Data Load
  const topbarDemoBtn = document.getElementById("btn-topbar-demo");
  if (topbarDemoBtn) {
    topbarDemoBtn.addEventListener("click", () => {
      loadSample12MonthData(true);
    });
  }

  // Budget Entry Form
  const entryForm = document.getElementById("form-budget-entry");
  if (entryForm) {
    entryForm.addEventListener("submit", handleEntryFormSubmit);
    
    // Live preview update triggers
    document.getElementById("entry-type").addEventListener("change", (e) => {
      populateCategoryDropdown("entry-category", e.target.value);
      updateFormPreview();
    });
    document.getElementById("entry-month").addEventListener("change", updateFormPreview);
    document.getElementById("entry-year").addEventListener("change", updateFormPreview);
    document.getElementById("entry-amount").addEventListener("input", updateFormPreview);
    document.getElementById("btn-cancel-entry").addEventListener("click", resetEntryForm);
  }

  // Custom Category Modal
  document.getElementById("btn-open-custom-category-modal").addEventListener("click", openCustomCategoryModal);
  document.getElementById("btn-close-category-modal").addEventListener("click", closeCustomCategoryModal);
  document.getElementById("btn-cancel-custom-category").addEventListener("click", closeCustomCategoryModal);
  document.getElementById("btn-save-custom-category").addEventListener("click", handleSaveCustomCategory);

  // Transactions Filter & Search
  document.getElementById("tx-search-input").addEventListener("input", renderTransactionsTable);
  document.getElementById("tx-filter-type").addEventListener("change", renderTransactionsTable);
  document.getElementById("tx-filter-month").addEventListener("change", renderTransactionsTable);
  document.getElementById("btn-export-filtered-csv").addEventListener("click", exportFilteredTransactionsCSV);

  // Matrix Page CSV & Print
  document.getElementById("btn-export-matrix-csv").addEventListener("click", exportMatrixCSV);

  // CSV Import / Export page buttons
  document.getElementById("btn-load-sample-data").addEventListener("click", () => {
    loadSample12MonthData(true);
  });
  document.getElementById("btn-export-full-csv").addEventListener("click", exportFullCSV);
  document.getElementById("btn-download-csv-template").addEventListener("click", downloadCSVTemplate);
  document.getElementById("btn-clear-all-data").addEventListener("click", handleClearAllData);

  // CSV Drag and Drop
  setupCSVUpload();

  // Topbar & Transactions Bulk Add Navigation
  const topbarBulkBtn = document.getElementById("btn-topbar-bulk-add");
  if (topbarBulkBtn) {
    topbarBulkBtn.addEventListener("click", () => {
      navigateTo("entry");
      switchEntryTab("bulk");
    });
  }

  const txBulkBtn = document.getElementById("btn-tx-bulk-add");
  if (txBulkBtn) {
    txBulkBtn.addEventListener("click", () => {
      navigateTo("entry");
      switchEntryTab("bulk");
    });
  }

  // Budget Entry Tabs (Single vs Bulk)
  const tabSingle = document.getElementById("btn-tab-single-entry");
  const tabBulk = document.getElementById("btn-tab-bulk-entry");
  if (tabSingle && tabBulk) {
    tabSingle.addEventListener("click", () => switchEntryTab("single"));
    tabBulk.addEventListener("click", () => switchEntryTab("bulk"));
  }

  // Initialize Bulk Transaction Import Engine
  initBulkTransactionModule();

  // Test Suite Runner Button
  document.getElementById("btn-run-tests").addEventListener("click", () => {
    runCalculationTests();
    showToast("Calculation test suite executed successfully!", "success");
  });
}

function switchEntryTab(tabName) {
  const singleContainer = document.getElementById("single-entry-container");
  const bulkContainer = document.getElementById("bulk-entry-container");
  const tabSingle = document.getElementById("btn-tab-single-entry");
  const tabBulk = document.getElementById("btn-tab-bulk-entry");

  if (!singleContainer || !bulkContainer) return;

  if (tabName === "single") {
    singleContainer.style.display = "block";
    bulkContainer.style.display = "none";
    tabSingle.classList.add("active");
    tabBulk.classList.remove("active");
  } else {
    singleContainer.style.display = "none";
    bulkContainer.style.display = "block";
    tabSingle.classList.remove("active");
    tabBulk.classList.add("active");
  }
}

// Navigation switcher
function navigateTo(viewName) {
  appState.activeView = viewName;
  
  // Update sidebar links
  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  // Update page views
  document.querySelectorAll(".page-view").forEach(view => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  // Update Page Title
  const titles = {
    dashboard: { title: "Dashboard", sub: "Understand your money. Plan your future." },
    entry: { title: "Budget Entry", sub: "Add or update income, expenses and investments" },
    transactions: { title: "Transactions", sub: "Full searchable and filterable financial ledger" },
    matrix: { title: "Budget Matrix", sub: "Annual 12-Month Financial Model (Excel Template Structure)" },
    analytics: { title: "Analytics", sub: "Deep financial diagnostics and category velocity" },
    "import-export": { title: "CSV Data Management", sub: "Import, export and load realistic sample datasets" },
    verification: { title: "Test Suite & Submission", sub: "Formula tests & FinVerse Student Guide verification" }
  };

  const meta = titles[viewName] || titles.dashboard;
  document.getElementById("current-page-title").textContent = meta.title;
  document.getElementById("current-page-subtitle").textContent = meta.sub;

  // Close mobile sidebar if open
  document.getElementById("sidebar").classList.remove("open");

  // Specific view refresh
  if (viewName === "dashboard") {
    renderAllCharts();
  } else if (viewName === "matrix") {
    renderBudgetMatrix();
  } else if (viewName === "transactions") {
    renderTransactionsTable();
  } else if (viewName === "analytics") {
    renderAnalyticsView();
  }
}

// ==========================================================================
// 6. CATEGORY MANAGEMENT & DROPDOWNS
// ==========================================================================

function getAllCategoriesForType(type) {
  const predefined = PREDEFINED_CATEGORIES[type] || [];
  const custom = appState.customCategories[type] || [];
  return [...predefined, ...custom];
}

function populateCategorySelects() {
  populateCategoryDropdown("entry-category", document.getElementById("entry-type").value || "Expense");
}

function populateCategoryDropdown(elementId, type) {
  const select = document.getElementById(elementId);
  if (!select) return;

  select.innerHTML = "";
  const categories = getAllCategoriesForType(type);

  categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function openCustomCategoryModal() {
  document.getElementById("modal-custom-category").classList.add("active");
  document.getElementById("custom-cat-name").value = "";
}

function closeCustomCategoryModal() {
  document.getElementById("modal-custom-category").classList.remove("active");
}

function handleSaveCustomCategory() {
  const type = document.getElementById("custom-cat-type").value;
  const name = document.getElementById("custom-cat-name").value.trim();

  if (!name) {
    showToast("Please enter a category name", "warning");
    return;
  }

  const existing = getAllCategoriesForType(type);
  if (existing.some(c => c.toLowerCase() === name.toLowerCase())) {
    showToast("This category already exists", "warning");
    return;
  }

  if (!appState.customCategories[type]) {
    appState.customCategories[type] = [];
  }
  appState.customCategories[type].push(name);
  saveStateToStorage();

  // If currently in entry view with matching type, re-populate & select
  if (document.getElementById("entry-type").value === type) {
    populateCategoryDropdown("entry-category", type);
    document.getElementById("entry-category").value = name;
  }

  closeCustomCategoryModal();
  showToast(`Custom category "${name}" added to ${type}!`, "success");
  updateUI();
}

// ==========================================================================
// 7. FORM SUBMISSION & CRUD ACTIONS
// ==========================================================================

function handleEntryFormSubmit(e) {
  e.preventDefault();

  const year = Number(document.getElementById("entry-year").value);
  const month = document.getElementById("entry-month").value;
  const type = document.getElementById("entry-type").value;
  const category = document.getElementById("entry-category").value;
  const amount = parseFloat(document.getElementById("entry-amount").value);
  const notes = document.getElementById("entry-notes").value.trim();
  const editId = document.getElementById("entry-edit-id").value;

  // Validation
  if (isNaN(amount) || amount <= 0) {
    showToast("Please enter a valid positive amount (> 0)", "error");
    return;
  }

  if (!category) {
    showToast("Please select a category", "error");
    return;
  }

  if (editId) {
    // Update existing
    const idx = appState.entries.findIndex(entry => String(entry.id) === String(editId));
    if (idx !== -1) {
      appState.entries[idx] = {
        ...appState.entries[idx],
        year,
        month,
        type,
        category,
        amount,
        notes,
        updatedAt: new Date().toISOString()
      };
      showToast("Budget entry updated successfully!", "success");
    }
  } else {
    // Add new
    const newEntry = {
      id: generateNextId(),
      year,
      month,
      type,
      category,
      amount,
      notes: notes || `${month} ${type}`,
      createdAt: new Date().toISOString()
    };
    appState.entries.unshift(newEntry);
    showToast(`Added ${type}: ₹${amount.toLocaleString("en-IN")}`, "success");
  }

  saveStateToStorage();
  resetEntryForm();
  updateUI();
  navigateTo("transactions");
}

function generateNextId() {
  if (appState.entries.length === 0) return 1;
  const maxId = appState.entries.reduce((max, e) => {
    const num = Number(e.id);
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return maxId + 1;
}

function resetEntryForm() {
  document.getElementById("form-budget-entry").reset();
  document.getElementById("entry-edit-id").value = "";
  document.getElementById("btn-save-entry").textContent = "Save Budget Entry";
  populateCategoryDropdown("entry-category", document.getElementById("entry-type").value);
  updateFormPreview();
}

function editEntry(id) {
  const entry = appState.entries.find(e => String(e.id) === String(id));
  if (!entry) return;

  navigateTo("entry");
  document.getElementById("entry-edit-id").value = entry.id;
  document.getElementById("entry-year").value = entry.year;
  document.getElementById("entry-month").value = entry.month;
  document.getElementById("entry-type").value = entry.type;
  
  populateCategoryDropdown("entry-category", entry.type);
  document.getElementById("entry-category").value = entry.category;
  
  document.getElementById("entry-amount").value = entry.amount;
  document.getElementById("entry-notes").value = entry.notes || "";
  document.getElementById("btn-save-entry").textContent = "Update Budget Entry";

  updateFormPreview();
}

function deleteEntry(id) {
  const entry = appState.entries.find(e => String(e.id) === String(id));
  if (!entry) return;

  if (confirm(`Are you sure you want to delete this ${entry.type} entry of ₹${entry.amount.toLocaleString("en-IN")} (${entry.category})?`)) {
    appState.entries = appState.entries.filter(e => String(e.id) !== String(id));
    saveStateToStorage();
    showToast("Entry deleted", "info");
    updateUI();
  }
}

function updateFormPreview() {
  const year = Number(document.getElementById("entry-year").value) || appState.selectedYear;
  const month = document.getElementById("entry-month").value || "January";
  const type = document.getElementById("entry-type").value;
  const amount = parseFloat(document.getElementById("entry-amount").value) || 0;

  const currentMonthEntries = appState.entries.filter(e => Number(e.year) === year && e.month === month);
  const currentMetrics = calculateFinancialMetrics(currentMonthEntries);

  let projectedIncome = currentMetrics.subTotalIncome;
  let projectedExpenses = currentMetrics.subTotalExpenses;

  if (type === "Income") {
    projectedIncome += amount;
  } else if (type === "Expense") {
    projectedExpenses += amount;
  }

  const projectedSurplus = projectedIncome - projectedExpenses;
  const projectedRate = projectedIncome > 0 ? (projectedSurplus / projectedIncome) * 100 : null;

  document.getElementById("preview-month-income").textContent = formatINR(projectedIncome);
  document.getElementById("preview-month-expenses").textContent = formatINR(projectedExpenses);
  
  const surplusEl = document.getElementById("preview-month-surplus");
  surplusEl.textContent = formatINR(projectedSurplus);
  surplusEl.style.color = projectedSurplus < 0 ? "#ef4444" : "#10b981";

  document.getElementById("preview-month-rate").textContent = formatPercent(projectedRate);
}

// ==========================================================================
// 8. DASHBOARD REFRESH, KPIS, INSIGHTS & CHARTS
// ==========================================================================

function updateUI() {
  const year = appState.selectedYear;
  const month = appState.selectedMonth;

  // Filter entries for active period
  const activeEntries = getFilteredEntries(year, month);
  const metrics = calculateFinancialMetrics(activeEntries);

  // Update Nav Badge
  document.getElementById("nav-tx-count").textContent = appState.entries.length;

  // Update KPI Cards
  document.getElementById("kpi-total-income").textContent = formatINR(metrics.subTotalIncome);
  document.getElementById("kpi-total-expenses").textContent = formatINR(metrics.subTotalExpenses);
  
  // Expenses as % of Income
  const expenseRatioEl = document.getElementById("kpi-expense-ratio");
  expenseRatioEl.textContent = formatPercent(metrics.expensePercentage);
  const ratioBadge = document.getElementById("kpi-ratio-badge");
  if (metrics.expensePercentage === null) {
    ratioBadge.className = "badge badge-neutral";
    ratioBadge.textContent = "Income = ₹0";
  } else if (metrics.expensePercentage > 100) {
    ratioBadge.className = "badge badge-danger";
    ratioBadge.textContent = "Overspending > 100%";
  } else if (metrics.expensePercentage > 80) {
    ratioBadge.className = "badge badge-warning";
    ratioBadge.textContent = "Tight Budget > 80%";
  } else {
    ratioBadge.className = "badge badge-success";
    ratioBadge.textContent = "Well Balanced < 80%";
  }

  // Investable Surplus
  const surplusEl = document.getElementById("kpi-investable-surplus");
  surplusEl.textContent = formatINR(metrics.investableSurplus);
  const surplusTag = document.getElementById("kpi-surplus-tag");
  if (metrics.isDeficit) {
    surplusEl.style.color = "#ef4444";
    surplusTag.className = "badge badge-danger";
    surplusTag.textContent = "Deficit Month";
  } else {
    surplusEl.style.color = "var(--text-primary)";
    surplusTag.className = "badge badge-success";
    surplusTag.textContent = "Net Positive Surplus";
  }

  // Savings Rate
  const savingsRateEl = document.getElementById("kpi-savings-rate");
  savingsRateEl.textContent = formatPercent(metrics.savingsRate);
  const savingsBadge = document.getElementById("kpi-savings-badge");
  if (metrics.savingsRate === null) {
    savingsBadge.className = "badge badge-neutral";
    savingsBadge.textContent = "Income = ₹0";
  } else if (metrics.savingsRate < 0) {
    savingsBadge.className = "badge badge-danger";
    savingsBadge.textContent = "Negative Savings";
  } else if (metrics.savingsRate >= 40) {
    savingsBadge.className = "badge badge-success";
    savingsBadge.textContent = "High Saver ≥ 40%";
  } else {
    savingsBadge.className = "badge badge-info";
    savingsBadge.textContent = "Moderate Saver";
  }

  // Investments & Uninvested Savings
  document.getElementById("kpi-investments-total").textContent = formatINR(metrics.subTotalInvestments);
  document.getElementById("kpi-uninvested-total").textContent = formatINR(metrics.uninvestedSavings);

  // Subtext Period Info
  const periodLabel = month === "ALL" ? `Annual ${year}` : `${month} ${year}`;
  document.getElementById("kpi-income-subtext").textContent = `Inflows for ${periodLabel}`;
  document.getElementById("kpi-expense-subtext").textContent = `Outflows for ${periodLabel}`;

  // Deficit Banner Warning Check
  const deficitBanner = document.getElementById("deficit-alert-banner");
  if (metrics.isDeficit) {
    deficitBanner.style.display = "flex";
    document.getElementById("deficit-amount").textContent = formatINR(Math.abs(metrics.investableSurplus));
  } else {
    deficitBanner.style.display = "none";
  }

  // Generate Written Financial Insights
  generateFinancialInsights(year, month, metrics, activeEntries);

  // Render Charts
  if (appState.activeView === "dashboard") {
    renderAllCharts();
  } else if (appState.activeView === "transactions") {
    renderTransactionsTable();
  } else if (appState.activeView === "matrix") {
    renderBudgetMatrix();
  } else if (appState.activeView === "analytics") {
    renderAnalyticsView();
  }
}

// ==========================================================================
// 9. WRITTEN FINANCIAL INSIGHTS ENGINE (Factual, Dynamic, Accurate)
// ==========================================================================

function generateFinancialInsights(year, month, metrics, activeEntries) {
  const container = document.getElementById("dashboard-insights-container");
  if (!container) return;

  container.innerHTML = "";
  const insights = [];

  // Insight 1: Highest Expense Category
  const expenseEntries = Object.entries(metrics.expenseByCategory);
  if (expenseEntries.length > 0 && metrics.subTotalExpenses > 0) {
    expenseEntries.sort((a, b) => b[1] - a[1]);
    const topExp = expenseEntries[0];
    const topExpPct = ((topExp[1] / metrics.subTotalExpenses) * 100).toFixed(1);
    insights.push({
      icon: "📌",
      text: `<strong>${topExp[0]}</strong> is the highest expense category (${formatINR(topExp[1])}), accounting for <strong>${topExpPct}%</strong> of total expenditures.`
    });
  }

  // Insight 2: Annual Trajectory & Peak Savings Month
  const allYearEntries = appState.entries.filter(e => Number(e.year) === year);
  if (allYearEntries.length > 0) {
    const monthlySurpluses = MONTHS.map(m => {
      const mEntries = allYearEntries.filter(e => e.month === m);
      const mMetrics = calculateFinancialMetrics(mEntries);
      return { month: m, surplus: mMetrics.investableSurplus, income: mMetrics.subTotalIncome, rate: mMetrics.savingsRate };
    });

    const activeMonths = monthlySurpluses.filter(m => m.income > 0 || m.surplus !== 0);
    if (activeMonths.length > 0) {
      const highestMonth = [...activeMonths].sort((a, b) => b.surplus - a.surplus)[0];
      if (highestMonth && highestMonth.surplus > 0) {
        insights.push({
          icon: "🚀",
          text: `Peak investable surplus occurred in <strong>${highestMonth.month}</strong> with <strong>${formatINR(highestMonth.surplus)}</strong> saved (${highestMonth.rate ? highestMonth.rate.toFixed(1) + '% savings rate' : ''}).`
        });
      }

      // Deficit Months check
      const deficitMonths = activeMonths.filter(m => m.surplus < 0);
      if (deficitMonths.length > 0) {
        const dNames = deficitMonths.map(d => d.month).join(", ");
        insights.push({
          icon: "⚠️",
          text: `Expenses exceeded income in <strong>${deficitMonths.length} month(s)</strong>: ${dNames}. Ensure emergency reserve covers the shortfall.`
        });
      } else {
        insights.push({
          icon: "✅",
          text: `Budget discipline maintained: Income exceeded expenses across all recorded months with 0 deficit periods.`
        });
      }

      // Savings Rate Trend (First Half vs Second Half or Jan vs Latest)
      const janData = monthlySurpluses.find(m => m.month === "January" && m.income > 0);
      const latestData = activeMonths[activeMonths.length - 1];
      if (janData && latestData && janData.month !== latestData.month && janData.rate !== null && latestData.rate !== null) {
        const diff = latestData.rate - janData.rate;
        const trend = diff >= 0 ? "increased" : "decreased";
        insights.push({
          icon: "📈",
          text: `Your monthly savings rate ${trend} from <strong>${janData.rate.toFixed(1)}% in January</strong> to <strong>${latestData.rate.toFixed(1)}% in ${latestData.month}</strong>.`
        });
      }
    }
  }

  // Insight 3: Investment vs Uninvested Allocation
  if (metrics.investableSurplus > 0) {
    const investPct = ((metrics.subTotalInvestments / metrics.investableSurplus) * 100).toFixed(1);
    insights.push({
      icon: "💼",
      text: `Surplus Deployment: <strong>${investPct}%</strong> (${formatINR(metrics.subTotalInvestments)}) is allocated to investment portfolios, while <strong>${formatINR(metrics.uninvestedSavings)}</strong> remains as uninvested cash buffer.`
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: "💡",
      text: "Add income and expense entries for this period to generate automated financial insights and trend analysis."
    });
  }

  insights.forEach(item => {
    const div = document.createElement("div");
    div.className = "insight-item";
    div.innerHTML = `
      <span class="insight-bullet">${item.icon}</span>
      <div>${item.text}</div>
    `;
    container.appendChild(div);
  });
}

// ==========================================================================
// 10. CHART RENDERING ENGINE (Chart.js 4.4)
// ==========================================================================

function destroyChart(id) {
  if (appState.charts[id]) {
    appState.charts[id].destroy();
    delete appState.charts[id];
  }
}

function getThemeColors() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  return {
    text: isDark ? "#cbd5e1" : "#475569",
    grid: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
    income: "#10b981",
    expense: "#ef4444",
    surplus: "#0ea5e9",
    investment: "#f59e0b",
    palette: [
      "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899",
      "#06b6d4", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
      "#a855f7", "#e11d48", "#0284c7", "#d97706"
    ]
  };
}

function renderAllCharts() {
  renderIncomeVsExpensesChart();
  renderExpenseBreakdownChart();
  renderSavingsRateChart();
  renderTopExpensesChart();
  renderSurplusAllocationChart();
  renderExpenseThresholdChart();
}

// Chart 1: Income vs Expenses Trend (12-Month Combo Bar + Line)
function renderIncomeVsExpensesChart() {
  const canvas = document.getElementById("chart-income-vs-expenses");
  if (!canvas) return;
  destroyChart("incomeExpense");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const allYearEntries = appState.entries.filter(e => Number(e.year) === year);

  const incomeData = [];
  const expenseData = [];
  const surplusData = [];

  MONTHS.forEach(m => {
    const mEntries = allYearEntries.filter(e => e.month === m);
    const mMetrics = calculateFinancialMetrics(mEntries);
    incomeData.push(mMetrics.subTotalIncome);
    expenseData.push(mMetrics.subTotalExpenses);
    surplusData.push(mMetrics.investableSurplus);
  });

  const ctx = canvas.getContext("2d");
  appState.charts["incomeExpense"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)),
      datasets: [
        {
          type: "bar",
          label: "Sub Total Income",
          data: incomeData,
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderRadius: 6,
          order: 2
        },
        {
          type: "bar",
          label: "Sub Total Expenses",
          data: expenseData,
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderRadius: 6,
          order: 3
        },
        {
          type: "line",
          label: "Investable Surplus",
          data: surplusData,
          borderColor: "#0ea5e9",
          backgroundColor: "#0ea5e9",
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "top",
          labels: { color: colors.text, font: { family: "Inter", size: 11, weight: 600 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${formatINR(item.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            callback: (v) => formatINR(v)
          }
        }
      }
    }
  });
}

// Chart 2: Expense Category Breakdown (Donut)
function renderExpenseBreakdownChart() {
  const canvas = document.getElementById("chart-expense-breakdown");
  if (!canvas) return;
  destroyChart("expenseBreakdown");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const month = appState.selectedMonth;
  const activeEntries = getFilteredEntries(year, month);
  const metrics = calculateFinancialMetrics(activeEntries);

  const categories = Object.keys(metrics.expenseByCategory);
  const data = Object.values(metrics.expenseByCategory);

  const ctx = canvas.getContext("2d");
  if (data.length === 0) {
    appState.charts["expenseBreakdown"] = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["No Expense Data"],
        datasets: [{ data: [1], backgroundColor: ["#cbd5e1"] }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
    return;
  }

  appState.charts["expenseBreakdown"] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [{
        data: data,
        backgroundColor: colors.palette.slice(0, categories.length),
        borderWidth: 2,
        borderColor: document.documentElement.getAttribute("data-theme") === "dark" ? "#131b2e" : "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: colors.text,
            font: { family: "Inter", size: 10 },
            boxWidth: 12
          }
        },
        tooltip: {
          callbacks: {
            label: (item) => {
              const total = data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((item.raw / total) * 100).toFixed(1) : 0;
              return `${item.label}: ${formatINR(item.raw)} (${pct}%)`;
            }
          }
        }
      },
      cutout: "65%"
    }
  });
}

// Chart 3: Savings Rate Over Time (Line)
function renderSavingsRateChart() {
  const canvas = document.getElementById("chart-savings-rate");
  if (!canvas) return;
  destroyChart("savingsRate");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const allYearEntries = appState.entries.filter(e => Number(e.year) === year);

  const rateData = [];
  MONTHS.forEach(m => {
    const mEntries = allYearEntries.filter(e => e.month === m);
    const mMetrics = calculateFinancialMetrics(mEntries);
    rateData.push(mMetrics.savingsRate !== null ? mMetrics.savingsRate : null);
  });

  const ctx = canvas.getContext("2d");
  appState.charts["savingsRate"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)),
      datasets: [
        {
          label: "Savings Rate (%)",
          data: rateData,
          borderColor: "#8b5cf6",
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "#8b5cf6",
          spanGaps: true
        },
        {
          label: "Target Benchmark (30%)",
          data: Array(12).fill(30),
          borderColor: "#10b981",
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: colors.text, font: { family: "Inter", size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.raw !== null ? item.raw.toFixed(1) + '%' : 'N/A'}`
          }
        }
      },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            callback: (v) => `${v}%`
          }
        }
      }
    }
  });
}

// Chart 4: Top 5 Expense Categories (Horizontal Bar)
function renderTopExpensesChart() {
  const canvas = document.getElementById("chart-top-expenses");
  if (!canvas) return;
  destroyChart("topExpenses");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const month = appState.selectedMonth;
  const activeEntries = getFilteredEntries(year, month);
  const metrics = calculateFinancialMetrics(activeEntries);

  const sortedExpenses = Object.entries(metrics.expenseByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const labels = sortedExpenses.map(e => e[0]);
  const data = sortedExpenses.map(e => e[1]);

  const ctx = canvas.getContext("2d");
  appState.charts["topExpenses"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.length > 0 ? labels : ["No Expense Data"],
      datasets: [{
        label: "Total Amount Spent",
        data: data.length > 0 ? data : [0],
        backgroundColor: "rgba(249, 115, 22, 0.85)",
        borderRadius: 6
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `Spent: ${formatINR(item.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            callback: (v) => formatINR(v)
          }
        },
        y: { grid: { display: false }, ticks: { color: colors.text, font: { size: 11 } } }
      }
    }
  });
}

// Chart 5: Surplus Allocation (Investments vs Uninvested Savings Stacked Bar)
function renderSurplusAllocationChart() {
  const canvas = document.getElementById("chart-surplus-allocation");
  if (!canvas) return;
  destroyChart("surplusAllocation");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const allYearEntries = appState.entries.filter(e => Number(e.year) === year);

  const investData = [];
  const uninvestData = [];

  MONTHS.forEach(m => {
    const mEntries = allYearEntries.filter(e => e.month === m);
    const mMetrics = calculateFinancialMetrics(mEntries);
    investData.push(mMetrics.subTotalInvestments);
    uninvestData.push(Math.max(0, mMetrics.uninvestedSavings));
  });

  const ctx = canvas.getContext("2d");
  appState.charts["surplusAllocation"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)),
      datasets: [
        {
          label: "Investments towards Portfolio",
          data: investData,
          backgroundColor: "#f59e0b",
          borderRadius: 4
        },
        {
          label: "Uninvested Savings (Cash Buffer)",
          data: uninvestData,
          backgroundColor: "#06b6d4",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: colors.text, font: { family: "Inter", size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${formatINR(item.raw)}`
          }
        }
      },
      scales: {
        x: { stacked: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
        y: {
          stacked: true,
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            callback: (v) => formatINR(v)
          }
        }
      }
    }
  });
}

// Chart 6: Expenses as % of Income (100% Danger Boundary)
function renderExpenseThresholdChart() {
  const canvas = document.getElementById("chart-expense-threshold");
  if (!canvas) return;
  destroyChart("expenseThreshold");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const allYearEntries = appState.entries.filter(e => Number(e.year) === year);

  const ratioData = [];
  const barColors = [];

  MONTHS.forEach(m => {
    const mEntries = allYearEntries.filter(e => e.month === m);
    const mMetrics = calculateFinancialMetrics(mEntries);
    const ratio = mMetrics.expensePercentage !== null ? mMetrics.expensePercentage : 0;
    ratioData.push(ratio);
    barColors.push(ratio > 100 ? "#ef4444" : ratio > 80 ? "#f59e0b" : "#10b981");
  });

  const ctx = canvas.getContext("2d");
  appState.charts["expenseThreshold"] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: MONTHS.map(m => m.slice(0, 3)),
      datasets: [
        {
          type: "bar",
          label: "Expense % of Income",
          data: ratioData,
          backgroundColor: barColors,
          borderRadius: 6,
          order: 2
        },
        {
          type: "line",
          label: "100% Inflow Boundary",
          data: Array(12).fill(100),
          borderColor: "#dc2626",
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: { color: colors.text, font: { family: "Inter", size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (item) => `${item.dataset.label}: ${item.raw.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
        y: {
          grid: { color: colors.grid },
          ticks: {
            color: colors.text,
            callback: (v) => `${v}%`
          }
        }
      }
    }
  });
}

// ==========================================================================
// 11. BUDGET MATRIX VIEW (Excel Sheet 2 Standalone Replica)
// ==========================================================================

function renderBudgetMatrix() {
  const container = document.getElementById("matrix-table-container");
  if (!container) return;

  const year = appState.selectedYear;
  const yearEntries = appState.entries.filter(e => Number(e.year) === year);

  // Group all active income categories
  const activeIncomeCats = Array.from(new Set([
    ...PREDEFINED_CATEGORIES.Income.slice(0, 6),
    ...yearEntries.filter(e => e.type === "Income").map(e => e.category)
  ]));

  // Group all active expense categories
  const activeExpenseCats = Array.from(new Set([
    ...PREDEFINED_CATEGORIES.Expense.slice(0, 15),
    ...yearEntries.filter(e => e.type === "Expense").map(e => e.category)
  ]));

  // Compute monthly calculations for matrix
  const monthlyMetrics = {};
  MONTHS.forEach(m => {
    const mEntries = yearEntries.filter(e => e.month === m);
    monthlyMetrics[m] = calculateFinancialMetrics(mEntries);
  });

  const annualMetrics = calculateFinancialMetrics(yearEntries);

  let html = `
    <table class="matrix-table">
      <thead>
        <tr>
          <th>Financial Head / Category</th>
          ${MONTHS.map(m => `<th>${m.slice(0, 3)}</th>`).join("")}
          <th style="background-color: #e2e8f0; color: #0f172a; font-weight: 800;">Yearly Total</th>
        </tr>
      </thead>
      <tbody>
        <!-- INCOME SECTION -->
        <tr class="matrix-section-row">
          <td colspan="14">📥 INCOME (INFLOWS)</td>
        </tr>
  `;

  // Render Income Heads
  activeIncomeCats.forEach((cat, idx) => {
    let rowYearTotal = 0;
    html += `<tr><td>${idx + 1}. ${cat}</td>`;
    MONTHS.forEach(m => {
      const amt = monthlyMetrics[m].incomeByCategory[cat] || 0;
      rowYearTotal += amt;
      html += `<td>${amt > 0 ? formatINR(amt) : "-"}</td>`;
    });
    html += `<td style="font-weight: 700;">${rowYearTotal > 0 ? formatINR(rowYearTotal) : "-"}</td></tr>`;
  });

  // Sub Total Income
  html += `
    <tr class="matrix-subtotal-row">
      <td><strong>Sub Total Income [SUM]</strong></td>
      ${MONTHS.map(m => `<td><strong>${formatINR(monthlyMetrics[m].subTotalIncome)}</strong></td>`).join("")}
      <td style="font-weight: 800; color: #047857;">${formatINR(annualMetrics.subTotalIncome)}</td>
    </tr>

    <!-- EXPENSE SECTION -->
    <tr class="matrix-section-row">
      <td colspan="14">📤 EXPENSES (OUTFLOWS)</td>
    </tr>
  `;

  // Render Expense Heads
  activeExpenseCats.forEach((cat, idx) => {
    let rowYearTotal = 0;
    html += `<tr><td>${idx + 1}. ${cat}</td>`;
    MONTHS.forEach(m => {
      const amt = monthlyMetrics[m].expenseByCategory[cat] || 0;
      rowYearTotal += amt;
      html += `<td>${amt > 0 ? formatINR(amt) : "-"}</td>`;
    });
    html += `<td style="font-weight: 700;">${rowYearTotal > 0 ? formatINR(rowYearTotal) : "-"}</td></tr>`;
  });

  // Sub Total Expenses
  html += `
    <tr class="matrix-expense-subtotal-row">
      <td><strong>Sub Total Expenses [SUM]</strong></td>
      ${MONTHS.map(m => `<td><strong>${formatINR(monthlyMetrics[m].subTotalExpenses)}</strong></td>`).join("")}
      <td style="font-weight: 800; color: #b91c1c;">${formatINR(annualMetrics.subTotalExpenses)}</td>
    </tr>

    <!-- EXPENSES AS % OF INCOME -->
    <tr class="matrix-ratio-row">
      <td>Expenses as % of Income [Exp / Inc]</td>
      ${MONTHS.map(m => `<td>${formatPercent(monthlyMetrics[m].expensePercentage)}</td>`).join("")}
      <td><strong>${formatPercent(annualMetrics.expensePercentage)}</strong></td>
    </tr>

    <!-- INVESTABLE SURPLUS -->
    <tr class="matrix-surplus-row">
      <td><strong>Investable Surplus (Savings) [Inc - Exp]</strong></td>
      ${MONTHS.map(m => {
        const s = monthlyMetrics[m].investableSurplus;
        const color = s < 0 ? "#ef4444" : "#0369a1";
        return `<td style="color: ${color};"><strong>${formatINR(s)}</strong></td>`;
      }).join("")}
      <td style="font-weight: 800; color: ${annualMetrics.investableSurplus < 0 ? '#ef4444' : '#0369a1'};">${formatINR(annualMetrics.investableSurplus)}</td>
    </tr>

    <!-- SURPLUS AS % OF INCOME (SAVINGS RATE) -->
    <tr class="matrix-ratio-row">
      <td>Investable Surplus as % of Income (Savings Rate)</td>
      ${MONTHS.map(m => `<td>${formatPercent(monthlyMetrics[m].savingsRate)}</td>`).join("")}
      <td><strong>${formatPercent(annualMetrics.savingsRate)}</strong></td>
    </tr>

    <!-- INVESTMENTS -->
    <tr>
      <td><strong>Investments towards portfolio</strong></td>
      ${MONTHS.map(m => `<td>${formatINR(monthlyMetrics[m].subTotalInvestments)}</td>`).join("")}
      <td style="font-weight: 700;">${formatINR(annualMetrics.subTotalInvestments)}</td>
    </tr>

    <!-- INVESTMENTS AS % OF INCOME -->
    <tr class="matrix-ratio-row">
      <td>Investments as % of income</td>
      ${MONTHS.map(m => `<td>${formatPercent(monthlyMetrics[m].investmentPercentage)}</td>`).join("")}
      <td><strong>${formatPercent(annualMetrics.investmentPercentage)}</strong></td>
    </tr>

    <!-- UNINVESTED SAVINGS -->
    <tr style="background-color: rgba(6, 182, 212, 0.1); font-weight: 800;">
      <td><strong>Uninvested Savings [Surplus - Invest]</strong></td>
      ${MONTHS.map(m => `<td><strong>${formatINR(monthlyMetrics[m].uninvestedSavings)}</strong></td>`).join("")}
      <td style="font-weight: 800; color: #0891b2;">${formatINR(annualMetrics.uninvestedSavings)}</td>
    </tr>
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

// ==========================================================================
// 12. TRANSACTIONS LEDGER TABLE & ACTIONS
// ==========================================================================

function renderTransactionsTable() {
  const tbody = document.getElementById("transactions-table-body");
  const emptyState = document.getElementById("tx-empty-state");
  const table = document.getElementById("transactions-table");
  if (!tbody) return;

  const searchQuery = (document.getElementById("tx-search-input").value || "").toLowerCase();
  const filterType = document.getElementById("tx-filter-type").value;
  const filterMonth = document.getElementById("tx-filter-month").value;

  const filtered = appState.entries.filter(e => {
    const matchSearch = e.category.toLowerCase().includes(searchQuery) || 
                        (e.notes && e.notes.toLowerCase().includes(searchQuery));
    const matchType = filterType === "ALL" || e.type === filterType;
    const matchMonth = filterMonth === "ALL" || e.month === filterMonth;
    return matchSearch && matchType && matchMonth;
  });

  if (filtered.length === 0) {
    table.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  table.style.display = "table";
  emptyState.style.display = "none";

  tbody.innerHTML = filtered.map(e => {
    const typeBadgeClass = e.type === "Income" ? "badge-success" : e.type === "Expense" ? "badge-danger" : "badge-info";
    const amountClass = e.type === "Income" ? "amount-income" : e.type === "Expense" ? "amount-expense" : "amount-investment";
    const prefix = e.type === "Income" ? "+" : e.type === "Expense" ? "-" : "💼";
    const dateDisplay = e.date ? `<span style="font-size: 0.75rem; color: var(--text-muted); display: block;">${e.date}</span>` : '';
    const paymentPill = e.paymentMethod || e.account 
      ? `<span style="font-size: 0.7rem; background: var(--bg-card-alt); border: 1px solid var(--border-color); padding: 1px 6px; border-radius: 4px; color: var(--text-secondary); margin-left: 4px;">${[e.paymentMethod, e.account].filter(Boolean).join(' • ')}</span>`
      : '';

    return `
      <tr>
        <td>#${e.id}</td>
        <td>${e.year}</td>
        <td><strong>${e.month}</strong>${dateDisplay}</td>
        <td><span class="badge ${typeBadgeClass}">${e.type}</span></td>
        <td><strong>${e.category}</strong></td>
        <td class="amount-cell ${amountClass}">${prefix}${formatINR(e.amount)}</td>
        <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis;">
          ${e.notes || "-"} ${paymentPill}
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-sm" onclick="editEntry('${e.id}')" title="Edit Entry">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteEntry('${e.id}')" title="Delete Entry">🗑️</button>
        </td>
      </tr>
    `;
  }).join("");
}

// ==========================================================================
// 13. DEEP ANALYTICS VIEW
// ==========================================================================

function renderAnalyticsView() {
  renderCumulativeSurplusChart();
  renderAnalyticsCategoryTable();
}

function renderCumulativeSurplusChart() {
  const canvas = document.getElementById("chart-cumulative-surplus");
  if (!canvas) return;
  destroyChart("cumulativeSurplus");

  const colors = getThemeColors();
  const year = appState.selectedYear;
  const yearEntries = appState.entries.filter(e => Number(e.year) === year);

  let runningTotal = 0;
  const cumulativeData = [];

  MONTHS.forEach(m => {
    const mEntries = yearEntries.filter(e => e.month === m);
    const mMetrics = calculateFinancialMetrics(mEntries);
    runningTotal += mMetrics.investableSurplus;
    cumulativeData.push(runningTotal);
  });

  const ctx = canvas.getContext("2d");
  appState.charts["cumulativeSurplus"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: MONTHS,
      datasets: [{
        label: "Cumulative Net Wealth / Surplus Growth (₹)",
        data: cumulativeData,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.12)",
        fill: true,
        tension: 0.3,
        pointRadius: 6,
        pointBackgroundColor: "#10b981"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top", labels: { color: colors.text } },
        tooltip: {
          callbacks: { label: (item) => `Accumulated: ${formatINR(item.raw)}` }
        }
      },
      scales: {
        x: { grid: { color: colors.grid }, ticks: { color: colors.text } },
        y: {
          grid: { color: colors.grid },
          ticks: { color: colors.text, callback: (v) => formatINR(v) }
        }
      }
    }
  });
}

function renderAnalyticsCategoryTable() {
  const wrapper = document.getElementById("analytics-category-table-wrapper");
  if (!wrapper) return;

  const year = appState.selectedYear;
  const yearEntries = appState.entries.filter(e => Number(e.year) === year && e.type === "Expense");
  const totalExpense = yearEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  const catMap = {};
  yearEntries.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
  });

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  let html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Expense Category</th>
          <th style="text-align: right;">Total Spent (${year})</th>
          <th style="text-align: right;">% of Total Annual Spend</th>
          <th style="text-align: right;">Monthly Average</th>
          <th>Budget Impact Rating</th>
        </tr>
      </thead>
      <tbody>
  `;

  sorted.forEach(([cat, amt]) => {
    const pct = totalExpense > 0 ? (amt / totalExpense) * 100 : 0;
    const monthlyAvg = amt / 12;
    const badge = pct > 20 ? '<span class="badge badge-danger">High Impact (>20%)</span>' :
                  pct > 10 ? '<span class="badge badge-warning">Medium (10-20%)</span>' :
                  '<span class="badge badge-neutral">Standard (<10%)</span>';

    html += `
      <tr>
        <td><strong>${cat}</strong></td>
        <td class="amount-cell amount-expense">${formatINR(amt)}</td>
        <td style="text-align: right; font-weight: 600;">${pct.toFixed(1)}%</td>
        <td style="text-align: right;">${formatINR(monthlyAvg)}</td>
        <td>${badge}</td>
      </tr>
    `;
  });

  html += "</tbody></table>";
  wrapper.innerHTML = html;
}

// ==========================================================================
// 14. CSV IMPORT, EXPORT & SAMPLE DATA LOADING
// ==========================================================================

function exportFullCSV() {
  exportCSV(appState.entries, `E_Khata_Budget_All_Entries_${appState.selectedYear}.csv`);
}

function exportFilteredTransactionsCSV() {
  const searchQuery = (document.getElementById("tx-search-input").value || "").toLowerCase();
  const filterType = document.getElementById("tx-filter-type").value;
  const filterMonth = document.getElementById("tx-filter-month").value;

  const filtered = appState.entries.filter(e => {
    const matchSearch = e.category.toLowerCase().includes(searchQuery) || 
                        (e.notes && e.notes.toLowerCase().includes(searchQuery));
    const matchType = filterType === "ALL" || e.type === filterType;
    const matchMonth = filterMonth === "ALL" || e.month === filterMonth;
    return matchSearch && matchType && matchMonth;
  });

  exportCSV(filtered, `E_Khata_Budget_Filtered_${filterMonth}_${appState.selectedYear}.csv`);
}

function exportMatrixCSV() {
  const year = appState.selectedYear;
  const yearEntries = appState.entries.filter(e => Number(e.year) === year);

  const activeIncomeCats = Array.from(new Set([
    ...PREDEFINED_CATEGORIES.Income.slice(0, 6),
    ...yearEntries.filter(e => e.type === "Income").map(e => e.category)
  ]));

  const activeExpenseCats = Array.from(new Set([
    ...PREDEFINED_CATEGORIES.Expense.slice(0, 15),
    ...yearEntries.filter(e => e.type === "Expense").map(e => e.category)
  ]));

  const monthlyMetrics = {};
  MONTHS.forEach(m => {
    const mEntries = yearEntries.filter(e => e.month === m);
    monthlyMetrics[m] = calculateFinancialMetrics(mEntries);
  });
  const annual = calculateFinancialMetrics(yearEntries);

  const rows = [];
  rows.push(["Category", ...MONTHS, "Yearly Total"]);
  
  rows.push(["=== INCOME HEADS ==="]);
  activeIncomeCats.forEach(cat => {
    let tot = 0;
    const vals = MONTHS.map(m => {
      const val = monthlyMetrics[m].incomeByCategory[cat] || 0;
      tot += val;
      return val;
    });
    rows.push([cat, ...vals, tot]);
  });
  rows.push(["Sub Total Income", ...MONTHS.map(m => monthlyMetrics[m].subTotalIncome), annual.subTotalIncome]);

  rows.push(["=== EXPENSE HEADS ==="]);
  activeExpenseCats.forEach(cat => {
    let tot = 0;
    const vals = MONTHS.map(m => {
      const val = monthlyMetrics[m].expenseByCategory[cat] || 0;
      tot += val;
      return val;
    });
    rows.push([cat, ...vals, tot]);
  });
  rows.push(["Sub Total Expenses", ...MONTHS.map(m => monthlyMetrics[m].subTotalExpenses), annual.subTotalExpenses]);
  rows.push(["Expenses as % of Income", ...MONTHS.map(m => formatPercent(monthlyMetrics[m].expensePercentage)), formatPercent(annual.expensePercentage)]);
  rows.push(["Investable Surplus", ...MONTHS.map(m => monthlyMetrics[m].investableSurplus), annual.investableSurplus]);
  rows.push(["Savings Rate", ...MONTHS.map(m => formatPercent(monthlyMetrics[m].savingsRate)), formatPercent(annual.savingsRate)]);
  rows.push(["Investments towards Portfolio", ...MONTHS.map(m => monthlyMetrics[m].subTotalInvestments), annual.subTotalInvestments]);
  rows.push(["Uninvested Savings", ...MONTHS.map(m => monthlyMetrics[m].uninvestedSavings), annual.uninvestedSavings]);

  const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(csvContent, `E_Khata_Budget_Matrix_${year}.csv`, "text/csv;charset=utf-8;");
}

function exportCSV(records, filename) {
  if (!records || records.length === 0) {
    showToast("No records available to export", "warning");
    return;
  }

  const headers = ["ID", "Year", "Month", "Type", "Category", "Amount", "Notes"];
  const rows = records.map(e => [
    e.id,
    e.year,
    e.month,
    e.type,
    `"${(e.category || '').replace(/"/g, '""')}"`,
    e.amount,
    `"${(e.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  triggerDownload(csvContent, filename, "text/csv;charset=utf-8;");
  showToast(`Exported ${records.length} records to CSV!`, "success");
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadCSVTemplate() {
  const sample = `ID,Year,Month,Type,Category,Amount,Notes
1,2026,January,Income,After Tax Salary - Self,95000,Monthly salary
2,2026,January,Expense,Grocery,12000,Monthly groceries
3,2026,January,Expense,Rent payments,25000,House rent
4,2026,January,Investment,Investments towards portfolio,30000,Mutual fund SIP`;
  triggerDownload(sample, "E_Khata_Budget_Template.csv", "text/csv;charset=utf-8;");
}

function setupCSVUpload() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("csv-file-input");

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", () => fileInput.click());

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#10b981";
    dropZone.style.backgroundColor = "rgba(16, 185, 129, 0.05)";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "var(--border-color)";
    dropZone.style.backgroundColor = "var(--bg-card-alt)";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--border-color)";
    dropZone.style.backgroundColor = "var(--bg-card-alt)";
    if (e.dataTransfer.files.length > 0) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      processCSVFile(e.target.files[0]);
      fileInput.value = "";
    }
  });
}

function processCSVFile(file) {
  if (!file.name.endsWith(".csv")) {
    showToast("Invalid file format. Please upload a .csv file.", "error");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const parsedRecords = parseCSVText(text);
      
      if (parsedRecords.length === 0) {
        showToast("No valid budget records found in CSV", "error");
        return;
      }

      // Merge or Replace
      appState.entries = parsedRecords;
      saveStateToStorage();
      updateUI();
      showToast(`Successfully imported ${parsedRecords.length} budget entries!`, "success");
      navigateTo("dashboard");
    } catch (err) {
      console.error(err);
      showToast(`CSV Import Error: ${err.message}`, "error");
    }
  };
  reader.readAsText(file);
}

function parseCSVText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV file contains no data rows.");

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").toUpperCase());
  
  // Find column indices
  const idIdx = headers.indexOf("ID");
  const yearIdx = headers.indexOf("YEAR");
  const monthIdx = headers.indexOf("MONTH");
  const typeIdx = headers.indexOf("TYPE");
  const catIdx = headers.indexOf("CATEGORY");
  const amtIdx = headers.indexOf("AMOUNT");
  const notesIdx = headers.indexOf("NOTES");

  if (yearIdx === -1 || monthIdx === -1 || typeIdx === -1 || catIdx === -1 || amtIdx === -1) {
    throw new Error("Missing required CSV headers. Required: Year, Month, Type, Category, Amount");
  }

  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const rawCols = parseCSVLine(lines[i]);
    if (rawCols.length < 5) continue;

    const year = Number(rawCols[yearIdx]) || 2026;
    const month = rawCols[monthIdx]?.trim();
    const type = rawCols[typeIdx]?.trim();
    const category = rawCols[catIdx]?.trim();
    const amount = parseFloat(rawCols[amtIdx]);
    const notes = notesIdx !== -1 && rawCols[notesIdx] ? rawCols[notesIdx].trim() : "";
    const id = idIdx !== -1 && rawCols[idIdx] ? rawCols[idIdx].trim() : String(i);

    // Validation
    if (!month || !type || !category || isNaN(amount) || amount <= 0) {
      console.warn(`Skipping invalid CSV line ${i + 1}:`, lines[i]);
      continue;
    }

    records.push({
      id: id,
      year: year,
      month: month,
      type: type,
      category: category,
      amount: amount,
      notes: notes,
      createdAt: new Date().toISOString()
    });
  }

  return records;
}

// Handles quoted CSV fields with commas
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function handleClearAllData() {
  if (confirm("⚠️ Are you sure you want to delete ALL budget records? This action cannot be undone.")) {
    appState.entries = [];
    saveStateToStorage();
    updateUI();
    showToast("All budget records cleared", "info");
    navigateTo("entry");
  }
}

// 12-Month Realistic Sample Dataset (Matches sample_finverse_budget.csv)
function loadSample12MonthData(showNotification = true) {
  const sampleData = [
    // January
    { id: 1, year: 2026, month: "January", type: "Income", category: "After Tax Salary - Self", amount: 95000, notes: "Regular monthly salary" },
    { id: 2, year: 2026, month: "January", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 3, year: 2026, month: "January", type: "Income", category: "Interest/Dividend income", amount: 3500, notes: "Quarterly interest credited" },
    { id: 4, year: 2026, month: "January", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 5, year: 2026, month: "January", type: "Expense", category: "Grocery", amount: 12500, notes: "Supermarket & pantry supplies" },
    { id: 6, year: 2026, month: "January", type: "Expense", category: "Electricity bills", amount: 2800, notes: "Winter electricity bill" },
    { id: 7, year: 2026, month: "January", type: "Expense", category: "Internet", amount: 1200, notes: "Fiber broadband 200Mbps" },
    { id: 8, year: 2026, month: "January", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid family plan" },
    { id: 9, year: 2026, month: "January", type: "Expense", category: "Petrol/Diesel", amount: 5500, notes: "Vehicle fuel" },
    { id: 10, year: 2026, month: "January", type: "Expense", category: "Medicines", amount: 2100, notes: "Monthly vitamins & prescription" },
    { id: 11, year: 2026, month: "January", type: "Expense", category: "Hotel/Restaurants", amount: 4200, notes: "Weekend family dining" },
    { id: 12, year: 2026, month: "January", type: "Expense", category: "Health Insurance Premium", amount: 14000, notes: "Annual health insurance renewal" },
    { id: 13, year: 2026, month: "January", type: "Investment", category: "Investments towards portfolio", amount: 30000, notes: "Index funds & PPF monthly SIP" },

    // February
    { id: 14, year: 2026, month: "February", type: "Income", category: "After Tax Salary - Self", amount: 95000, notes: "Regular monthly salary" },
    { id: 15, year: 2026, month: "February", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 16, year: 2026, month: "February", type: "Income", category: "After Tax Salary - Spouse", amount: 45000, notes: "Consulting assignment payout" },
    { id: 17, year: 2026, month: "February", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 18, year: 2026, month: "February", type: "Expense", category: "Grocery", amount: 11800, notes: "Monthly grocery shopping" },
    { id: 19, year: 2026, month: "February", type: "Expense", category: "Electricity bills", amount: 2400, notes: "Monthly electricity" },
    { id: 20, year: 2026, month: "February", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 21, year: 2026, month: "February", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 22, year: 2026, month: "February", type: "Expense", category: "Petrol/Diesel", amount: 4800, notes: "Vehicle fuel" },
    { id: 23, year: 2026, month: "February", type: "Expense", category: "Maids wages", amount: 4500, notes: "Monthly domestic help" },
    { id: 24, year: 2026, month: "February", type: "Expense", category: "Hotel/Restaurants", amount: 5200, notes: "Anniversary dinner" },
    { id: 25, year: 2026, month: "February", type: "Expense", category: "TV/OTT", amount: 1499, notes: "Annual OTT bundle subscription" },
    { id: 26, year: 2026, month: "February", type: "Investment", category: "Investments towards portfolio", amount: 45000, notes: "Equity mutual funds SIP & ELSS" },

    // March
    { id: 27, year: 2026, month: "March", type: "Income", category: "After Tax Salary - Self", amount: 95000, notes: "Regular monthly salary" },
    { id: 28, year: 2026, month: "March", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 29, year: 2026, month: "March", type: "Income", category: "Business sale proceed", amount: 50000, notes: "Annual performance bonus" },
    { id: 30, year: 2026, month: "March", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 31, year: 2026, month: "March", type: "Expense", category: "Grocery", amount: 13200, notes: "Household groceries" },
    { id: 32, year: 2026, month: "March", type: "Expense", category: "School fees", amount: 35000, notes: "Annual term 1 school fees" },
    { id: 33, year: 2026, month: "March", type: "Expense", category: "School transport", amount: 6000, notes: "Quarterly school bus fee" },
    { id: 34, year: 2026, month: "March", type: "Expense", category: "Books/newspapers/periodicals", amount: 3500, notes: "School textbooks and stationery" },
    { id: 35, year: 2026, month: "March", type: "Expense", category: "Electricity bills", amount: 3100, notes: "Electricity" },
    { id: 36, year: 2026, month: "March", type: "Expense", category: "Petrol/Diesel", amount: 5200, notes: "Fuel" },
    { id: 37, year: 2026, month: "March", type: "Expense", category: "Life Insurance Premium", amount: 18000, notes: "Term insurance annual premium" },
    { id: 38, year: 2026, month: "March", type: "Investment", category: "Investments towards portfolio", amount: 40000, notes: "Direct equity & Sovereign Gold Bonds" },

    // April
    { id: 39, year: 2026, month: "April", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Annual increment revised salary" },
    { id: 40, year: 2026, month: "April", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 41, year: 2026, month: "April", type: "Income", category: "Interest/Dividend income", amount: 4200, notes: "Dividend from bluechip stocks" },
    { id: 42, year: 2026, month: "April", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 43, year: 2026, month: "April", type: "Expense", category: "Grocery", amount: 12000, notes: "Monthly grocery" },
    { id: 44, year: 2026, month: "April", type: "Expense", category: "Electricity bills", amount: 4200, notes: "Summer AC usage" },
    { id: 45, year: 2026, month: "April", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 46, year: 2026, month: "April", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 47, year: 2026, month: "April", type: "Expense", category: "Petrol/Diesel", amount: 5000, notes: "Fuel" },
    { id: 48, year: 2026, month: "April", type: "Expense", category: "Clothes", amount: 8500, notes: "Summer clothing" },
    { id: 49, year: 2026, month: "April", type: "Expense", category: "Hotel/Restaurants", amount: 3800, notes: "Family dining out" },
    { id: 50, year: 2026, month: "April", type: "Investment", category: "Investments towards portfolio", amount: 35000, notes: "Systematic investment plan" },

    // May (High Expense / Vacation Month)
    { id: 51, year: 2026, month: "May", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 52, year: 2026, month: "May", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 53, year: 2026, month: "May", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 54, year: 2026, month: "May", type: "Expense", category: "Grocery", amount: 12400, notes: "Groceries" },
    { id: 55, year: 2026, month: "May", type: "Expense", category: "Electricity bills", amount: 5400, notes: "Peak summer AC bill" },
    { id: 56, year: 2026, month: "May", type: "Expense", category: "Travel expenses", amount: 58000, notes: "Annual family summer vacation to Himachal" },
    { id: 57, year: 2026, month: "May", type: "Expense", category: "Hotel/Restaurants", amount: 12000, notes: "Vacation food & stays" },
    { id: 58, year: 2026, month: "May", type: "Expense", category: "Petrol/Diesel", amount: 7500, notes: "Road trip fuel & tolls" },
    { id: 59, year: 2026, month: "May", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 60, year: 2026, month: "May", type: "Expense", category: "Miscellaneous", amount: 4500, notes: "Travel gears & accessories" },
    { id: 61, year: 2026, month: "May", type: "Investment", category: "Investments towards portfolio", amount: 10000, notes: "Reduced SIP due to vacation" },

    // June
    { id: 62, year: 2026, month: "June", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 63, year: 2026, month: "June", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 64, year: 2026, month: "June", type: "Income", category: "Asset sale proceed", amount: 22000, notes: "Sale of old home appliances & gadget" },
    { id: 65, year: 2026, month: "June", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 66, year: 2026, month: "June", type: "Expense", category: "Grocery", amount: 11900, notes: "Groceries" },
    { id: 67, year: 2026, month: "June", type: "Expense", category: "Electricity bills", amount: 4800, notes: "Summer electricity" },
    { id: 68, year: 2026, month: "June", type: "Expense", category: "Vehicle maintenance", amount: 8500, notes: "Periodic car service & oil change" },
    { id: 69, year: 2026, month: "June", type: "Expense", category: "Vehicle Insurance Premium", amount: 12500, notes: "Comprehensive car insurance renewal" },
    { id: 70, year: 2026, month: "June", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 71, year: 2026, month: "June", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 72, year: 2026, month: "June", type: "Expense", category: "Petrol/Diesel", amount: 5200, notes: "Fuel" },
    { id: 73, year: 2026, month: "June", type: "Investment", category: "Investments towards portfolio", amount: 32000, notes: "Monthly portfolio SIP" },

    // July
    { id: 74, year: 2026, month: "July", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 75, year: 2026, month: "July", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 76, year: 2026, month: "July", type: "Income", category: "Interest/Dividend income", amount: 2800, notes: "Fixed deposit interest" },
    { id: 77, year: 2026, month: "July", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 78, year: 2026, month: "July", type: "Expense", category: "Grocery", amount: 12200, notes: "Monthly grocery" },
    { id: 79, year: 2026, month: "July", type: "Expense", category: "Electricity bills", amount: 3600, notes: "Monsoon electricity" },
    { id: 80, year: 2026, month: "July", type: "Expense", category: "Home Repair works", amount: 14500, notes: "Monsoon waterproofing & painting" },
    { id: 81, year: 2026, month: "July", type: "Expense", category: "Medicines", amount: 3200, notes: "Seasonal flu care" },
    { id: 82, year: 2026, month: "July", type: "Expense", category: "Petrol/Diesel", amount: 4900, notes: "Fuel" },
    { id: 83, year: 2026, month: "July", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 84, year: 2026, month: "July", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 85, year: 2026, month: "July", type: "Expense", category: "Maids wages", amount: 4500, notes: "Domestic help" },
    { id: 86, year: 2026, month: "July", type: "Investment", category: "Investments towards portfolio", amount: 35000, notes: "Mutual funds SIP" },

    // August
    { id: 87, year: 2026, month: "August", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 88, year: 2026, month: "August", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 89, year: 2026, month: "August", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 90, year: 2026, month: "August", type: "Expense", category: "Grocery", amount: 12800, notes: "Monthly grocery" },
    { id: 91, year: 2026, month: "August", type: "Expense", category: "Electricity bills", amount: 3200, notes: "Electricity" },
    { id: 92, year: 2026, month: "August", type: "Expense", category: "School fees", amount: 22000, notes: "Term 2 school fee installment" },
    { id: 93, year: 2026, month: "August", type: "Expense", category: "Gifts - birthdays, marriages etc", amount: 7500, notes: "Raksha Bandhan gifts" },
    { id: 94, year: 2026, month: "August", type: "Expense", category: "Hotel/Restaurants", amount: 4800, notes: "Dining out" },
    { id: 95, year: 2026, month: "August", type: "Expense", category: "Petrol/Diesel", amount: 5100, notes: "Fuel" },
    { id: 96, year: 2026, month: "August", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 97, year: 2026, month: "August", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 98, year: 2026, month: "August", type: "Investment", category: "Investments towards portfolio", amount: 28000, notes: "Monthly investments" },

    // September
    { id: 99, year: 2026, month: "September", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 100, year: 2026, month: "September", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 101, year: 2026, month: "September", type: "Income", category: "Interest/Dividend income", amount: 5100, notes: "Semi-annual stock dividends" },
    { id: 102, year: 2026, month: "September", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 103, year: 2026, month: "September", type: "Expense", category: "Grocery", amount: 12100, notes: "Grocery" },
    { id: 104, year: 2026, month: "September", type: "Expense", category: "Electricity bills", amount: 2900, notes: "Electricity" },
    { id: 105, year: 2026, month: "September", type: "Expense", category: "Property tax bills", amount: 11000, notes: "Annual municipal property tax" },
    { id: 106, year: 2026, month: "September", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 107, year: 2026, month: "September", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 108, year: 2026, month: "September", type: "Expense", category: "Petrol/Diesel", amount: 4800, notes: "Fuel" },
    { id: 109, year: 2026, month: "September", type: "Expense", category: "Donations", amount: 5000, notes: "Charity & community Ganesh festival" },
    { id: 110, year: 2026, month: "September", type: "Investment", category: "Investments towards portfolio", amount: 42000, notes: "Mutual funds & NPS contribution" },

    // October (Festive Spending Month)
    { id: 111, year: 2026, month: "October", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 112, year: 2026, month: "October", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 113, year: 2026, month: "October", type: "Income", category: "Business sale proceed", amount: 40000, notes: "Diwali festival bonus" },
    { id: 114, year: 2026, month: "October", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 115, year: 2026, month: "October", type: "Expense", category: "Grocery", amount: 15500, notes: "Festive grocery & sweets" },
    { id: 116, year: 2026, month: "October", type: "Expense", category: "Ornaments, jewels", amount: 35000, notes: "Dhanteras gold coin purchase" },
    { id: 117, year: 2026, month: "October", type: "Expense", category: "Clothes", amount: 22000, notes: "Diwali family shopping & ethnic wear" },
    { id: 118, year: 2026, month: "October", type: "Expense", category: "Gifts - birthdays, marriages etc", amount: 12000, notes: "Diwali gifts for family & team" },
    { id: 119, year: 2026, month: "October", type: "Expense", category: "Electronics purchase", amount: 18000, notes: "Smart TV upgrade during festive sale" },
    { id: 120, year: 2026, month: "October", type: "Expense", category: "Electricity bills", amount: 2700, notes: "Electricity" },
    { id: 121, year: 2026, month: "October", type: "Expense", category: "Petrol/Diesel", amount: 5600, notes: "Fuel" },
    { id: 122, year: 2026, month: "October", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 123, year: 2026, month: "October", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 124, year: 2026, month: "October", type: "Investment", category: "Investments towards portfolio", amount: 15000, notes: "Festive month investment" },

    // November
    { id: 125, year: 2026, month: "November", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 126, year: 2026, month: "November", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 127, year: 2026, month: "November", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 128, year: 2026, month: "November", type: "Expense", category: "Grocery", amount: 12300, notes: "Monthly grocery" },
    { id: 129, year: 2026, month: "November", type: "Expense", category: "Electricity bills", amount: 2200, notes: "Pleasant weather electricity" },
    { id: 130, year: 2026, month: "November", type: "Expense", category: "Loan payments - Vehicle", amount: 11500, notes: "Car loan monthly EMI" },
    { id: 131, year: 2026, month: "November", type: "Expense", category: "Movies, theaters, concerts", amount: 3200, notes: "Weekend movie outings" },
    { id: 132, year: 2026, month: "November", type: "Expense", category: "Petrol/Diesel", amount: 4900, notes: "Fuel" },
    { id: 133, year: 2026, month: "November", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 134, year: 2026, month: "November", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 135, year: 2026, month: "November", type: "Expense", category: "Maids wages", amount: 4500, notes: "Domestic help" },
    { id: 136, year: 2026, month: "November", type: "Investment", category: "Investments towards portfolio", amount: 46000, notes: "Aggressive post-festival SIP" },

    // December
    { id: 137, year: 2026, month: "December", type: "Income", category: "After Tax Salary - Self", amount: 98000, notes: "Monthly salary" },
    { id: 138, year: 2026, month: "December", type: "Income", category: "Rental income", amount: 18000, notes: "2BHK apartment rent" },
    { id: 139, year: 2026, month: "December", type: "Income", category: "Interest/Dividend income", amount: 6200, notes: "Year-end interest payouts" },
    { id: 140, year: 2026, month: "December", type: "Expense", category: "Rent payments", amount: 25000, notes: "House rent" },
    { id: 141, year: 2026, month: "December", type: "Expense", category: "Grocery", amount: 13000, notes: "Monthly grocery" },
    { id: 142, year: 2026, month: "December", type: "Expense", category: "Electricity bills", amount: 2100, notes: "Winter electricity" },
    { id: 143, year: 2026, month: "December", type: "Expense", category: "Travel expenses", amount: 28000, notes: "Year-end family getaway" },
    { id: 144, year: 2026, month: "December", type: "Expense", category: "Hotel/Restaurants", amount: 8500, notes: "New Year celebrations & dining" },
    { id: 145, year: 2026, month: "December", type: "Expense", category: "Petrol/Diesel", amount: 5800, notes: "Fuel" },
    { id: 146, year: 2026, month: "December", type: "Expense", category: "Internet", amount: 1200, notes: "Broadband" },
    { id: 147, year: 2026, month: "December", type: "Expense", category: "Mobile", amount: 999, notes: "Postpaid plan" },
    { id: 148, year: 2026, month: "December", type: "Expense", category: "Gifts - birthdays, marriages etc", amount: 6500, notes: "Christmas & New year gifts" },
    { id: 149, year: 2026, month: "December", type: "Investment", category: "Investments towards portfolio", amount: 25000, notes: "Year-end investment" }
  ];

  appState.entries = sampleData;
  saveStateToStorage();
  updateUI();
  if (showNotification) {
    showToast("149 realistic budget records loaded across Jan–Dec!", "success");
    navigateTo("dashboard");
  }
}

// ==========================================================================
// 15. AUTOMATED TEST SUITE (Verifies Test Cases 1, 2, 3)
// ==========================================================================

function runCalculationTests() {
  // Test Case 1: Income = 100,000, Expenses = 60,000
  const tc1Entries = [
    { type: "Income", amount: 100000, category: "Salary" },
    { type: "Expense", amount: 60000, category: "Living" }
  ];
  const tc1Res = calculateFinancialMetrics(tc1Entries);
  const tc1Pass = tc1Res.subTotalIncome === 100000 &&
                  tc1Res.subTotalExpenses === 60000 &&
                  tc1Res.investableSurplus === 40000 &&
                  tc1Res.expensePercentage === 60.0 &&
                  tc1Res.savingsRate === 40.0;

  const card1 = document.getElementById("test-card-1");
  const res1 = document.getElementById("test-res-1");
  if (card1 && res1) {
    card1.className = `test-item ${tc1Pass ? 'passed' : 'failed'}`;
    res1.innerHTML = tc1Pass 
      ? `✓ Passed: Total Income = ₹100,000, Expenses = ₹60,000, Exp % = ${tc1Res.expensePercentage}%, Surplus = ${formatINR(tc1Res.investableSurplus)}, Savings Rate = ${tc1Res.savingsRate}%`
      : `✗ Failed calculation validation.`;
  }

  // Test Case 2: Income = 50,000, Expenses = 55,000
  const tc2Entries = [
    { type: "Income", amount: 50000, category: "Salary" },
    { type: "Expense", amount: 55000, category: "Living" }
  ];
  const tc2Res = calculateFinancialMetrics(tc2Entries);
  const tc2Pass = tc2Res.investableSurplus === -5000 && tc2Res.isDeficit === true;

  const card2 = document.getElementById("test-card-2");
  const res2 = document.getElementById("test-res-2");
  if (card2 && res2) {
    card2.className = `test-item ${tc2Pass ? 'passed' : 'failed'}`;
    res2.innerHTML = tc2Pass 
      ? `✓ Passed: Investable Surplus = ${formatINR(tc2Res.investableSurplus)} (-₹5,000 deficit), Deficit Warning triggered.`
      : `✗ Failed deficit validation.`;
  }

  // Test Case 3: Income = 0, Expenses = 10,000
  const tc3Entries = [
    { type: "Income", amount: 0, category: "Salary" },
    { type: "Expense", amount: 10000, category: "Living" }
  ];
  const tc3Res = calculateFinancialMetrics(tc3Entries);
  const tc3Pass = tc3Res.expensePercentage === null && tc3Res.savingsRate === null && tc3Res.investableSurplus === -10000;

  const card3 = document.getElementById("test-card-3");
  const res3 = document.getElementById("test-res-3");
  if (card3 && res3) {
    card3.className = `test-item ${tc3Pass ? 'passed' : 'failed'}`;
    res3.innerHTML = tc3Pass 
      ? `✓ Passed: Exp % = N/A, Savings Rate = N/A (Division by zero safely handled with no errors/NaN).`
      : `✗ Failed zero income validation.`;
  }

  console.log("FinVerse Test Cases Execution:", { tc1Pass, tc2Pass, tc3Pass });
}

// ==========================================================================
// 16. TOAST NOTIFICATIONS
// ==========================================================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠️",
    info: "ℹ️"
  };

  toast.innerHTML = `<span>${icons[type] || "•"}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================================================
// 17. BULK TRANSACTION ENTRY, PARSER, VALIDATION & IMPORT ENGINE
// ==========================================================================

let bulkState = {
  rawText: "",
  parsedRows: [],
  activeFilter: "all",
  activeSource: "paste"
};

function initBulkTransactionModule() {
  // Source Tab Switchers (Paste vs Upload)
  const btnSourcePaste = document.getElementById("btn-source-paste");
  const btnSourceUpload = document.getElementById("btn-source-upload");
  const panelPaste = document.getElementById("panel-bulk-paste");
  const panelUpload = document.getElementById("panel-bulk-upload");

  if (btnSourcePaste && btnSourceUpload && panelPaste && panelUpload) {
    btnSourcePaste.addEventListener("click", () => {
      btnSourcePaste.classList.add("active");
      btnSourceUpload.classList.remove("active");
      panelPaste.style.display = "block";
      panelUpload.style.display = "none";
      bulkState.activeSource = "paste";
    });

    btnSourceUpload.addEventListener("click", () => {
      btnSourceUpload.classList.add("active");
      btnSourcePaste.classList.remove("active");
      panelUpload.style.display = "block";
      panelPaste.style.display = "none";
      bulkState.activeSource = "upload";
    });
  }

  // Load 20 Sample Paste Rows
  const btnLoadSamplePaste = document.getElementById("btn-load-sample-paste");
  if (btnLoadSamplePaste) {
    btnLoadSamplePaste.addEventListener("click", () => {
      const sampleBatch = `Date,Description,Category,Type,Amount,Payment Method,Account,Notes
2026-09-01,Monthly Salary,After Tax Salary - Self,Income,85000,Bank Transfer,HDFC Bank,September corporate salary
2026-09-02,House Rent,Rent payments,Expense,25000,UPI,HDFC Bank,Monthly apartment rent
2026-09-03,Supermarket Grocery,Grocery,Expense,8500,UPI,HDFC Bank,Monthly provisions & pantry
2026-09-04,Equity Mutual Fund SIP,Investments towards portfolio,Investment,25000,Auto-Debit,Zerodha,Monthly index fund SIP
2026-09-05,Electricity Bill,Electricity bills,Expense,2800,NetBanking,SBI,Power bill payment
2026-09-06,Fiber Broadband,Internet,Expense,1200,UPI,HDFC Bank,Airtel Xstream broadband
2026-09-07,Freelance Consulting,Business sale proceed,Income,22000,Bank Transfer,ICICI Bank,Financial modeling assignment
2026-09-08,Vehicle Fuel,Petrol/Diesel,Expense,4500,Credit Card,HDFC Bank,Monthly petrol
2026-09-09,Family Dinner,Hotel/Restaurants,Expense,3800,Credit Card,HDFC Bank,Weekend dinner
2026-09-10,Health Supplements,Medicines,Expense,1800,UPI,HDFC Bank,Vitamins & prescription
2026-09-12,Domestic Help,Maids wages,Expense,4500,Cash,Cash,Monthly housemaid salary
2026-09-14,OTT Subscriptions,TV/OTT,Expense,1499,Credit Card,ICICI Bank,Annual OTT bundle
2026-09-15,Fixed Deposit Interest,Interest/Dividend income,Income,3200,Bank Transfer,SBI,Quarterly FD interest credited
2026-09-17,Mobile Recharge,Mobile,Expense,999,UPI,HDFC Bank,Quarterly postpaid plan
2026-09-19,Vehicle Service,Vehicle maintenance,Expense,5200,Debit Card,ICICI Bank,Periodic car servicing
2026-09-21,PPF Monthly Contribution,Investments towards portfolio,Investment,10000,NetBanking,SBI,Public Provident Fund SIP
2026-09-23,School Tuition,Tuition fees,Expense,6500,UPI,HDFC Bank,Maths & science tutoring
2026-09-25,Charity & Donation,Donations,Expense,2000,UPI,HDFC Bank,Community relief fund
2026-09-28,Books & Periodicals,Books/newspapers/periodicals,Expense,1400,UPI,HDFC Bank,Finance books & Harvard Business Review
2026-09-30,Rental Income,Rental income,Income,18000,Bank Transfer,HDFC Bank,September 2BHK rental income`;

      document.getElementById("bulk-paste-text").value = sampleBatch;
      showToast("20 sample transactions loaded into paste area!", "success");
    });
  }

  // Clear Bulk Textarea
  const btnClearBulkText = document.getElementById("btn-clear-bulk-text");
  if (btnClearBulkText) {
    btnClearBulkText.addEventListener("click", () => {
      document.getElementById("bulk-paste-text").value = "";
      showToast("Paste box cleared", "info");
    });
  }

  // Drag and drop for Bulk Upload
  const bulkDropZone = document.getElementById("bulk-drop-zone");
  const bulkFileInput = document.getElementById("bulk-file-input");
  const bulkFileInfo = document.getElementById("bulk-file-info");

  if (bulkDropZone && bulkFileInput) {
    bulkDropZone.addEventListener("click", () => bulkFileInput.click());

    bulkDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      bulkDropZone.style.borderColor = "#10b981";
      bulkDropZone.style.backgroundColor = "rgba(16, 185, 129, 0.05)";
    });

    bulkDropZone.addEventListener("dragleave", () => {
      bulkDropZone.style.borderColor = "var(--border-color)";
      bulkDropZone.style.backgroundColor = "var(--bg-card-alt)";
    });

    bulkDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      bulkDropZone.style.borderColor = "var(--border-color)";
      bulkDropZone.style.backgroundColor = "var(--bg-card-alt)";
      if (e.dataTransfer.files.length > 0) {
        handleBulkFileUpload(e.dataTransfer.files[0]);
      }
    });

    bulkFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleBulkFileUpload(e.target.files[0]);
        bulkFileInput.value = "";
      }
    });
  }

  // Parse & Validate Button
  const btnParse = document.getElementById("btn-parse-bulk-data");
  if (btnParse) {
    btnParse.addEventListener("click", handleParseBulkData);
  }

  // Back to Input Button
  const btnBack = document.getElementById("btn-back-to-input");
  if (btnBack) {
    btnBack.addEventListener("click", () => {
      document.getElementById("bulk-input-step").style.display = "block";
      document.getElementById("bulk-preview-step").style.display = "none";
    });
  }

  // Filter Pills in Preview
  document.querySelectorAll(".filter-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      bulkState.activeFilter = btn.dataset.filter;
      renderBulkPreviewRows();
    });
  });

  // Discard Invalid Rows Button
  const btnRemoveInvalid = document.getElementById("btn-remove-invalid-rows");
  if (btnRemoveInvalid) {
    btnRemoveInvalid.addEventListener("click", () => {
      const invalidCount = bulkState.parsedRows.filter(r => !r.isValid).length;
      if (invalidCount === 0) {
        showToast("No invalid rows to discard!", "info");
        return;
      }
      bulkState.parsedRows = bulkState.parsedRows.filter(r => r.isValid);
      updateBulkSummaryCounts();
      renderBulkPreviewRows();
      showToast(`Discarded ${invalidCount} invalid row(s).`, "info");
    });
  }

  // Confirm Import Button
  const btnConfirmImport = document.getElementById("btn-confirm-import-bulk");
  if (btnConfirmImport) {
    btnConfirmImport.addEventListener("click", executeBulkImport);
  }

  // Download Bulk CSV Template
  const btnDownloadTemplate = document.getElementById("btn-bulk-download-template");
  if (btnDownloadTemplate) {
    btnDownloadTemplate.addEventListener("click", downloadBulkTemplateCSV);
  }
}

function handleBulkFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("bulk-paste-text").value = e.target.result;
    const fileInfo = document.getElementById("bulk-file-info");
    if (fileInfo) {
      fileInfo.style.display = "block";
      document.getElementById("bulk-file-name").textContent = file.name;
      document.getElementById("bulk-file-size").textContent = `${(file.size / 1024).toFixed(1)} KB`;
    }
    showToast(`File "${file.name}" loaded ready for validation!`, "success");
    // Switch to paste panel to show loaded rows
    document.getElementById("btn-source-paste").click();
  };
  reader.readAsText(file);
}

function downloadBulkTemplateCSV() {
  const templateContent = `Date,Description,Category,Type,Amount,Payment Method,Account,Notes
2026-09-01,Monthly Salary,After Tax Salary - Self,Income,75000,Bank Transfer,HDFC Bank,Salary for September
2026-09-02,House Rent,Rent payments,Expense,25000,UPI,HDFC Bank,September apartment rent
2026-09-03,Supermarket Grocery,Grocery,Expense,4200,Debit Card,ICICI Bank,Weekly groceries
2026-09-04,Mutual Fund SIP,Investments towards portfolio,Investment,15000,Auto-Debit,Zerodha,Index Fund SIP
2026-09-05,Electricity Bill,Electricity bills,Expense,2100,NetBanking,SBI,Power bill payment`;

  triggerDownload(templateContent, "E_Khata_Bulk_Transactions_Template.csv", "text/csv;charset=utf-8;");
  showToast("E-Khata CSV Template downloaded!", "success");
}

function handleParseBulkData() {
  const text = (document.getElementById("bulk-paste-text").value || "").trim();
  if (!text) {
    showToast("Please enter or paste transaction rows first.", "warning");
    return;
  }

  const parsed = parseBulkTransactions(text);
  if (parsed.length === 0) {
    showToast("Could not parse any transaction rows from input.", "error");
    return;
  }

  bulkState.parsedRows = parsed;
  bulkState.activeFilter = "all";

  // Switch views
  document.getElementById("bulk-input-step").style.display = "none";
  document.getElementById("bulk-preview-step").style.display = "block";

  // Reset filter pills
  document.querySelectorAll(".filter-pill-btn").forEach(b => b.classList.remove("active"));
  const allPill = document.getElementById("pill-filter-all");
  if (allPill) allPill.classList.add("active");

  updateBulkSummaryCounts();
  renderBulkPreviewRows();
}

/**
 * Intelligent Delimiter & Column Schema Parser
 * Supports:
 * Format A: Date, Description, Category, Type, Amount, Payment Method, Account, Notes
 * Format B (FinVerse Template): ID, Year, Month, Type, Category, Amount, Notes
 */
function parseBulkTransactions(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  // Determine delimiter (comma, tab, semicolon, pipe)
  const firstLine = lines[0];
  const delimiter = detectDelimiter(firstLine);

  let startIndex = 0;
  let headerMap = null;

  // Check if first row is a header
  const firstCols = splitLineWithQuotes(firstLine, delimiter).map(c => c.trim().toLowerCase().replace(/^["']|["']$/g, ""));
  const headerCheck = firstCols.some(c => ["date", "category", "amount", "type", "description", "month"].includes(c));

  if (headerCheck) {
    startIndex = 1;
    headerMap = {};
    firstCols.forEach((col, idx) => {
      if (col.includes("date")) headerMap.date = idx;
      else if (col.includes("year")) headerMap.year = idx;
      else if (col.includes("month")) headerMap.month = idx;
      else if (col.includes("desc")) headerMap.description = idx;
      else if (col.includes("cat")) headerMap.category = idx;
      else if (col.includes("type")) headerMap.type = idx;
      else if (col.includes("amount") || col.includes("amt")) headerMap.amount = idx;
      else if (col.includes("payment") || col.includes("method")) headerMap.paymentMethod = idx;
      else if (col.includes("account") || col.includes("bank")) headerMap.account = idx;
      else if (col.includes("note")) headerMap.notes = idx;
      else if (col.includes("id")) headerMap.id = idx;
    });
  }

  const results = [];
  const seenSignatures = new Set();

  for (let i = startIndex; i < lines.length; i++) {
    const rawCols = splitLineWithQuotes(lines[i], delimiter);
    if (rawCols.length < 3) continue;

    let dateStr = "";
    let desc = "";
    let cat = "";
    let type = "Expense";
    let amountStr = "";
    let paymentMethod = "";
    let account = "";
    let notes = "";
    let year = appState.selectedYear;
    let month = appState.selectedMonth !== "ALL" ? appState.selectedMonth : "January";

    if (headerMap) {
      if (headerMap.date !== undefined && rawCols[headerMap.date]) dateStr = rawCols[headerMap.date];
      if (headerMap.year !== undefined && rawCols[headerMap.year]) year = Number(rawCols[headerMap.year]) || year;
      if (headerMap.month !== undefined && rawCols[headerMap.month]) month = rawCols[headerMap.month];
      if (headerMap.description !== undefined && rawCols[headerMap.description]) desc = rawCols[headerMap.description];
      if (headerMap.category !== undefined && rawCols[headerMap.category]) cat = rawCols[headerMap.category];
      if (headerMap.type !== undefined && rawCols[headerMap.type]) type = rawCols[headerMap.type];
      if (headerMap.amount !== undefined && rawCols[headerMap.amount]) amountStr = rawCols[headerMap.amount];
      if (headerMap.paymentMethod !== undefined && rawCols[headerMap.paymentMethod]) paymentMethod = rawCols[headerMap.paymentMethod];
      if (headerMap.account !== undefined && rawCols[headerMap.account]) account = rawCols[headerMap.account];
      if (headerMap.notes !== undefined && rawCols[headerMap.notes]) notes = rawCols[headerMap.notes];
    } else {
      // Default Order: Date, Description, Category, Type, Amount, Payment Method, Account, Notes
      dateStr = rawCols[0] || "";
      desc = rawCols[1] || "";
      cat = rawCols[2] || "";
      type = rawCols[3] || "Expense";
      amountStr = rawCols[4] || "";
      paymentMethod = rawCols[5] || "";
      account = rawCols[6] || "";
      notes = rawCols[7] || "";
    }

    // Clean up text
    dateStr = dateStr.replace(/^["']|["']$/g, "").trim();
    desc = desc.replace(/^["']|["']$/g, "").trim();
    cat = cat.replace(/^["']|["']$/g, "").trim();
    type = type.replace(/^["']|["']$/g, "").trim();
    amountStr = amountStr.replace(/^["']|["']$/g, "").replace(/[₹$,]/g, "").trim();
    paymentMethod = paymentMethod.replace(/^["']|["']$/g, "").trim();
    account = account.replace(/^["']|["']$/g, "").trim();
    notes = notes.replace(/^["']|["']$/g, "").trim();

    // Date / Month Normalization
    const dateParsed = parseDateAndExtractMonthYear(dateStr, year, month);
    const amountVal = parseFloat(amountStr);

    // Validation checks
    const errors = [];
    if (!dateParsed.isValid) {
      errors.push(`Invalid Date "${dateStr}". Use YYYY-MM-DD or Month name.`);
    }

    // Normalize Type
    let normalizedType = "Expense";
    const typeLower = type.toLowerCase();
    if (typeLower.includes("inc")) {
      normalizedType = "Income";
    } else if (typeLower.includes("exp")) {
      normalizedType = "Expense";
    } else if (typeLower.includes("inv")) {
      normalizedType = "Investment";
    } else {
      errors.push(`Invalid Type "${type}". Must be Income, Expense, or Investment.`);
    }

    if (!cat) {
      errors.push("Category cannot be blank.");
    }

    if (isNaN(amountVal) || amountVal <= 0) {
      errors.push("Amount must be a numeric value greater than 0.");
    }

    // Duplicate detection signature
    const signature = `${dateParsed.year}|${dateParsed.month}|${normalizedType}|${cat.toLowerCase()}|${amountVal}`;
    const existsInDb = appState.entries.some(e => 
      Number(e.year) === dateParsed.year &&
      e.month === dateParsed.month &&
      e.type === normalizedType &&
      e.category.toLowerCase() === cat.toLowerCase() &&
      Number(e.amount) === amountVal
    );
    const isDuplicate = existsInDb || seenSignatures.has(signature);
    seenSignatures.add(signature);

    // Check if new category
    const allKnownCats = getAllCategoriesForType(normalizedType);
    const isNewCategory = !allKnownCats.some(c => c.toLowerCase() === cat.toLowerCase());

    results.push({
      batchId: i,
      rawIndex: i + 1,
      date: dateParsed.formattedDate || dateStr,
      year: dateParsed.year,
      month: dateParsed.month,
      type: normalizedType,
      category: cat,
      amount: isNaN(amountVal) ? 0 : amountVal,
      description: desc || notes || cat,
      paymentMethod: paymentMethod || "Standard",
      account: account || "Main Account",
      notes: notes || desc || `${dateParsed.month} ${normalizedType}`,
      isValid: errors.length === 0,
      isDuplicate: isDuplicate,
      isNewCategory: isNewCategory,
      errors: errors
    });
  }

  return results;
}

function detectDelimiter(line) {
  if (line.includes("\t")) return "\t";
  if (line.includes(",")) return ",";
  if (line.includes(";")) return ";";
  if (line.includes("|")) return "|";
  return ",";
}

function splitLineWithQuotes(line, delimiter) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseDateAndExtractMonthYear(dateStr, fallbackYear, fallbackMonth) {
  if (!dateStr) {
    return { isValid: true, year: fallbackYear, month: fallbackMonth, formattedDate: `${fallbackYear}-${fallbackMonth}-01` };
  }

  // Check if string is already a month name (e.g. "January", "Sept")
  const matchedMonth = MONTHS.find(m => m.toLowerCase().startsWith(dateStr.toLowerCase().slice(0, 3)));
  if (matchedMonth) {
    return { isValid: true, year: fallbackYear, month: matchedMonth, formattedDate: `${fallbackYear}-${matchedMonth}` };
  }

  // Check ISO format YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
  let y = fallbackYear;
  let mIndex = -1;
  let d = 1;

  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(dateStr)) {
    // YYYY-MM-DD
    const parts = dateStr.split(/[-/.]/);
    y = parseInt(parts[0], 10);
    mIndex = parseInt(parts[1], 10) - 1;
    d = parseInt(parts[2], 10);
  } else if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(dateStr)) {
    // DD/MM/YYYY
    const parts = dateStr.split(/[-/.]/);
    d = parseInt(parts[0], 10);
    mIndex = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  } else {
    // Try standard JS Date constructor
    const parsedObj = new Date(dateStr);
    if (!isNaN(parsedObj.getTime())) {
      y = parsedObj.getFullYear();
      mIndex = parsedObj.getMonth();
      d = parsedObj.getDate();
    }
  }

  if (mIndex >= 0 && mIndex < 12 && y >= 2000 && y <= 2100) {
    const monthName = MONTHS[mIndex];
    const paddedMonth = String(mIndex + 1).padStart(2, "0");
    const paddedDay = String(d).padStart(2, "0");
    return {
      isValid: true,
      year: y,
      month: monthName,
      formattedDate: `${y}-${paddedMonth}-${paddedDay}`
    };
  }

  return { isValid: false, year: fallbackYear, month: fallbackMonth, formattedDate: dateStr };
}

function updateBulkSummaryCounts() {
  const total = bulkState.parsedRows.length;
  const valid = bulkState.parsedRows.filter(r => r.isValid).length;
  const errors = bulkState.parsedRows.filter(r => !r.isValid).length;
  const duplicates = bulkState.parsedRows.filter(r => r.isDuplicate).length;

  document.getElementById("val-count-total").textContent = total;
  document.getElementById("val-count-valid").textContent = valid;
  document.getElementById("val-count-errors").textContent = errors;
  document.getElementById("val-count-duplicates").textContent = duplicates;

  document.getElementById("pill-all-cnt").textContent = total;
  document.getElementById("pill-valid-cnt").textContent = valid;
  document.getElementById("pill-error-cnt").textContent = errors;
  document.getElementById("pill-dup-cnt").textContent = duplicates;

  const btnConfirm = document.getElementById("btn-confirm-import-bulk");
  if (btnConfirm) {
    btnConfirm.textContent = `📥 Import ${valid} Valid Transactions`;
    btnConfirm.disabled = (valid === 0);
  }
}

function renderBulkPreviewRows() {
  const tbody = document.getElementById("tbody-bulk-preview");
  if (!tbody) return;

  const filter = bulkState.activeFilter;
  const filtered = bulkState.parsedRows.filter(r => {
    if (filter === "valid") return r.isValid;
    if (filter === "error") return !r.isValid;
    if (filter === "duplicate") return r.isDuplicate;
    return true; // 'all'
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; padding: 24px; color: var(--text-muted);">No records match filter "${filter}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((row) => {
    const rowClass = !row.isValid ? "row-error" : row.isDuplicate ? "row-duplicate" : "row-valid";
    const statusTag = !row.isValid 
      ? `<span class="status-tag status-tag-error">❌ Error</span>`
      : row.isDuplicate 
        ? `<span class="status-tag status-tag-duplicate">⚠️ Duplicate</span>`
        : `<span class="status-tag status-tag-valid">✓ Valid</span>`;

    const errorNotes = row.errors.length > 0 
      ? `<span style="color: #b91c1c; font-weight: 600; font-size: 0.75rem;">${row.errors.join("; ")}</span>`
      : row.isNewCategory 
        ? `<span style="color: #047857; font-size: 0.75rem;">➕ New Category (${row.category})</span>`
        : `<span style="color: var(--text-muted); font-size: 0.75rem;">Ready to import</span>`;

    return `
      <tr class="${rowClass}">
        <td><strong>${row.rawIndex}</strong></td>
        <td>${statusTag}</td>
        <td>
          <input type="text" class="preview-input-cell ${!row.isValid && row.errors.some(e => e.includes('Date')) ? 'has-error' : ''}" 
                 value="${row.date}" onchange="updateBulkRowField(${row.batchId}, 'date', this.value)">
        </td>
        <td>
          <select class="preview-input-cell" onchange="updateBulkRowField(${row.batchId}, 'type', this.value)">
            <option value="Income" ${row.type === 'Income' ? 'selected' : ''}>Income</option>
            <option value="Expense" ${row.type === 'Expense' ? 'selected' : ''}>Expense</option>
            <option value="Investment" ${row.type === 'Investment' ? 'selected' : ''}>Investment</option>
          </select>
        </td>
        <td>
          <input type="text" class="preview-input-cell ${!row.isValid && row.errors.some(e => e.includes('Category')) ? 'has-error' : ''}" 
                 value="${row.category}" onchange="updateBulkRowField(${row.batchId}, 'category', this.value)">
        </td>
        <td style="text-align: right;">
          <input type="number" step="any" class="preview-input-cell ${!row.isValid && row.errors.some(e => e.includes('Amount')) ? 'has-error' : ''}" 
                 style="text-align: right; font-weight: 700;" value="${row.amount}" onchange="updateBulkRowField(${row.batchId}, 'amount', this.value)">
        </td>
        <td>
          <input type="text" class="preview-input-cell" value="${row.notes || row.description}" 
                 onchange="updateBulkRowField(${row.batchId}, 'notes', this.value)">
        </td>
        <td>
          <input type="text" class="preview-input-cell" value="${row.account || row.paymentMethod}" 
                 onchange="updateBulkRowField(${row.batchId}, 'account', this.value)">
        </td>
        <td>${errorNotes}</td>
        <td style="text-align: center;">
          <button type="button" class="btn btn-danger btn-sm" style="padding: 2px 6px; font-size: 0.72rem;" onclick="deleteBulkPreviewRow(${row.batchId})" title="Remove row">✕</button>
        </td>
      </tr>
    `;
  }).join("");
}

// Live Inline Correction in Preview Table
window.updateBulkRowField = function(batchId, field, value) {
  const row = bulkState.parsedRows.find(r => r.batchId === batchId);
  if (!row) return;

  if (field === "amount") {
    row.amount = parseFloat(value) || 0;
  } else if (field === "date") {
    row.date = value;
    const parsed = parseDateAndExtractMonthYear(value, row.year, row.month);
    row.year = parsed.year;
    row.month = parsed.month;
  } else if (field === "category") {
    row.category = value.trim();
  } else if (field === "type") {
    row.type = value;
  } else if (field === "notes") {
    row.notes = value;
  } else if (field === "account") {
    row.account = value;
  }

  // Revalidate row
  const errors = [];
  if (!row.category) errors.push("Category cannot be blank.");
  if (isNaN(row.amount) || row.amount <= 0) errors.push("Amount must be > 0.");
  
  row.errors = errors;
  row.isValid = errors.length === 0;

  updateBulkSummaryCounts();
  renderBulkPreviewRows();
};

window.deleteBulkPreviewRow = function(batchId) {
  bulkState.parsedRows = bulkState.parsedRows.filter(r => r.batchId !== batchId);
  updateBulkSummaryCounts();
  renderBulkPreviewRows();
  showToast("Row removed from preview", "info");
};

function executeBulkImport() {
  const autoCats = document.getElementById("chk-auto-custom-cats")?.checked ?? true;
  const skipDuplicates = document.getElementById("chk-skip-duplicates")?.checked ?? true;

  let validRows = bulkState.parsedRows.filter(r => r.isValid);
  if (skipDuplicates) {
    validRows = validRows.filter(r => !r.isDuplicate);
  }

  if (validRows.length === 0) {
    showToast("No valid rows available to import.", "warning");
    return;
  }

  let nextId = generateNextId();
  const newTransactions = [];

  validRows.forEach(row => {
    // Auto register category if new
    if (autoCats && row.category) {
      const known = getAllCategoriesForType(row.type);
      if (!known.some(c => c.toLowerCase() === row.category.toLowerCase())) {
        if (!appState.customCategories[row.type]) {
          appState.customCategories[row.type] = [];
        }
        appState.customCategories[row.type].push(row.category);
      }
    }

    newTransactions.push({
      id: nextId++,
      year: row.year || appState.selectedYear,
      month: row.month || "September",
      type: row.type,
      category: row.category,
      amount: row.amount,
      notes: row.notes || row.description || `${row.month} ${row.type}`,
      date: row.date || null,
      paymentMethod: row.paymentMethod || null,
      account: row.account || null,
      createdAt: new Date().toISOString()
    });
  });

  // Append new transactions to state
  appState.entries = [...newTransactions, ...appState.entries];
  saveStateToStorage();

  // Reset bulk state
  bulkState.parsedRows = [];
  document.getElementById("bulk-paste-text").value = "";
  document.getElementById("bulk-input-step").style.display = "block";
  document.getElementById("bulk-preview-step").style.display = "none";

  // Refresh all dashboard metrics, charts, transactions, matrix
  updateUI();
  populateCategorySelects();

  showToast(`${validRows.length} transactions imported successfully.`, "success");
  navigateTo("transactions");
}

