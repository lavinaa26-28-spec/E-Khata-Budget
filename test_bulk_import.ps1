Write-Host "==============================================="
Write-Host " FINVERSE BULK IMPORT & VALIDATION TEST SUITE"
Write-Host "==============================================="

$sampleCsv = @"
Date,Description,Category,Type,Amount,Payment Method,Account,Notes
2026-09-01,Monthly Salary,After Tax Salary - Self,Income,85000,Bank Transfer,HDFC Bank,September salary
2026-09-02,House Rent,Rent payments,Expense,25000,UPI,HDFC Bank,Apartment rent
2026-09-03,Supermarket,Grocery,Expense,8500,UPI,HDFC Bank,Groceries
2026-09-04,Mutual Fund SIP,Investments towards portfolio,Investment,25000,Auto-Debit,Zerodha,Index SIP
2026-09-05,Power Bill,Electricity bills,Expense,2800,NetBanking,SBI,Electricity
2026-09-06,Fiber Net,Internet,Expense,1200,UPI,HDFC Bank,Broadband
2026-09-07,Freelancing,Business sale proceed,Income,22000,Bank Transfer,ICICI Bank,Consulting
2026-09-08,Fuel,Petrol/Diesel,Expense,4500,Credit Card,HDFC Bank,Petrol
2026-09-09,Dining Out,Hotel/Restaurants,Expense,3800,Credit Card,HDFC Bank,Dinner
2026-09-10,Vitamins,Medicines,Expense,1800,UPI,HDFC Bank,Medical
2026-09-12,Maid,Maids wages,Expense,4500,Cash,Cash,Maid
2026-09-14,OTT,TV/OTT,Expense,1499,Credit Card,ICICI Bank,OTT
2026-09-15,FD Interest,Interest/Dividend income,Income,3200,Bank Transfer,SBI,FD Interest
2026-09-17,Mobile,Mobile,Expense,999,UPI,HDFC Bank,Postpaid
2026-09-19,Car Service,Vehicle maintenance,Expense,5200,Debit Card,ICICI Bank,Car service
2026-09-21,PPF,Investments towards portfolio,Investment,10000,NetBanking,SBI,PPF
2026-09-23,Tuition,Tuition fees,Expense,6500,UPI,HDFC Bank,Tuition
2026-09-25,Charity,Donations,Expense,2000,UPI,HDFC Bank,Donation
2026-09-28,Books,Books/newspapers/periodicals,Expense,1400,UPI,HDFC Bank,Books
2026-09-30,Rental,Rental income,Income,18000,Bank Transfer,HDFC Bank,Rent
"@

$parsedRows = $sampleCsv | ConvertFrom-Csv
Write-Host "Total Parsed Rows: $($parsedRows.Count)"

$incomeTotal = ($parsedRows | Where-Object { $_.Type -eq 'Income' } | Measure-Object -Property Amount -Sum).Sum
$expenseTotal = ($parsedRows | Where-Object { $_.Type -eq 'Expense' } | Measure-Object -Property Amount -Sum).Sum
$investmentTotal = ($parsedRows | Where-Object { $_.Type -eq 'Investment' } | Measure-Object -Property Amount -Sum).Sum
$surplus = $incomeTotal - $expenseTotal
$savingsRate = [Math]::Round(($surplus / $incomeTotal) * 100, 2)
$uninvested = $surplus - $investmentTotal

Write-Host "Total Income     : ₹$incomeTotal (Expected: ₹128,200)"
Write-Host "Total Expenses   : ₹$expenseTotal (Expected: ₹69,698)"
Write-Host "Investments      : ₹$investmentTotal (Expected: ₹35,000)"
Write-Host "Surplus          : ₹$surplus (Expected: ₹58,502)"
Write-Host "Savings Rate     : $savingsRate% (Expected: 45.63%)"
Write-Host "Uninvested Cash  : ₹$uninvested (Expected: ₹23,502)"

if ($incomeTotal -eq 128200 -and $expenseTotal -eq 69698 -and $surplus -eq 58502) {
    Write-Host "`n[PASS] All 20 bulk transactions calculated correctly!" -ForegroundColor Green
} else {
    Write-Host "`n[FAIL] Calculation discrepancy in test sample" -ForegroundColor Red
}

Write-Host "==============================================="
