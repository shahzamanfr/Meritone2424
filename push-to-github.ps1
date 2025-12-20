# Push to GitHub - MeritOne
# Run this script to push your code

Write-Host "Pushing code to GitHub..." -ForegroundColor Green

# Set remote URL with token
git remote set-url origin https://shahzamanfr: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@github.com/shahzamanfr/MeritOne.git

# Push to GitHub
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SUCCESS! Code pushed to GitHub!" -ForegroundColor Green
    Write-Host "View your repo: https://github.com/shahzamanfr/MeritOne" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Push failed. Try these solutions:" -ForegroundColor Red
    Write-Host "1. Make sure the repository exists at: https://github.com/shahzamanfr/MeritOne" -ForegroundColor Yellow
    Write-Host "2. Check if the token has 'repo' permissions" -ForegroundColor Yellow
    Write-Host "3. Try using GitHub Desktop instead" -ForegroundColor Yellow
}
