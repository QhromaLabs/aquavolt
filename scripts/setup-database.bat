@echo off
echo ========================================
echo Aquavolt Database Setup
echo ========================================
echo.
echo This script will help you set up the Aquavolt database in Supabase.
echo.
echo STEP 1: Run Database Schema
echo ----------------------------
echo 1. Open your browser and go to:
echo    https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/sql/new
echo.
echo 2. Open the file: supabase\schema.sql
echo    (It should already be open in your editor)
echo.
echo 3. Select ALL content (Ctrl+A) and Copy (Ctrl+C)
echo.
echo 4. Paste into the Supabase SQL Editor and click RUN
echo.
pause
echo.
echo STEP 2: Run Seed Data
echo ---------------------
echo 1. In Supabase SQL Editor, click "New Query"
echo.
echo 2. Open the file: supabase\seed.sql
echo.
echo 3. Select ALL content (Ctrl+A) and Copy (Ctrl+C)
echo.
echo 4. Paste into the Supabase SQL Editor and click RUN
echo.
pause
echo.
echo STEP 3: Create Admin User
echo --------------------------
echo 1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users
echo.
echo 2. Click "Add user" -^> "Create new user"
echo.
echo 3. Fill in:
echo    Email: admin@aquavolt.com
echo    Password: admin123
echo    Auto Confirm User: CHECK THIS BOX
echo.
echo 4. Click "Create user"
echo.
echo 5. Click on the newly created user
echo.
echo 6. Scroll to "User Metadata" section and click "Edit"
echo.
echo 7. Paste this JSON:
echo    {"full_name": "Admin User", "role": "admin"}
echo.
echo 8. Click "Save"
echo.
pause
echo.
echo STEP 4: Test Login
echo ------------------
echo 1. Go to: http://localhost:5173/
echo.
echo 2. Login with:
echo    Email: admin@aquavolt.com
echo    Password: admin123
echo.
echo 3. You should see the Admin Dashboard!
echo.
echo ========================================
echo Setup Complete!
echo ========================================
pause
