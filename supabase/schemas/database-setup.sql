-- RECHOIR TNMIB Database

-- Create Types only if they don't exist
DO $$ 
BEGIN
  CREATE TYPE member_specialization AS ENUM ('SINGER', 'INSTRUMENTALIST', 'TEAM_LEAD', 'OFFICER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN CREATE TYPE prayer_chain_type AS ENUM ('CONTINUOUS', 'SCHEDULED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE prayer_chain_status AS ENUM ('ACTIVE', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE song_readiness_status AS ENUM ('NOT_STARTED', 'LEARNING', 'READY', 'PERFECT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE chat_room_type AS ENUM ('TEAM', 'GROUP', 'DIRECT'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE message_type AS ENUM ('TEXT', 'FILE', 'VOICE'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Create Tables (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.super_admins (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.teams (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, super_admin_id UUID REFERENCES public.super_admins(id) ON DELETE SET NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.team_leads (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, is_active BOOLEAN DEFAULT TRUE, team_id UUID UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE, access_code TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.team_members (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, email TEXT UNIQUE NOT NULL, access_code_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT, specialization member_specialization DEFAULT 'SINGER', is_active BOOLEAN DEFAULT TRUE, has_set_password BOOLEAN DEFAULT FALSE, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.prayer_chains (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name TEXT NOT NULL, description TEXT, type prayer_chain_type DEFAULT 'CONTINUOUS', start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.prayer_chain_assignments (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, chain_id UUID REFERENCES public.prayer_chains(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, scheduled_time TIMESTAMPTZ, status prayer_chain_status DEFAULT 'ACTIVE', created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(chain_id, member_id));
CREATE TABLE IF NOT EXISTS public.due_payments (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, title TEXT NOT NULL, amount DECIMAL(10,2) NOT NULL, due_date TIMESTAMPTZ NOT NULL, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.payment_records (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, payment_id UUID REFERENCES public.due_payments(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, is_paid BOOLEAN DEFAULT FALSE, paid_at TIMESTAMPTZ, proof_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(payment_id, member_id));
CREATE TABLE IF NOT EXISTS public.rehearsals (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, title TEXT NOT NULL, date DATE NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, location TEXT, agenda TEXT, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.attendance (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, status attendance_status DEFAULT 'ABSENT', arrival_time TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(rehearsal_id, member_id));
CREATE TABLE IF NOT EXISTS public.weekly_checklists (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, title TEXT NOT NULL, week_start_date DATE NOT NULL, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.checklist_items (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, checklist_id UUID REFERENCES public.weekly_checklists(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, description TEXT NOT NULL, is_completed BOOLEAN DEFAULT FALSE, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.uniform_events (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name TEXT NOT NULL, date DATE NOT NULL, description TEXT, image_url TEXT, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.uniform_readiness (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, event_id UUID REFERENCES public.uniform_events(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, is_ready BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(event_id, member_id));
CREATE TABLE IF NOT EXISTS public.songs (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, title TEXT NOT NULL, song_key TEXT, youtube_url TEXT, practice_notes TEXT, target_readiness_date DATE NOT NULL, team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.song_assignments (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL, member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL, status song_readiness_status DEFAULT 'NOT_STARTED', note TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(song_id, member_id));
CREATE TABLE IF NOT EXISTS public.chat_rooms (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, name TEXT NOT NULL, type chat_room_type DEFAULT 'TEAM', team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.chat_messages (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL, sender_id UUID NOT NULL, sender_type TEXT DEFAULT 'MEMBER', content TEXT NOT NULL, type message_type DEFAULT 'TEXT', file_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), read_at TIMESTAMPTZ);
CREATE TABLE IF NOT EXISTS public.notifications (id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, user_id UUID NOT NULL, user_type TEXT DEFAULT 'MEMBER', title TEXT NOT NULL, body TEXT, is_read BOOLEAN DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT NOW(), read_at TIMESTAMPTZ);

-- Enable RLS and Policies
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_chain_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rehearsals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uniform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uniform_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.super_admins;
DROP POLICY IF EXISTS "Allow all" ON public.teams;
DROP POLICY IF EXISTS "Allow all" ON public.team_leads;
DROP POLICY IF EXISTS "Allow all" ON public.team_members;
DROP POLICY IF EXISTS "Allow all" ON public.prayer_chains;
DROP POLICY IF EXISTS "Allow all" ON public.prayer_chain_assignments;
DROP POLICY IF EXISTS "Allow all" ON public.due_payments;
DROP POLICY IF EXISTS "Allow all" ON public.payment_records;
DROP POLICY IF EXISTS "Allow all" ON public.rehearsals;
DROP POLICY IF EXISTS "Allow all" ON public.attendance;
DROP POLICY IF EXISTS "Allow all" ON public.weekly_checklists;
DROP POLICY IF EXISTS "Allow all" ON public.checklist_items;
DROP POLICY IF EXISTS "Allow all" ON public.uniform_events;
DROP POLICY IF EXISTS "Allow all" ON public.uniform_readiness;
DROP POLICY IF EXISTS "Allow all" ON public.songs;
DROP POLICY IF EXISTS "Allow all" ON public.song_assignments;
DROP POLICY IF EXISTS "Allow all" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow all" ON public.chat_messages;
DROP POLICY IF EXISTS "Allow all" ON public.notifications;

CREATE POLICY "Allow all" ON public.super_admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.team_leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.team_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.prayer_chains FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.prayer_chain_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.due_payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.payment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.rehearsals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.weekly_checklists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.checklist_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.uniform_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.uniform_readiness FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.songs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.song_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.chat_rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

SELECT 'Database setup complete!' as message;