# E-Khata — Personal Budget & Wealth Management

> **"Understand your money. Plan your future."**  
> *Developed for the FinVerse Finance Club of IIEBM Personal Budget Application Challenge (Round 2)*

---

## 🌟 1. Overview

**E-Khata** is a modern, responsive, full-stack client-side personal budget and wealth management web application built to replicate and elevate the financial structure, formula logic, and reporting workflows of the **FinVerse Standalone Budget Template** (`FinVerse_Event_Budget_template_090926.xlsx`) and the **Student Guide** (`Budget_App_Student_Guide.docx`).

The application enables users to manage full 12-month personal budgets (January–December), categorize inflows, outflows, and portfolio investments, visualize key performance indicators, generate automated data-driven written insights, import/export structured CSVs, and examine the complete annual budget matrix.

---

## 🚀 2. How to Run the Application

The application is completely self-contained with **zero complex dependencies** or build steps required.

### Method 1: Direct Browser Launch (Recommended)
1. Navigate to the project directory: `C:\Users\Friend\Downloads\project\`
2. Double-click **`index.html`** or right-click and open with **Google Chrome**, **Microsoft Edge**, **Mozilla Firefox**, or **Brave**.
3. The application will load immediately with the pre-seeded **12-Month Realistic Sample Dataset (149 records)** and full dynamic visualizations.

### Method 2: Local Web Server (Optional)
If you prefer running via a local HTTP server:
```powershell
# Using Python (if available):
python -m http.server 8000

# Using PowerShell (or VS Code Live Server extension):
# Open index.html with Live Server on http://localhost:5500
```

---

## 📊 3. Key Financial Logic & Formulas

The application strictly enforces the mathematical models defined in Sheet 2 of the FinVerse Budget Template:

| Metric | Mathematical Formula | Handling Zero Income ($Income = 0$) |
| :--- | :--- | :--- |
| **Sub Total Income** | $$\text{Total Income} = \sum (\text{all Income amounts})$$ | Displays `₹0` |
| **Sub Total Expenses** | $$\text{Total Expenses} = \sum (\text{all Expense amounts})$$ | Displays calculated sum |
| **Expenses as % of Income** | $$\left(\frac{\text{Total Expenses}}{\text{Total Income}}\right) \times 100$$ | Safely displays `N/A` (Division-by-zero protected) |
| **Investable Surplus (Savings)** | $$\text{Investable Surplus} = \text{Total Income} - \text{Total Expenses}$$ | Negative if expenses exceed income (triggers deficit warning banner) |
| **Savings Rate** | $$\left(\frac{\text{Investable Surplus}}{\text{Total Income}}\right) \times 100$$ | Safely displays `N/A` |
| **Investments towards Portfolio** | $$\text{Total Investments} = \sum (\text{all Investment amounts})$$ | Displays calculated sum |
| **Investments as % of Income** | $$\left(\frac{\text{Total Investments}}{\text{Total Income}}\right) \times 100$$ | Safely displays `N/A` |
| **Uninvested Savings** | $$\text{Uninvested Savings} = \text{Investable Surplus} - \text{Investments}$$ | Displays liquid cash buffer remaining |

*Currency Formatting:* All figures follow the **Indian Rupee (INR)** numbering system (e.g. `₹1,00,000`, `₹15,000`, `-₹5,000`).

---

## 🎨 4. Core Features & Navigation Sections

### 1. 📊 Interactive Dashboard
- **6 KPI Metric Cards**: Sub Total Income, Sub Total Expenses, Expenses as % of Income, Investable Surplus, Savings Rate, Investments & Uninvested Savings.
- **Deficit Warning Banner**: Automatically alerts the user when monthly expenses exceed income (`"⚠️ Expenses exceed income for this month."`).
- **Dynamic Written Insights Engine**: Factual, data-driven narrative lines evaluating top spending drivers, peak savings months, deficit periods, and savings rate momentum.
- **6 Chart.js Visualizations**:
  1. *Income vs Expenses Trend (Combo Bar + Net Surplus Line)* across Jan–Dec.
  2. *Expense Category Breakdown (Interactive Donut)* with percentage shares.
  3. *Savings Rate Over Time (Line Chart)* with 30% financial health target benchmark.
  4. *Top 5 Expense Categories (Horizontal Bar)* identifying biggest annual cost centers.
  5. *Surplus Allocation (Stacked Bar)* showing Portfolio Investments vs Cash Savings.
  6. *Expenses as % of Income vs 100% Boundary* to immediately spot overspending months.

### 2. ✍️ Budget Entry Form & ⚡ Bulk Add Transactions
- **Dual Mode Interface**:
  - `[ ✍️ Single Transaction ]`: Standard manual form with live calculation preview and custom category modal.
  - `[ ⚡ Bulk Add Transactions ]`: High-speed batch entry supporting **500–1,000+ transactions at once**.
- **Two Bulk Input Methods**:
  - **Upload CSV/Excel**: Drag-and-drop or select structured CSV files.
  - **Paste Multiple Transactions**: Paste raw rows directly from Excel or Google Sheets (comma, tab, or semicolon delimited).
- **Validation Before Import (Live Preview Table)**:
  - Real-time counters: Total Rows, Valid Rows, Errors Found, Duplicates.
  - Interactive validation filters (`All`, `Valid Only`, `Errors Only`, `Duplicates`).
  - Inline error editing: Correct invalid fields directly within the preview table.
  - Auto-detection of new categories with auto-registration option.
  - Duplicate detection to prevent duplicate entries.
- **Import Confirmation & Immediate Synchronization**:
  - Displays `"97 transactions imported successfully."`
  - Instantly refreshes Total Income, Total Expenses, Surplus/Balance, Category Breakdown, Charts, Ledger, and 12-Month Matrix.

### 3. 📋 Transactions Ledger
- Searchable and filterable table by month, category, notes, and transaction type.
- Displays metadata: Date, Category, Amount, Description, and Account/Payment Method tags.
- Full CRUD operations: Inline **Edit** (with modal prefill) and **Delete** with confirmation.
- **Export Filtered CSV** for targeted analysis.

### 4. 📑 Budget Matrix (Excel Sheet 2 Standalone Replica)
- High-fidelity 12-month matrix view (`Jan` through `Dec` + `Yearly Total` column) replicating the exact layout of the FinVerse Excel template.
- Categorized rows for **Income Heads**, **Sub Total Income**, **Expense Heads**, **Sub Total Expenses**, **Expenses as % of Income**, **Investable Surplus**, **Savings Rate**, **Investments**, and **Uninvested Savings**.
- Single-click **Export Matrix CSV** and **Print/PDF** layout.

### 5. 📈 Deep Financial Analytics
- **Cumulative Surplus & Wealth Velocity Chart**: Multi-month net accumulated savings curve.
- **Category Spending Heatmap Table**: Breakdown of annual totals, percentage share, and budget impact rating (High/Medium/Standard).

### 6. 🔄 CSV Import / Export & Sample Data
- **Drag-and-Drop CSV Importer**: RFC 4180 compliant with schema validation and error feedback.
- **Full CSV Export**: Exports entire ledger to structured CSV suitable for auditing.
- **1-Click 12-Month Sample Dataset**: Loads 149 realistic records with diverse real-world Indian spending patterns (salary revisions, term fees, festive Diwali spending, summer travel, medical insurance renewals).
- **Reset/Clear Data**: Safe reset mechanism.

### 7. 🧪 Test Verification & Challenge Checklist
- Built-in live calculation test runner verifying Test Cases 1, 2, and 3.
- Reference details for FinVerse Finance Club submission.

---

## 🧪 5. Calculation Test Summary

| Test Case | Inputs | Expected Output | Actual Output | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Test Case 1: Standard Budget** | Income = ₹100,000<br>Expenses = ₹60,000 | Income = ₹100,000<br>Expenses = ₹60,000<br>Exp % = 60.0%<br>Surplus = ₹40,000<br>Savings Rate = 40.0% | Income = ₹100,000<br>Expenses = ₹60,000<br>Exp % = 60.0%<br>Surplus = ₹40,000<br>Savings Rate = 40.0% | ✅ **PASSED** |
| **Test Case 2: Overspending Deficit** | Income = ₹50,000<br>Expenses = ₹55,000 | Surplus = -₹5,000<br>Deficit warning banner displayed | Surplus = -₹5,000<br>Deficit warning banner displayed | ✅ **PASSED** |
| **Test Case 3: Zero Income Safety** | Income = ₹0<br>Expenses = ₹10,000 | Exp % = `N/A`<br>Savings Rate = `N/A`<br>No division-by-zero / NaN | Exp % = `N/A`<br>Savings Rate = `N/A`<br>No runtime error | ✅ **PASSED** |

---

## 📁 6. CSV Data Structure

The application imports and exports standard UTF-8 CSV files with the following structure:

```csv
ID,Year,Month,Type,Category,Amount,Notes
1,2026,January,Income,After Tax Salary - Self,95000,Regular monthly salary
2,2026,January,Income,Rental income,18000,2BHK apartment rent
3,2026,January,Expense,Rent payments,25000,House rent
4,2026,January,Expense,Grocery,12500,Supermarket & pantry supplies
5,2026,January,Investment,Investments towards portfolio,30000,Index funds & PPF monthly SIP
```

---

## 🤖 7. AI Partner & Prompts Documentation

As required by Section 5 of the FinVerse Student Guide:

- **AI Tool Used**: Google Antigravity / Gemini 3.7 Flash
- **Development Process Prompts**:
  1. *Prompt 1 (Template Decomposition)*: "Analyze the attached `FinVerse_Event_Budget_template_090926.xlsx` and `Budget_App_Student_Guide.docx` to extract all category master lists, mathematical relationships, subtotal rows, and required dashboard KPIs."
  2. *Prompt 2 (Architecture & Calculation Engine)*: "Design a modular vanilla JavaScript application controller implementing zero-division protected financial math for Sub Total Income, Sub Total Expenses, Expenses as % of Income, Investable Surplus, Savings Rate, and Uninvested Savings with Indian Rupee (INR) formatting."
  3. *Prompt 3 (Visualizations & Insights)*: "Implement 6 Chart.js charts covering Income vs Expenses Trend, Expense Breakdown Donut, Savings Rate Over Time, Top 5 Expense Horizontal Bar, Surplus Allocation Stacked Bar, and 100% Expense Threshold line, paired with automated written financial insight narratives."
  4. *Prompt 4 (Matrix & CSV Integration)*: "Build an interactive 12-month budget matrix spreadsheet table replicating Excel Sheet 2, alongside an RFC-4180 CSV import/export pipeline and realistic 12-month sample dataset."

---

## 🏆 FinVerse Evaluation Checklist Verification

- [x] Correct Calculations (Sub Total Income, Sub Total Expenses, Expenses as % of Income, Investable Surplus)
- [x] At least 3–4 Dashboard charts (6 charts included)
- [x] Clean, labelled layout with consistent INR (`₹`) formatting
- [x] Written insight lines under charts & dedicated insights banner
- [x] AI Tool and Prompts documented
- [x] Tested against all 3 challenge benchmark cases
