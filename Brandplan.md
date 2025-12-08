🏙️ AQUAVOLT PLATFORM — FULL SYSTEM SPECIFICATION

Prepaid Smart Electricity Vending + Tenant Power Management + Property Ledger + Token Control

📌 Overview

Aquavolt is a next-generation cloud platform designed for:

Electricity vending

Tenant meter token purchase

Smart property energy monitoring

Landlord monetization & commissions

Remote meter administration

Token auditing & tamper management

Aquavolt integrates directly with the Futurise DLMS Vendor System (HES platform) for token issuance while running its own UI/UX, billing layer, commission logic, and analytics.

Aquavolt does not replace STS key hosting — it overlays a business-grade SaaS interface on top.

🧱 Core Components
Layer	Tech
Client Apps	React (web, all dashboards) & Flutter (optional mobile tenant app)
Auth & Data	Supabase Auth + Postgres
Backend	Node.js / Supabase Edge Functions
Payments	M-Pesa STK / Stripe
UI Library	Ant Design + Tailwind
State	React Query
Charts	Recharts
Roles Enforcement	Supabase RLS + Middleware
Integration	Futurise DLMS API (vending & maintenance token dispatch)
👥 USER ROLES & ACCESS
Role	Description	Cannot Access
Super Admin (Qhroma/Aquavolt HQ)	Everything, API keys, commissions, override tokens, relay, tamper	None
Landlord / Property Owner	Views only their properties, units, finance, tenant spends	Other landlords
Caretaker	Assigned property only, handle issues, view meter, submit fault	Vending tokens on API
Tenant	Buy token, view meter balance, receipts	Commission controls, maintenance
Agent	Commission-linked view of assigned properties	All other revenue
🗄 DATABASE SCHEMA (Supabase)
profiles (
  id uuid pk,
  full_name text,
  phone text,
  email text,
  role text check in ('admin','landlord','caretaker','tenant','agent'),
  created_at timestamp default now()
)

properties (
  id uuid pk,
  landlord_id uuid references profiles(id),
  name text,
  location text,
  region_code text,
  created_at timestamp default now()
)

units (
  id uuid pk,
  property_id uuid references properties(id),
  label text,
  meter_number text unique,
  status text default 'active',
  created_at timestamp default now()
)

unit_assignments (
  id uuid pk,
  unit_id uuid references units(id),
  tenant_id uuid references profiles(id),
  start_date date,
  end_date date,
  status text default 'active'
)

topups (
  id uuid pk,
  unit_id uuid references units(id),
  tenant_id uuid references profiles(id),
  amount_paid numeric,
  amount_vended numeric,
  fee_amount numeric,
  payment_channel text,
  token text,
  futurise_status text,
  futurise_message text,
  created_at timestamp default now()
)

maintenance_tokens (
  id uuid pk,
  meter_number text,
  sub_class int,
  value numeric,
  explain text,
  token text,
  issued_by uuid references profiles(id),
  created_at timestamp default now()
)

commissions (
  id uuid pk,
  property_id uuid references properties(id),
  agent_id uuid references profiles(id),
  topup_id uuid references topups(id),
  amount numeric,
  created_at timestamp default now()
)

issues (
  id uuid pk,
  unit_id uuid references units(id),
  caretaker_id uuid references profiles(id),
  category text, -- meter lock / tamper / blackout
  status text default 'pending',
  description text,
  created_at timestamp default now()
)

🔐 ACCESS CONTROL (RLS)
Tenants (role = tenant)
tenant can select from topups where topups.tenant_id = auth.uid()
tenant can select from units -> join unit_assignments where tenant_id = auth.uid()

Landlords
landlord can select units where property_id in properties he owns
landlord can view topups where unit_id belongs to properties owned

Caretaker
caretaker sees units where caretaker assigned to property
only insert issues

Agent
agents view commission calculation + assigned units

Super Admin
bypass rls

🌍 APPLICATION MODULES & MENUS
1. SUPER ADMIN (AQUAVOLT HQ)
Dashboard Overview
Properties Management
Units & Meter Matrix
User Roles & Assignments
Top-Ups Log (global)
Maintenance Token Console
Relay Control Console
Commission Rules Engine
Vendor API Credentials & Health
Futurise Session Monitor
Settings (branding, domain, SMTP)

2. LANDLORD
My Dashboard
My Properties
My Meters
My Tenants
Billing & Finance
Monthly Spend Analytics
Token Purchases Report
Commission Earnings
Caretaker Issue Feed

3. CARETAKER
Assigned Property View
Units List
Submit Meter Fault
View Fault Status
View Tenant Tokens (read only)
Announcements (Admin to Caretaker)

4. TENANT
Home (Meter Snapshot)
Buy Token
Top-Up History
Copy Token to Keypad
How to Load Token
Support / Caretaker Contact

5. AGENT
Assigned Buildings
Monthly Commission Graph
Token Volume Trend
Tenant Spend Breakdown
Support Escalation

⚙️ FUTURISE API INTEGRATION
🔑 Authentication

Captcha → Login → Bearer Token

Token cached backend-side with expiry watch

🧾 Token Purchase
POST /meter-recharge/recharge-token/0
Body: { meterNo, money }
Returns: token, flowNo, charge result

🛠️ Maintenance Tokens
POST /meter-recharge/meter-token/0
Body: { meterNo, subClass, value }

SubClass Key Mapping
subClass	Function
1	Clear Credit
5	Clear Tamper
0	Max Power Limit Set
2	Tariff Update
3/4/8/9	Decoder/Key Reissue
10	Extended Tokens

All admin-only.

📊 DASHBOARD CHARTS
Tenant

Last 6 purchases line chart

Remaining balance estimate

Landlord

Spend vs consumption

Property token sales aggregate

Admin

Global volume & net profit

Region-level power sales

Commission splits

💰 BILLING & COMMISSIONS
Revenue Split Example
Token Sale = 100 KES
Landlord rate = 4%
Agent rate = 3%
Aquavolt = 93% or remainder

Smart Fee Logic
amount_vended = amount_paid - fee
fee = configurable per property or per portfolio

🚨 FAULT HANDLING (Caretaker Input)
Issue Categories

Meter Tamper

Power Cut not due to low units

Phase Error

Meter Lock

Keypad error

Stored in issues table → tracked by admin → optional push back to Futurise.

🔌 RELAY CONTROL (If Enabled Later)

UI placeholders:

Relay On

Relay Off

Batch Relay

Status Poll

Backend note: Do not activate unless granted API permission by Futurise.

📱 FRONTEND UI FRAMEWORK
Shared Library

Ant Design Components

Tailwind Utilities

Custom AquavoltThemeProvider

useRole() hook

RLSGuard component

Core Design Theme

Neutral Grey / Black

Electric Blue: #2e63ff

Clean table-based industrial dashboards

🧠 FUTURE EXPANSIONS
Feature	Notes
Live Power Reads	If Futurise exposes consumption endpoints
SMS/USSD balance	Tenant “check units”
AI Bill Prediction	Use spend patterns
Multi-estate billing	Bulk portfolio management
Green Power KPI	CO₂ saved, solar integration
🏁 DELIVERABLES SUMMARY

Fully functional multi-role React dashboard

Supabase schema + RLS enforcement

Token vending backend + cache auth

Commission + ledger engine

Issue escalation workflow

Branding-ready SaaS experience

Web + mobile parity support

✔️ FINAL STATEMENT

Aquavolt abstracts complex STS energy vending & HES infrastructure into a frictionless digital property power economy, turning every building into a self-managing power marketplace with accountability, revenue transparency, and tenant autonomy.

END OF MD SPEC