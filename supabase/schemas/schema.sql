-- RECHOIR TNMIB - Supabase Database Schema
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
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS team_leads CASCADE;
DROP TABLE IF EXISTS super_admins CASCADE;

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

-- SUPER ADMINS (Platform admins - RECHOIR)
CREATE TABLE public.super_admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (User profiles for authentication)
CREATE TABLE public.profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'MEMBER', -- SUPER_ADMIN, TEAM_LEAD, MEMBER
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAMS (Choir Organizations)
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  super_admin_id UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM LEADS (Organization Admins)
CREATE TABLE public.team_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  team_id UUID UNIQUE REFERENCES public.teams(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL,  -- The 6-digit code for members
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  access_code_hash TEXT NOT NULL,  -- Hash of team access code
  name TEXT NOT NULL,
  phone TEXT,
  specialization member_specialization DEFAULT 'SINGER',
  is_active BOOLEAN DEFAULT TRUE,
  has_set_password BOOLEAN DEFAULT FALSE,
  welcome_sent BOOLEAN DEFAULT FALSE,
  invite_token TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRAYER CHAINS
CREATE TABLE public.prayer_chains (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type prayer_chain_type DEFAULT 'CONTINUOUS',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  day_option TEXT,
  start_time TEXT,
  end_time TEXT,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRAYER CHAIN ASSIGNMENTS
CREATE TABLE public.prayer_chain_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chain_id UUID REFERENCES public.prayer_chains(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
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
  payment_type TEXT DEFAULT 'GENERAL',
  account_name TEXT,
  account_number TEXT,
  bank_name TEXT,
  recurrence TEXT, -- MONTHLY, WEEKLY, DAILY, ONCE
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENT RECORDS
CREATE TABLE public.payment_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id UUID REFERENCES public.due_payments(id) ON DELETE CASCADE NOT NULL,
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  proof_url TEXT,
  payment_proof TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
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
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
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
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
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
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
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
  member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
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
  sender_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'MEMBER',
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_leads_team ON public.team_leads(team_id);
CREATE INDEX idx_prayer_chains_team ON public.prayer_chains(team_id);
CREATE INDEX idx_prayer_chain_assignments_chain ON public.prayer_chain_assignments(chain_id);
CREATE INDEX idx_due_payments_team ON public.due_payments(team_id);
CREATE INDEX idx_payment_records_payment ON public.payment_records(payment_id);
CREATE INDEX idx_rehearsals_team ON public.rehearsals(team_id);
CREATE INDEX idx_rehearsals_date ON public.rehearsals(date);
CREATE INDEX idx_attendance_rehearsal ON public.attendance(rehearsal_id);
CREATE INDEX idx_checklist_items_checklist ON public.checklist_items(checklist_id);
CREATE INDEX idx_uniform_events_team ON public.uniform_events(team_id);
CREATE INDEX idx_songs_team ON public.songs(team_id);
CREATE INDEX idx_song_assignments_song ON public.song_assignments(song_id);
CREATE INDEX idx_chat_rooms_team ON public.chat_rooms(team_id);
CREATE INDEX idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(created_at);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);