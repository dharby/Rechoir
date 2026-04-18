-- RECHOIR Supabase Schema
-- Run this in your Supabase SQL Editor

-- Drop existing objects in reverse dependency order
DROP TABLE IF EXISTS member_access_codes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS song_assignments CASCADE;
DROP TABLE IF EXISTS songs CASCADE;
DROP TABLE IF EXISTS uniform_readiness CASCADE;
DROP TABLE IF EXISTS uniform_events CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS weekly_checklists CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS rehearsals CASCADE;
DROP TABLE IF EXISTS payment_records CASCADE;
DROP TABLE IF EXISTS due_payments CASCADE;
DROP TABLE IF EXISTS prayer_chain_assignments CASCADE;
DROP TABLE IF EXISTS prayer_chains CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Drop types
DROP TYPE IF EXISTS member_specialization CASCADE;
DROP TYPE IF EXISTS prayer_chain_type CASCADE;
DROP TYPE IF EXISTS prayer_chain_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS song_readiness_status CASCADE;
DROP TYPE IF EXISTS chat_room_type CASCADE;
DROP TYPE IF EXISTS message_type CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types matching your app
CREATE TYPE member_specialization AS ENUM ('SINGER', 'INSTRUMENTALIST', 'TEAM_LEAD', 'OFFICER');
CREATE TYPE prayer_chain_type AS ENUM ('CONTINUOUS', 'SCHEDULED');
CREATE TYPE prayer_chain_status AS ENUM ('ACTIVE', 'COMPLETED');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'EXCUSED');
CREATE TYPE song_readiness_status AS ENUM ('NOT_STARTED', 'LEARNING', 'READY', 'PERFECT');
CREATE TYPE chat_room_type AS ENUM ('TEAM', 'GROUP', 'DIRECT');
CREATE TYPE message_type AS ENUM ('TEXT', 'FILE', 'VOICE');

-- PROFILES (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('SUPER_ADMIN', 'TEAM_LEAD', 'MEMBER')) DEFAULT 'MEMBER',
  specialization member_specialization DEFAULT 'SINGER',
  team_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  has_set_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  super_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key to profiles (references teams table)
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

-- PRAYER CHAINS
CREATE TABLE public.prayer_chains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type prayer_chain_type DEFAULT 'CONTINUOUS',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRAYER CHAIN ASSIGNMENTS
CREATE TABLE public.prayer_chain_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chain_id UUID REFERENCES public.prayer_chains(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIMESTAMPTZ,
  status prayer_chain_status DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chain_id, member_id)
);

-- DUE PAYMENTS
CREATE TABLE public.due_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT RECORDS
CREATE TABLE public.payment_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id UUID REFERENCES public.due_payments(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(payment_id, member_id)
);

-- REHEARSALS
CREATE TABLE public.rehearsals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  agenda TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTENDANCE
CREATE TABLE public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rehearsal_id UUID REFERENCES public.rehearsals(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status attendance_status DEFAULT 'ABSENT',
  arrival_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rehearsal_id, member_id)
);

-- WEEKLY CHECKLISTS
CREATE TABLE public.weekly_checklists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHECKLIST ITEMS
CREATE TABLE public.checklist_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  checklist_id UUID REFERENCES public.weekly_checklists(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIFORM EVENTS
CREATE TABLE public.uniform_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  image_url TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIFORM READINESS
CREATE TABLE public.uniform_readiness (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.uniform_events(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_ready BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id)
);

-- SONGS
CREATE TABLE public.songs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  song_key TEXT,
  youtube_url TEXT,
  practice_notes TEXT,
  target_readiness_date DATE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SONG ASSIGNMENTS
CREATE TABLE public.song_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_id UUID REFERENCES public.songs(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status song_readiness_status DEFAULT 'NOT_STARTED',
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(song_id, member_id)
);

-- CHAT ROOMS
CREATE TABLE public.chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  type chat_room_type DEFAULT 'TEAM',
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT DEFAULT 'MEMBER',
  content TEXT NOT NULL,
  type message_type DEFAULT 'TEXT',
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Access code storage (separate from auth for members)
CREATE TABLE public.member_access_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  access_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.member_access_codes ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's team_id
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT team_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is team lead
CREATE OR REPLACE FUNCTION is_team_lead()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'TEAM_LEAD';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Team leads can view all team members
CREATE POLICY "Team leads can view team members"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('TEAM_LEAD', 'SUPER_ADMIN')
    AND team_id = get_user_team_id()
  );

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (is_super_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Team leads can update team members
CREATE POLICY "Team leads can update team members"
  ON public.profiles FOR UPDATE
  USING (
    is_team_lead()
    AND team_id = get_user_team_id()
  );

-- ============================================
-- TEAMS POLICIES
-- ============================================

-- Anyone on team can view their team
CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (id = get_user_team_id());

-- Super admins can view all teams
CREATE POLICY "Super admins can view all teams"
  ON public.teams FOR SELECT
  USING (is_super_admin());

-- Super admins can create teams
CREATE POLICY "Super admins can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (is_super_admin());

-- Super admins can update teams
CREATE POLICY "Super admins can update teams"
  ON public.teams FOR UPDATE
  USING (is_super_admin());

-- ============================================
-- Module-specific policies (team-scoped)
-- ============================================

-- All modules use same pattern: team lead OR super admin OR own record

-- PRAYER CHAINS
CREATE POLICY "Team members can view prayer chains"
  ON public.prayer_chains FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage prayer chains"
  ON public.prayer_chains FOR ALL
  USING (
    is_team_lead() AND team_id = get_user_team_id()
  );

-- PRAYER CHAIN ASSIGNMENTS
CREATE POLICY "Prayer chain assignments access"
  ON public.prayer_chain_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.prayer_chains pc
      WHERE pc.id = chain_id AND pc.team_id = get_user_team_id()
    )
  );

-- DUE PAYMENTS
CREATE POLICY "Team members can view payments"
  ON public.due_payments FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage payments"
  ON public.due_payments FOR ALL
  USING (is_team_lead() AND team_id = get_user_team_id());

-- PAYMENT RECORDS
CREATE POLICY "Payment records access"
  ON public.payment_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.due_payments dp
      WHERE dp.id = payment_id AND dp.team_id = get_user_team_id()
    )
  );

-- REHEARSALS
CREATE POLICY "Team members can view rehearsals"
  ON public.rehearsals FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage rehearsals"
  ON public.rehearsals FOR ALL
  USING (is_team_lead() AND team_id = get_user_team_id());

-- ATTENDANCE
CREATE POLICY "Attendance access"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rehearsals r
      WHERE r.id = rehearsal_id AND r.team_id = get_user_team_id()
    )
  );

-- WEEKLY CHECKLISTS
CREATE POLICY "Team members can view checklists"
  ON public.weekly_checklists FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage checklists"
  ON public.weekly_checklists FOR ALL
  USING (is_team_lead() AND team_id = get_user_team_id());

-- CHECKLIST ITEMS
CREATE POLICY "Checklist items access"
  ON public.checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.weekly_checklists wc
      WHERE wc.id = checklist_id AND wc.team_id = get_user_team_id()
    )
  );

-- UNIFORM EVENTS
CREATE POLICY "Team members can view uniform events"
  ON public.uniform_events FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage uniform events"
  ON public.uniform_events FOR ALL
  USING (is_team_lead() AND team_id = get_user_team_id());

-- UNIFORM READINESS
CREATE POLICY "Uniform readiness access"
  ON public.uniform_readiness FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.uniform_events ue
      WHERE ue.id = event_id AND ue.team_id = get_user_team_id()
    )
  );

-- SONGS
CREATE POLICY "Team members can view songs"
  ON public.songs FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can manage songs"
  ON public.songs FOR ALL
  USING (is_team_lead() AND team_id = get_user_team_id());

-- SONG ASSIGNMENTS
CREATE POLICY "Song assignments access"
  ON public.song_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.songs s
      WHERE s.id = song_id AND s.team_id = get_user_team_id()
    )
  );

-- CHAT ROOMS
CREATE POLICY "Team members can view chat rooms"
  ON public.chat_rooms FOR SELECT
  USING (team_id = get_user_team_id());

CREATE POLICY "Team leads can create chat rooms"
  ON public.chat_rooms FOR INSERT
  WITH CHECK (is_team_lead() AND team_id = get_user_team_id());

-- CHAT MESSAGES
CREATE POLICY "Chat messages access"
  ON public.chat_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = room_id AND cr.team_id = get_user_team_id()
    )
  );

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- MEMBER ACCESS CODES
CREATE POLICY "Access codes for team lead"
  ON public.member_access_codes FOR ALL
  USING (is_team_lead());

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;