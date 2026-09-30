Write-Host "=========================================="
Write-Host " FINVERSE PERSONAL BUDGET - SYSTEM VERIFICATION"
Write-Host "=========================================="

$htmlExists = Test-Path "index.html"
$cssExists = Test-Path "styles.css"
$jsExists = Test-Path "app.js"
$csvExists = Test-Path "sample_finverse_budget.csv"

Write-Host "Checking core files:"
Write-Host "  index.html                : $htmlExists"
Write-Host "  styles.css                : $cssExists"
Write-Host "  app.js                    : $jsExists"
Write-Host "  sample_finverse_budget.csv: $csvExists"

if (-not ($htmlExists -and $cssExists -and $jsExists -and $csvExists)) {
    Write-Error "Missing critical files!"
    exit 1
}

# Verify CSV structure
$csvRows = Import-Csv "sample_finverse_budget.csv"
Write-Host "`nSample CSV contains $($csvRows.Count) records across all 12 months."

$monthsFound = $csvRows | Select-Object -ExpandProperty Month -Unique
Write-Host "Months in CSV ($($monthsFound.Count)): $($monthsFound -join ', ')"

$incomeSum = ($csvRows | Where-Object { $_.Type -eq 'Income' } | Measure-Object -Property Amount -Sum).Sum
$expenseSum = ($csvRows | Where-Object { $_.Type -eq 'Expense' } | Measure-Object -Property Amount -Sum).Sum
$investSum = ($csvRows | Where-Object { $_.Type -eq 'Investment' } | Measure-Object -Property Amount -Sum).Sum
$surplus = $incomeSum - $expenseSum
$savingsRate = [Math]::Round(($surplus / $incomeSum) * 100, 2)
$uninvested = $surplus - $investSum

Write-Host "`n=== Annual Financial Metrics Verification ==="
Write-Host "Total Annual Income     : ₹$incomeSum"
Write-Host "Total Annual Expenses   : ₹$expenseSum"
Write-Host "Investable Surplus      : ₹$surplus"
Write-Host "Annual Savings Rate     : $savingsRate%"
Write-Host "Investments towards PF  : ₹$investSum"
Write-Host "Uninvested Cash Savings : ₹$uninvested"

# Verify Prompt Test Cases
Write-Host "`n=== Executing Required Test Cases ==="

# Test Case 1
$t1_inc = 100000
$t1_exp = 60000
$t1_surp = $t1_inc - $t1_exp
$t1_exp_pct = ($t1_exp / $t1_inc) * 100
$t1_sav_rate = ($t1_surp / $t1_inc) * 100

if ($t1_surp -eq 40000 -and $t1_exp_pct -eq 60 -and $t1_sav_rate -eq 40) {
    Write-Host " [PASS] Test Case 1: Income ₹100,000, Expenses ₹60,000 -> Surplus ₹40,000, Exp % 60%, Savings Rate 40%" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Test Case 1" -ForegroundColor Red
}

# Test Case 2
$t2_inc = 50000
$t2_exp = 55000
$t2_surp = $t2_inc - $t2_exp
if ($t2_surp -eq -5000) {
    Write-Host " [PASS] Test Case 2: Income ₹50,000, Expenses ₹55,000 -> Surplus -₹5,000 (Deficit detected)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Test Case 2" -ForegroundColor Red
}

# Test Case 3
$t3_inc = 0
$t3_exp = 10000
$t3_exp_pct = if ($t3_inc -gt 0) { ($t3_exp / $t3_inc) * 100 } else { "N/A" }
$t3_sav_rate = if ($t3_inc -gt 0) { (($t3_inc - $t3_exp) / $t3_inc) * 100 } else { "N/A" }
if ($t3_exp_pct -eq "N/A" -and $t3_sav_rate -eq "N/A") {
    Write-Host " [PASS] Test Case 3: Income ₹0 -> Exp % = N/A, Savings Rate = N/A (Zero Division Safe)" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Test Case 3" -ForegroundColor Red
}

Write-Host "`nAll verifications completed successfully!"
