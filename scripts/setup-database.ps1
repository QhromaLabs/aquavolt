# Aquavolt Database Setup Script
# This script provides the SQL commands ready to copy-paste into Supabase

Write-Host "========================================" -ForegroundColor Green
Write-Host "Aquavolt Database Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "OPTION 1: Quick Copy-Paste Method" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Open Supabase SQL Editor:" -ForegroundColor Cyan
Write-Host "   https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/sql/new" -ForegroundColor White
Write-Host ""
Write-Host "2. Copy schema.sql to clipboard..." -ForegroundColor Cyan

# Read and copy schema.sql to clipboard
$schemaPath = Join-Path $PSScriptRoot "supabase\schema.sql"
if (Test-Path $schemaPath) {
    Get-Content $schemaPath -Raw | Set-Clipboard
    Write-Host "   ✓ schema.sql copied to clipboard!" -ForegroundColor Green
    Write-Host "   → Paste (Ctrl+V) into Supabase SQL Editor and click RUN" -ForegroundColor White
} else {
    Write-Host "   ✗ schema.sql not found!" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter after running schema.sql in Supabase"

Write-Host ""
Write-Host "3. Copy seed.sql to clipboard..." -ForegroundColor Cyan

# Read and copy seed.sql to clipboard
$seedPath = Join-Path $PSScriptRoot "supabase\seed.sql"
if (Test-Path $seedPath) {
    Get-Content $seedPath -Raw | Set-Clipboard
    Write-Host "   ✓ seed.sql copied to clipboard!" -ForegroundColor Green
    Write-Host "   → Click 'New Query', paste (Ctrl+V) and click RUN" -ForegroundColor White
} else {
    Write-Host "   ✗ seed.sql not found!" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter after running seed.sql in Supabase"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next: Create Admin User" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users" -ForegroundColor White
Write-Host ""
Write-Host "2. Click 'Add user' → 'Create new user'" -ForegroundColor White
Write-Host ""
Write-Host "3. Fill in:" -ForegroundColor White
Write-Host "   Email: admin@aquavolt.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host "   Auto Confirm User: ✓ (CHECK THIS)" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. After creating, click on the user and add User Metadata:" -ForegroundColor White

# Copy user metadata to clipboard
$metadata = '{"full_name": "Admin User", "role": "admin"}'
$metadata | Set-Clipboard
Write-Host "   ✓ User metadata copied to clipboard!" -ForegroundColor Green
Write-Host "   → Paste this in the User Metadata field" -ForegroundColor White
Write-Host ""
Write-Host "5. Test login at: http://localhost:5173/" -ForegroundColor White
Write-Host "   Email: admin@aquavolt.com" -ForegroundColor Cyan
Write-Host "   Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All Done! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
