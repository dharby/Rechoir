-- RECHOIR TNMIB - Additional Features Schema
-- Run this in your Supabase SQL Editor

-- 1. Add payment_type column to due_payments
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'GENERAL';
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS recurrence TEXT; -- MONTHLY, WEEKLY, DAILY, ONCE
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- 2. Update payment_records for partial payments
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS payment_proof TEXT;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Add prayer_chain enhanced fields
ALTER TABLE public.prayer_chains ADD COLUMN IF NOT EXISTS day_option TEXT; -- EVERYDAY, MONDAY, TUESDAY, etc.
ALTER TABLE public.prayer_chains ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE public.prayer_chains ADD COLUMN IF NOT EXISTS end_time TEXT;

-- 4. Update notifications for broadcasts
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_broadcast BOOLEAN DEFAULT FALSE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'; -- normal, urgent

-- 5. Add attendance tracking
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS punctuality_score INTEGER DEFAULT 0;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS sign_in_time TIMESTAMPTZ;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;

-- 6. Add members pending_welcome flag
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS invite_token TEXT;

-- 7. Payment verification view
CREATE OR REPLACE VIEW public.payment_verification AS
SELECT 
  pr.id,
  pr.payment_id,
  pr.member_id,
  pr.is_paid,
  pr.paid_at,
  pr.proof_url as payment_proof,
  pr.verified_by,
  pr.verified_at,
  tm.name as member_name,
  tm.email as member_email,
  dp.title as payment_title,
  dp.amount,
  dp.account_name,
  dp.account_number,
  dp.bank_name
FROM public.payment_records pr
JOIN public.team_members tm ON pr.member_id = tm.id
JOIN public.due_payments dp ON pr.payment_id = dp.id;

-- 8. Function to verify payment
CREATE OR REPLACE FUNCTION public.verify_payment(payment_record_id UUID, verifier_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.payment_records 
  SET is_paid = TRUE, 
      paid_at = NOW(), 
      verified_by = verifier_id, 
      verified_at = NOW()
  WHERE id = payment_record_id;
END $$;

-- 9. Function to send welcome to new members
CREATE OR REPLACE FUNCTION public.send_welcome_email(member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  member_record RECORD;
  team_record RECORD;
  access_code_val TEXT;
BEGIN
  -- Get member details
  SELECT * INTO member_record FROM public.team_members WHERE id = member_id;
  
  -- Get team access code
  SELECT access_code INTO access_code_val FROM public.team_leads WHERE team_id = member_record.team_id;
  
  -- Update welcome sent flag
  UPDATE public.team_members SET welcome_sent = TRUE WHERE id = member_id;
  
  -- Note: Email sending would be handled by Edge Function or external service
  -- This just marks the welcome as sent
END $$;

-- 10. Function to create broadcast notification
CREATE OR REPLACE FUNCTION public.send_broadcast(team_id_val UUID, title_val TEXT, body_val TEXT, sender_id_val UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, user_type, title, body, is_broadcast, priority, created_at)
  SELECT id, 'MEMBER', title_val, body_val, TRUE, 'urgent', NOW()
  FROM public.team_members 
  WHERE team_id = team_id_val AND is_active = TRUE;
END $$;

SELECT 'Additional features schema applied successfully!' as message;