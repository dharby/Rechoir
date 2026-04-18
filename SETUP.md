# RECHOIR TNMIB - Backend Setup Guide

## Prerequisites
- Supabase account (supabase.com)
- Node.js installed
- Supabase CLI installed (`npx supabase`)

## Step 1: Get Your Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Create a new project or use existing one
3. Go to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Service Role Key** (click "Reveal" - starts with `eyJ...`)

## Step 2: Configure Environment

Update `frontend/.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Step 3: Create Database Schema

Go to your Supabase Dashboard → **SQL Editor** and run the contents of:
- `supabase/schemas/schema.sql`

Or use the CLI:
```bash
npx supabase db push
```

## Step 4: Deploy Edge Functions

Deploy all functions:
```bash
cd supabase/functions

# Auth functions
npx supabase functions deploy auth/super-admin
npx supabase functions deploy auth/team-lead
npx supabase functions deploy auth/member

# Other functions
npx supabase functions deploy teams
npx supabase functions deploy members
npx supabase functions deploy prayer-chains
npx supabase functions deploy payments
npx supabase functions deploy rehearsals
npx supabase functions deploy checklists
npx supabase functions deploy uniforms
npx supabase functions deploy songs
npx supabase functions deploy chat
npx supabase functions deploy notifications
```

Or deploy all at once using the script:
```bash
cd supabase && npx supabase functions deploy
```

## Step 5: Verify Setup

Run the frontend and test:
```bash
cd frontend
npm run dev
```

## Function URLs

After deployment, your functions will be available at:
```
https://your-project.supabase.co/functions/v1/auth/super-admin
https://your-project.supabase.co/functions/v1/auth/team-lead
https://your-project.supabase.co/functions/v1/auth/member
https://your-project.supabase.co/functions/v1/teams
https://your-project.supabase.co/functions/v1/members
https://your-project.supabase.co/functions/v1/prayer-chains
https://your-project.supabase.co/functions/v1/payments
https://your-project.supabase.co/functions/v1/rehearsals
https://your-project.supabase.co/functions/v1/checklists
https://your-project.supabase.co/functions/v1/uniforms
https://your-project.supabase.co/functions/v1/songs
https://your-project.supabase.co/functions/v1/chat
https://your-project.supabase.co/functions/v1/notifications
```

## Quick Deploy All Functions

```bash
# From supabase directory, deploy all
for dir in functions/*/; do
  func_name=$(basename "$dir")
  npx supabase functions deploy "$func_name" --no-verify-jwt
done
```

## Troubleshooting

### CORS errors
Make sure your Supabase project allows the frontend domain in CORS settings.

### Function not found
Wait a few minutes for functions to propagate after deployment.

### Database errors
Check the SQL was executed in the SQL Editor and RLS policies are properly set.