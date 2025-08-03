# PowerShell Script: check-import-violations.ps1
# Run from your project root

Write-Host "`n[Step 1] Checking for imports of WalletContext inside src/utils/*..."
Get-ChildItem -Recurse -Include *.ts,*.tsx -Path .\src\utils\ | ForEach-Object {
    Select-String -Path $_.FullName -Pattern "from\s+['""]@/context/WalletContext['""]"
}

Write-Host "`n[Step 2] Checking if WalletContext.tsx imports sellerTiers.ts..."
Select-String -Path .\src\context\WalletContext.tsx -Pattern "from\s+['""]@/utils/sellerTiers['""]"

Write-Host "`n[Step 3] Checking if sellerTiers.ts incorrectly imports from WalletContext..."
Select-String -Path .\src\utils\sellerTiers.ts -Pattern "from\s+['""]@/context/WalletContext['""]"

Write-Host "`n[Step 4] Verifying sellerTiers.ts imports Order from @/types/wallet..."
Select-String -Path .\src\utils\sellerTiers.ts -Pattern "from\s+['""]@/types/wallet['""]"

Write-Host "`n[Done] If no warnings appeared above except Step 4, all imports are correct."
