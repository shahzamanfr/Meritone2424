@echo off
echo ========================================
echo   Pushing MeritOne to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Setting up remote...
git remote remove origin 2>nul
git remote add origin https://github.com/shahzamanfr/MeritOne.git

echo.
echo Pulling latest changes...
git pull origin main --allow-unrelated-histories --no-edit

echo.
echo Pushing your code to GitHub...
echo When prompted, use your GitHub credentials:
echo   Username: shahzamanfr
echo   Password: [use your personal access token]
echo.

git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub!
    echo   https://github.com/shahzamanfr/MeritOne
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Push failed. Please try:
    echo   1. Use GitHub Desktop
    echo   2. Or run: git push -u origin main
    echo ========================================
)

pause
