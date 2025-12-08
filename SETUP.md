# Aquavolt Database Setup Guide

## Quick Setup Instructions

Follow these steps to set up your Supabase database for Aquavolt:

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/jfkvsducukwgqsljoisw)
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Schema SQL

1. Open the file `supabase/schema.sql` in your code editor
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter)
5. Wait for completion (you should see "Success. No rows returned")

This creates:
- ✅ 8 tables (profiles, properties, units, unit_assignments, topups, maintenance_tokens, commissions, issues, api_credentials)
- ✅ Row Level Security policies for all roles
- ✅ Indexes for performance
- ✅ Triggers for auto-creating profiles and updating timestamps

### Step 3: Run Seed Data SQL

1. Open the file `supabase/seed.sql`
2. Copy ALL the contents
3. Paste into a new query in Supabase SQL Editor
4. Click **Run**

This inserts:
- ✅ Futurise API credentials
- ✅ M-Pesa API credentials

### Step 4: Create Test Users

You need to create test users through Supabase Auth. Go to **Authentication > Users** and click **Add user**:

#### Admin User
- Email: `admin@aquavolt.com`
- Password: `admin123`
- User Metadata (click "Add metadata"):
  ```json
  {
    "full_name": "Admin User",
    "role": "admin"
  }
  ```

#### Landlord User
- Email: `landlord@aquavolt.com`
- Password: `landlord123`
- User Metadata:
  ```json
  {
    "full_name": "John Landlord",
    "role": "landlord"
  }
  ```

#### Tenant User
- Email: `tenant@aquavolt.com`
- Password: `tenant123`
- User Metadata:
  ```json
  {
    "full_name": "Jane Tenant",
    "role": "tenant"
  }
  ```

#### Caretaker User
- Email: `caretaker@aquavolt.com`
- Password: `caretaker123`
- User Metadata:
  ```json
  {
    "full_name": "Mike Caretaker",
    "role": "caretaker"
  }
  ```

#### Agent User
- Email: `agent@aquavolt.com`
- Password: `agent123`
- User Metadata:
  ```json
  {
    "full_name": "Sarah Agent",
    "role": "agent"
  }
  ```

**IMPORTANT**: When you create a user in Supabase Auth, the trigger will automatically create a corresponding profile in the `profiles` table.

### Step 5: Verify Setup

Run this query in SQL Editor to verify everything is set up:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if profiles were created
SELECT id, full_name, email, role FROM profiles;

-- Check if API credentials were inserted
SELECT service_name FROM api_credentials;
```

You should see:
- 9 tables listed
- 5 user profiles (if you created all test users)
- 2 API credential entries (futurise, mpesa)

### Step 6: Test Login

1. Go to http://localhost:5173/
2. Try logging in with any of the test users
3. You should be redirected to the appropriate dashboard based on role

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran `schema.sql` first
- Check that you're in the correct project

### Error: "permission denied"
- RLS policies are working correctly
- Make sure you're logged in as the correct user

### Users not appearing in profiles table
- Check that the trigger `on_auth_user_created` exists
- Verify user metadata includes the `role` field
- Try creating a new user to trigger the function

### Can't log in
- Verify `.env` file exists and has correct Supabase URL and anon key
- Check browser console for errors
- Confirm user exists in Supabase Auth

## Next Steps

After setup is complete:
1. Log in as admin to access all features
2. Create properties and units
3. Assign tenants to units
4. Test token purchase flow (requires Futurise API integration)
5. Explore all dashboards with different user roles
