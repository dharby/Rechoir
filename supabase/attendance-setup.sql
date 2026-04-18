-- Add event_type and event_id columns to support prayers, rehearsals, services
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS event_type TEXT; -- PRAYER, REHEARSAL, SERVICE
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS event_id UUID; -- references the event (prayer_chain, rehearsal, or service)

-- Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create prayer_sessions table for individual prayer events
CREATE TABLE IF NOT EXISTS public.prayer_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prayer_chain_id UUID REFERENCES public.prayer_chains(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for services" ON public.services;
CREATE POLICY "Allow all for services" ON public.services FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.prayer_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for prayer_sessions" ON public.prayer_sessions;
CREATE POLICY "Allow all for prayer_sessions" ON public.prayer_sessions FOR ALL USING (true) WITH CHECK (true);