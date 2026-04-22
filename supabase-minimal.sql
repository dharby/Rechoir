-- RECHOIR Minimal Schema - Each Team Lead manages their choir
-- Run this in Supabase SQL Editor

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TEAMS table (each choir)
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM LEADS table (one per team - the admin)
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

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "teams_read" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert" ON public.teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "teams_update" ON public.teams FOR UPDATE USING (auth.role() = 'authenticated');

-- Team leads can manage their profile
CREATE POLICY "team_leads_read" ON public.team_leads FOR SELECT USING (true);
CREATE POLICY "team_leads_insert" ON public.team_leads FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "team_leads_update" ON public.team_leads FOR UPDATE USING (auth.uid() = id);

-- Members can manage their profile
CREATE POLICY "members_read" ON public.members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON public.members FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "members_update" ON public.members FOR UPDATE USING (auth.uid() = id);

SELECT 'Tables ready! Team leads can now register with their choir code.' as message;