# Aquavolt - Smart Electricity Vending Platform

![Aquavolt Logo](./public/Logo.png)

Aquavolt is a modern prepaid electricity vending and meter management platform designed for landlords, tenants, and property managers. It lets tenants buy tokens instantly, tracks building-wide consumption, and gives landlords real-time visibility into payments and usage.

## Features

- **Multi-Role Access**: Support for Admin, Landlord, Caretaker, Tenant, and Agent roles
- **Token Vending**: Instant electricity token purchase with M-Pesa integration
- **Property Management**: Comprehensive property and unit management
- **Commission Tracking**: Automated commission calculation for agents
- **Maintenance Console**: Admin tools for meter maintenance tokens
- **Real-time Analytics**: Charts and reports for all stakeholders
- **Futurise Integration**: Direct integration with Futurise DLMS Vendor System

## Tech Stack

- **Frontend**: React 18 + Vite
- **UI Framework**: Ant Design 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **Backend**: Supabase (Auth + PostgreSQL + Edge Functions)
- **Payments**: M-Pesa STK Push
- **API Integration**: Futurise DLMS Vendor System

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Futurise DLMS vendor credentials
- M-Pesa Daraja API credentials (for production)

### Installation

1. Clone the repository:
```bash
cd aquaVOLT
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory (copy from `.env.example`):

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://jfkvsducukwgqsljoisw.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Futurise API Configuration
VITE_FUTURISE_BASE_URL=https://dlms.futurise-tech.com/api
VITE_FUTURISE_VENDOR=aquavolt
VITE_FUTURISE_PASSWORD=123456

# M-Pesa Configuration
VITE_MPESA_CONSUMER_KEY=your_consumer_key
VITE_MPESA_CONSUMER_SECRET=your_consumer_secret
VITE_MPESA_SHORTCODE=your_shortcode
```

4. Get your Supabase anon key:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project: `jfkvsducukwgqsljoisw`
   - Go to Settings > API
   - Copy the `anon` `public` key
   - Paste it in your `.env` file

5. Run the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## Project Structure

```
aquaVOLT/
├── public/              # Static assets
│   └── Logo.png
├── src/
│   ├── components/      # Reusable components
│   │   ├── Layout/
│   │   └── RLSGuard.jsx
│   ├── hooks/           # Custom React hooks
│   │   ├── useAuth.jsx
│   │   └── useRole.js
│   ├── lib/             # Libraries and utilities
│   │   └── supabase.js
│   ├── pages/           # Page components
│   │   ├── admin/       # Admin dashboard pages
│   │   ├── landlord/    # Landlord dashboard pages
│   │   ├── caretaker/   # Caretaker pages
│   │   ├── tenant/      # Tenant pages
│   │   ├── agent/       # Agent pages
│   │   └── auth/        # Authentication pages
│   ├── theme/           # Theme configuration
│   │   └── aquavolt-theme.js
│   ├── App.jsx          # Main app component with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## User Roles

### Super Admin
- Full platform access
- Property and user management
- Maintenance token generation
- Commission configuration
- System settings

### Landlord
- Manage owned properties
- View tenant activity
- Track revenue and commissions
- Monitor meter usage

### Caretaker
- View assigned property
- Submit meter faults
- Track issue status

### Tenant
- Buy electricity tokens
- View purchase history
- Check meter balance

### Agent
- View assigned properties
- Track commission earnings
- Monitor token sales

## Database Setup

The database schema will be created in Supabase. Key tables include:

- `profiles` - User profiles with roles
- `properties` - Property information
- `units` - Individual units with meters
- `unit_assignments` - Tenant-unit relationships
- `topups` - Token purchase records
- `maintenance_tokens` - Maintenance token log
- `commissions` - Commission tracking
- `issues` - Fault reports

Row Level Security (RLS) policies ensure users can only access their authorized data.

## Development Roadmap

### Phase 1: Foundation & Admin Dashboard ✅
- [x] Project setup
- [x] Authentication system
- [x] Role-based routing
- [x] Admin dashboard pages (placeholders)
- [ ] Supabase database schema
- [ ] Futurise API integration

### Phase 2: Landlord Dashboard
- [ ] Property management
- [ ] Tenant management
- [ ] Financial reports
- [ ] Analytics charts

### Phase 3: Caretaker & Agent
- [ ] Fault submission
- [ ] Issue tracking
- [ ] Commission tracking

### Phase 4: Tenant Dashboard (React)
- [ ] Token purchase flow
- [ ] M-Pesa integration
- [ ] Purchase history

### Phase 5: Tenant Mobile (Flutter)
- [ ] Convert to Flutter
- [ ] Native mobile experience

## Contributing

This is a private project. For questions or support, contact the development team.

## License

© 2024 Aquavolt. All rights reserved.

## Support

For technical support or questions:
- Email: support@aquavolt.com
- Dashboard: https://dlms.futurise-tech.com/
