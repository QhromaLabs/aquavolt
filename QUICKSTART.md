# 🚀 Quick Start - Run This Now!

## Step 1: Run Database Schema (2 minutes)

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/sql/new

2. **Copy and run** `supabase/schema.sql`:
   - Open `supabase/schema.sql` in VS Code
   - Select All (Ctrl+A) and Copy (Ctrl+C)
   - Paste into Supabase SQL Editor
   - Click **RUN** button
   - Wait for "Success" message

3. **Copy and run** `supabase/seed.sql`:
   - Open `supabase/seed.sql`
   - Copy all content
   - Paste into a NEW query in Supabase
   - Click **RUN**

## Step 2: Create Admin User (1 minute)

1. Go to: https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw/auth/users
2. Click **Add user** → **Create new user**
3. Fill in:
   - **Email**: `admin@aquavolt.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ (check this box)
4. Click **Create user**
5. Click on the newly created user
6. Scroll to **User Metadata** section
7. Click **Edit** and paste:
   ```json
   {
     "full_name": "Admin User",
     "role": "admin"
   }
   ```
8. Click **Save**

## Step 3: Test Login

1. Go to http://localhost:5173/
2. Login with:
   - Email: `admin@aquavolt.com`
   - Password: `admin123`
3. You should see the Admin Dashboard! 🎉

## What You'll See

After logging in as admin, you'll have access to:
- Dashboard Overview
- Properties Management
- Units & Meter Matrix
- User Management
- Top-Ups Log
- Maintenance Token Console
- Commission Engine
- Settings

## Need More Test Users?

Create additional users following the same pattern in SETUP.md:
- `landlord@aquavolt.com` (role: landlord)
- `tenant@aquavolt.com` (role: tenant)
- `caretaker@aquavolt.com` (role: caretaker)
- `agent@aquavolt.com` (role: agent)

## Troubleshooting

**Login page is blank?**
- Make sure `.env` file exists (it should, we just created it)
- Restart the dev server: Stop (Ctrl+C) and run `npm run dev` again

**Can't log in?**
- Check that you clicked "Auto Confirm User" when creating the user
- Verify the email and password are correct
- Check browser console for errors (F12)

**"Missing Supabase environment variables" error?**
- The `.env` file should exist now
- Restart the dev server

---

**Full documentation**: See `SETUP.md` for detailed instructions
