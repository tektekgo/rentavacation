# Rent-A-Vacation Setup Guide

## Prerequisites

- Node.js 18+ installed
- Git access to the repository
- Supabase project (dev and prod)
- Vercel project

## Environment Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/rent-a-vacation/rav-website.git
   cd rav-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

Add these environment variables in your Vercel project settings:

**Development/Preview:**
- `VITE_SUPABASE_URL`: `https://oukbxqnlxnkainnligfz.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your dev project anon key

**Production:**
- `VITE_SUPABASE_URL`: `https://xzfllqndrlmhclqfybew.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your prod project anon key

## Database Setup

### Initial Schema Migration

1. Go to your Supabase dashboard → SQL Editor
2. Run the contents of `docs/supabase-migrations/001_initial_schema.sql`
3. (Optional) Run `docs/supabase-migrations/002_seed_data.sql` for sample data

### Creating Your First Admin

After running the migrations:

1. Sign up via the app (creates a user with 'renter' role by default)
2. Go to Supabase → Table Editor → `auth.users` → Copy your user ID
3. In SQL Editor, run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID', 'rav_owner')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| `rav_owner` | RAV superuser | Full access to everything |
| `rav_admin` | RAV administrator | Full access except role management |
| `rav_staff` | RAV staff member | View/manage listings and bookings |
| `property_owner` | Property owner | Manage own properties and listings |
| `renter` | Renter (default) | Browse and book listings |

## Authentication

### Google OAuth Setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized origins:
   - `http://localhost:8080` (local dev)
   - `https://your-vercel-domain.vercel.app`
   - `https://rentavacation.com` (production)
4. Add redirect URLs:
   - `https://oukbxqnlxnkainnligfz.supabase.co/auth/v1/callback` (dev)
   - `https://xzfllqndrlmhclqfybew.supabase.co/auth/v1/callback` (prod)
5. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Add Client ID and Client Secret

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/
│   └── AuthContext.tsx  # Authentication state management
├── hooks/
│   └── useAuth.ts       # Auth hook for components
├── lib/
│   └── supabase.ts      # Supabase client configuration
├── pages/               # Page components
└── types/
    └── database.ts      # TypeScript database types

docs/
└── supabase-migrations/ # SQL migration scripts
```

## Database Schema

### Tables

- **profiles**: User profile data (linked to auth.users)
- **user_roles**: User role assignments (RBAC)
- **properties**: Vacation club property listings
- **owner_agreements**: Commission/pricing agreements
- **listings**: Available rental periods
- **bookings**: Rental bookings

### Key Features

- **Row Level Security (RLS)**: All tables have RLS policies
- **Auto-created profiles**: Trigger creates profile on signup
- **Default role**: New users get 'renter' role automatically
- **Security definer functions**: Prevent RLS recursion

## CI/CD Pipeline

```
dev branch  →  Vercel Preview  →  Supabase Dev
main branch →  Vercel Production  →  Supabase Prod
```

## Troubleshooting

### "Missing Supabase environment variables" warning
Ensure your `.env.local` file exists and contains valid Supabase credentials.

### RLS policy errors
Check that you're authenticated and have the correct role for the operation.

### Profile not created after signup
The `on_auth_user_created` trigger should auto-create profiles. Check Supabase logs if issues occur.
