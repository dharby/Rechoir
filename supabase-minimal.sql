-- RECHOIR Minimal Schema - Just for Login
-- Run this in Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEAMS table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPER ADMINS table
CREATE TABLE IF NOT EXISTS public.super_admins (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM LEADS table
CREATE TABLE IF NOT EXISTS public.team_leads (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  team_id UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEMBERS table
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  access_code TEXT UNIQUE NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  specialization TEXT DEFAULT 'SINGER',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert test team
INSERT INTO public.teams (name, code) VALUES ('Test Choir', 'CHOIR001');

-- Create a test team lead (replace with your email)
-- You'll need to create this manually in the dashboard
INSERT INTO public.team_leads (id, email, name, team_id)
SELECT 
  uuid_generate_v4(),
  'teamlead@example.com',
  'Test Team Lead',
  id
FROM public.teams WHERE code = 'CHOIR001'
ON CONFLICT (email) DO NOTHING;

-- CREATE A TEST ACCOUNT YOU CAN LOGIN WITH:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user" to create a new auth user
-- 3. Then add their ID to super_admins or team_leads table

SELECT 'Minimal tables created! Now add a user in Supabase Authentication, then add them to team_leads table.' as message;