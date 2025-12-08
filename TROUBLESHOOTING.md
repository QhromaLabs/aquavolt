# Troubleshooting "Invalid Login Credentials"

## Common Causes & Solutions

### 1. User Not Created in Supabase ⚠️
**Most Common Issue**

The admin user needs to be created in Supabase Auth, not just in the database.

**Solution:**
1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users
2. Check if you see a user with email `admin@aquavolt.com`
3. If NOT, create it:
   - Click **"Add user"** → **"Create new user"**
   - Email: `admin@aquavolt.com`
   - Password: `admin123`
   - **IMPORTANT**: Check ✅ **"Auto Confirm User"**
   - Click **"Create user"**
4. After creating, click on the user
5. Scroll to **"User Metadata"** section
6. Click **"Edit"** and paste:
   ```json
   {
     "full_name": "Admin User",
     "role": "admin"
   }
   ```
7. Click **"Save"**

### 2. User Not Confirmed
If you created the user but forgot to check "Auto Confirm User":

**Solution:**
1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users
2. Find the admin@aquavolt.com user
3. Click on it
4. Look for **"Email Confirmed"** status
5. If it says "Not confirmed", click the **"..."** menu → **"Confirm email"**

### 3. Wrong Password
Make sure you're using exactly: `admin123` (no spaces, lowercase)

### 4. Database Schema Not Run
The `profiles` table and trigger need to exist.

**Check:**
1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/editor
2. Look for these tables in the left sidebar:
   - profiles
   - properties
   - units
   - topups
   - etc.

**If tables don't exist:**
1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/sql/new
2. Copy ALL content from `supabase/schema.sql`
3. Paste and click **RUN**
4. Wait for "Success" message

### 5. Profile Not Created
Even if the user exists in Auth, the profile might not have been created.

**Check:**
1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/editor
2. Click on **"profiles"** table
3. Look for a row with the admin user's ID

**If profile doesn't exist:**
The trigger might not have fired. Manually create the profile:

```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'admin@aquavolt.com';

-- Then insert into profiles (replace USER_ID with the actual UUID)
INSERT INTO profiles (id, full_name, email, role)
VALUES ('USER_ID', 'Admin User', 'admin@aquavolt.com', 'admin');
```

### 6. Wrong Supabase URL or Key
**Check your `.env` file:**

```env
VITE_SUPABASE_URL=https://jfkvsducukwgqsljoisw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impma3ZzZHVjdWt3Z3FzbGpvaXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODI5NTgsImV4cCI6MjA4MDc1ODk1OH0.twdtSeDGoMCsaqAgDh5kwlzIkKlL78fUNIdErYE9wr8
```

**If different:**
1. Copy `.env.example` to `.env` again
2. Restart dev server: Stop (Ctrl+C) and run `npm run dev`

## Quick Verification Steps

### Step 1: Verify User Exists
```
https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users
```
- Should see: admin@aquavolt.com
- Status: Confirmed ✅
- User Metadata: {"full_name": "Admin User", "role": "admin"}

### Step 2: Verify Database Tables
```
https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/editor
```
- Should see 9 tables: profiles, properties, units, etc.

### Step 3: Verify Profile Created
```sql
SELECT * FROM profiles WHERE email = 'admin@aquavolt.com';
```
- Should return 1 row with role = 'admin'

### Step 4: Test Login
- Go to: http://localhost:5173/
- Email: admin@aquavolt.com
- Password: admin123
- Should redirect to Admin Dashboard

## Still Not Working?

### Check Browser Console
1. Open browser console (F12)
2. Try to login
3. Look for errors
4. Common errors:
   - "Invalid login credentials" → User not created or wrong password
   - "Missing Supabase environment variables" → .env file issue
   - Network errors → Supabase connection issue

### Create a Different Test User
Try creating a tenant user to test:

1. In Supabase Auth → Add user:
   - Email: `test@aquavolt.com`
   - Password: `test123`
   - Auto Confirm: ✅
   - User Metadata: `{"full_name": "Test User", "role": "tenant"}`

2. Try logging in with test@aquavolt.com / test123

## Need More Help?

Run this SQL query to check everything:

```sql
-- Check if user exists in auth
SELECT id, email, email_confirmed_at, raw_user_meta_data 
FROM auth.users 
WHERE email = 'admin@aquavolt.com';

-- Check if profile exists
SELECT * FROM profiles WHERE email = 'admin@aquavolt.com';

-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

This will show you exactly what's missing.
