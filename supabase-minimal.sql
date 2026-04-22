-- RECHOIR Minimal Schema - Run in Supabase SQL Editor
-- Tables already exist from previous run, just adding RLS

-- Enable RLS (if not already)
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "teams_read" ON public.teams;
DROP POLICY IF EXISTS "teams_insert" ON public.teams;
DROP POLICY IF EXISTS "teams_update" ON public.teams;
DROP POLICY IF EXISTS "team_leads_read" ON public.team_leads;
DROP POLICY IF EXISTS "team_leads_insert" ON public.team_leads;
DROP POLICY IF EXISTS "team_leads_update" ON public.team_leads;
DROP POLICY IF EXISTS "members_read" ON public.members;
DROP POLICY IF EXISTS "members_insert" ON public.members;
DROP POLICY IF EXISTS "members_update" ON public.members;

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

SELECT 'RLS policies updated!' as message;