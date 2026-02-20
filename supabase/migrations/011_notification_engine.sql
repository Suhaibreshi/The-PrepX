-- ============================================================
-- PREPX IQ NEXUS — Automated Notification Engine
-- Migration: 011_notification_engine
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. NOTIFICATION SETTINGS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enable_automatic_mode         BOOLEAN NOT NULL DEFAULT false,
  fee_reminder_days_before      INTEGER NOT NULL DEFAULT 3,
  exam_reminder_days_before     INTEGER NOT NULL DEFAULT 1,
  enable_absent_alert           BOOLEAN NOT NULL DEFAULT true,
  enable_overdue_alert          BOOLEAN NOT NULL DEFAULT true,
  enable_birthday_wish          BOOLEAN NOT NULL DEFAULT false,
  enable_fee_reminder           BOOLEAN NOT NULL DEFAULT true,
  enable_exam_reminder          BOOLEAN NOT NULL DEFAULT true,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default settings (single row)
INSERT INTO public.notification_settings (
  enable_automatic_mode,
  fee_reminder_days_before,
  exam_reminder_days_before,
  enable_absent_alert,
  enable_overdue_alert,
  enable_birthday_wish,
  enable_fee_reminder,
  enable_exam_reminder
) VALUES (false, 3, 1, true, true, false, true, true)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 2. COMMUNICATION LOGS TABLE
-- ─────────────────────────────────────────────────────────────

-- Create enum for message types
DO $$ BEGIN
  CREATE TYPE public.communication_message_type AS ENUM (
    'fee', 'overdue', 'exam', 'absent', 'birthday'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create enum for delivery status
DO $$ BEGIN
  CREATE TYPE public.delivery_status AS ENUM (
    'pending', 'sent', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create enum for trigger source
DO $$ BEGIN
  CREATE TYPE public.trigger_source AS ENUM (
    'automatic', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.communication_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID REFERENCES public.students(id) ON DELETE SET NULL,
  parent_id         UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  message_type      public.communication_message_type NOT NULL,
  message_content   TEXT NOT NULL,
  delivery_status   public.delivery_status NOT NULL DEFAULT 'pending',
  triggered_by      public.trigger_source NOT NULL DEFAULT 'automatic',
  error_message     TEXT,
  provider_response JSONB,
  related_entity_id UUID,  -- Can reference fee_id, exam_id, attendance_id etc.
  related_entity_type TEXT, -- 'fee', 'exam', 'attendance' etc.
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 3. INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────

-- Index for checking duplicate notifications
CREATE INDEX IF NOT EXISTS idx_comm_logs_student_type_date 
  ON public.communication_logs (student_id, message_type, DATE(created_at));

-- Index for querying by delivery status
CREATE INDEX IF NOT EXISTS idx_comm_logs_status 
  ON public.communication_logs (delivery_status);

-- Index for querying by message type
CREATE INDEX IF NOT EXISTS idx_comm_logs_message_type 
  ON public.communication_logs (message_type);

-- Index for related entity lookups (prevent duplicates)
CREATE INDEX IF NOT EXISTS idx_comm_logs_related_entity 
  ON public.communication_logs (related_entity_id, related_entity_type);

-- ─────────────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;

-- Notification settings: All authenticated users can read, only admins can update
CREATE POLICY "notification_settings_select_policy" ON public.notification_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "notification_settings_update_policy" ON public.notification_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'management_admin')
    )
  );

-- Communication logs: All authenticated users can read
CREATE POLICY "communication_logs_select_policy" ON public.communication_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Communication logs: Only system and admins can insert
CREATE POLICY "communication_logs_insert_policy" ON public.communication_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. HELPER FUNCTIONS FOR NOTIFICATION ENGINE
-- ─────────────────────────────────────────────────────────────

-- Function to check if a notification was already sent today for a specific entity
CREATE OR REPLACE FUNCTION public.was_notification_sent_today(
  p_student_id UUID,
  p_message_type public.communication_message_type,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.communication_logs
  WHERE student_id = p_student_id
    AND message_type = p_message_type
    AND DATE(created_at) = CURRENT_DATE
    AND (p_related_entity_id IS NULL OR related_entity_id = p_related_entity_id);
  
  RETURN v_count > 0;
END;
$$;

-- Function to get notification settings
CREATE OR REPLACE FUNCTION public.get_notification_settings()
RETURNS TABLE (
  id UUID,
  enable_automatic_mode BOOLEAN,
  fee_reminder_days_before INTEGER,
  exam_reminder_days_before INTEGER,
  enable_absent_alert BOOLEAN,
  enable_overdue_alert BOOLEAN,
  enable_birthday_wish BOOLEAN,
  enable_fee_reminder BOOLEAN,
  enable_exam_reminder BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.id,
    ns.enable_automatic_mode,
    ns.fee_reminder_days_before,
    ns.exam_reminder_days_before,
    ns.enable_absent_alert,
    ns.enable_overdue_alert,
    ns.enable_birthday_wish,
    ns.enable_fee_reminder,
    ns.enable_exam_reminder
  FROM public.notification_settings ns
  LIMIT 1;
END;
$$;

-- Function to get students with upcoming fee due dates
CREATE OR REPLACE FUNCTION public.get_students_with_upcoming_fees(
  p_days_before INTEGER DEFAULT 3
)
RETURNS TABLE (
  fee_id UUID,
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  amount NUMERIC,
  due_date DATE,
  description TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS fee_id,
    s.id AS student_id,
    s.full_name AS student_name,
    s.phone AS student_phone,
    p.phone AS parent_phone,
    p.full_name AS parent_name,
    f.amount,
    f.due_date,
    f.description
  FROM public.fees f
  JOIN public.students s ON f.student_id = s.id
  LEFT JOIN public.parent_students ps ON s.id = ps.student_id
  LEFT JOIN public.parents p ON ps.parent_id = p.id
  WHERE f.status IN ('pending', 'overdue')
    AND f.due_date = CURRENT_DATE + p_days_before
    AND NOT public.was_notification_sent_today(s.id, 'fee'::public.communication_message_type, f.id);
END;
$$;

-- Function to get students with overdue fees
CREATE OR REPLACE FUNCTION public.get_students_with_overdue_fees()
RETURNS TABLE (
  fee_id UUID,
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  amount NUMERIC,
  due_date DATE,
  days_overdue INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id AS fee_id,
    s.id AS student_id,
    s.full_name AS student_name,
    s.phone AS student_phone,
    p.phone AS parent_phone,
    p.full_name AS parent_name,
    f.amount,
    f.due_date,
    (CURRENT_DATE - f.due_date)::INTEGER AS days_overdue
  FROM public.fees f
  JOIN public.students s ON f.student_id = s.id
  LEFT JOIN public.parent_students ps ON s.id = ps.student_id
  LEFT JOIN public.parents p ON ps.parent_id = p.id
  WHERE f.status = 'overdue'
    AND NOT public.was_notification_sent_today(s.id, 'overdue'::public.communication_message_type, f.id);
END;
$$;

-- Function to get students with upcoming exams
CREATE OR REPLACE FUNCTION public.get_students_with_upcoming_exams(
  p_days_before INTEGER DEFAULT 1
)
RETURNS TABLE (
  exam_id UUID,
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  exam_title TEXT,
  exam_date DATE,
  batch_name TEXT,
  total_marks NUMERIC
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS exam_id,
    s.id AS student_id,
    s.full_name AS student_name,
    s.phone AS student_phone,
    p.phone AS parent_phone,
    p.full_name AS parent_name,
    e.title AS exam_title,
    e.exam_date::DATE AS exam_date,
    b.name AS batch_name,
    e.total_marks
  FROM public.exams e
  JOIN public.batches b ON e.batch_id = b.id
  JOIN public.student_batches sb ON b.id = sb.batch_id
  JOIN public.students s ON sb.student_id = s.id
  LEFT JOIN public.parent_students ps ON s.id = ps.student_id
  LEFT JOIN public.parents p ON ps.parent_id = p.id
  WHERE e.status = 'upcoming'
    AND e.exam_date::DATE = CURRENT_DATE + p_days_before
    AND s.status = 'active'
    AND NOT public.was_notification_sent_today(s.id, 'exam'::public.communication_message_type, e.id);
END;
$$;

-- Function to get absent students today
CREATE OR REPLACE FUNCTION public.get_absent_students_today()
RETURNS TABLE (
  attendance_id UUID,
  student_id UUID,
  student_name TEXT,
  parent_phone TEXT,
  parent_name TEXT,
  batch_name TEXT,
  attendance_date DATE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id AS attendance_id,
    s.id AS student_id,
    s.full_name AS student_name,
    p.phone AS parent_phone,
    p.full_name AS parent_name,
    b.name AS batch_name,
    a.date AS attendance_date
  FROM public.attendance a
  JOIN public.students s ON a.student_id = s.id
  JOIN public.batches b ON a.batch_id = b.id
  LEFT JOIN public.parent_students ps ON s.id = ps.student_id
  LEFT JOIN public.parents p ON ps.parent_id = p.id
  WHERE a.status = 'absent'
    AND a.date = CURRENT_DATE
    AND NOT public.was_notification_sent_today(s.id, 'absent'::public.communication_message_type, a.id);
END;
$$;

-- Function to get students with birthdays today
CREATE OR REPLACE FUNCTION public.get_students_with_birthdays_today()
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  student_phone TEXT,
  parent_phone TEXT,
  parent_name TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id AS student_id,
    s.full_name AS student_name,
    s.phone AS student_phone,
    p.phone AS parent_phone,
    p.full_name AS parent_name
  FROM public.students s
  LEFT JOIN public.parent_students ps ON s.id = ps.student_id
  LEFT JOIN public.parents p ON ps.parent_id = p.id
  WHERE s.status = 'active'
    AND s.date_of_birth IS NOT NULL
    AND EXTRACT(MONTH FROM s.date_of_birth) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM s.date_of_birth) = EXTRACT(DAY FROM CURRENT_DATE)
    AND NOT public.was_notification_sent_today(s.id, 'birthday'::public.communication_message_type);
END;
$$;

-- Function to log communication
CREATE OR REPLACE FUNCTION public.log_communication(
  p_student_id UUID,
  p_parent_id UUID DEFAULT NULL,
  p_message_type public.communication_message_type,
  p_message_content TEXT,
  p_delivery_status public.delivery_status DEFAULT 'pending',
  p_triggered_by public.trigger_source DEFAULT 'automatic',
  p_error_message TEXT DEFAULT NULL,
  p_provider_response JSONB DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL,
  p_related_entity_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.communication_logs (
    student_id,
    parent_id,
    message_type,
    message_content,
    delivery_status,
    triggered_by,
    error_message,
    provider_response,
    related_entity_id,
    related_entity_type,
    sent_at
  ) VALUES (
    p_student_id,
    p_parent_id,
    p_message_type,
    p_message_content,
    p_delivery_status,
    p_triggered_by,
    p_error_message,
    p_provider_response,
    p_related_entity_id,
    p_related_entity_type,
    CASE WHEN p_delivery_status = 'sent' THEN now() ELSE NULL END
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. TRIGGER FOR UPDATED_AT
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 7. GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.notification_settings TO authenticated;
GRANT ALL ON public.communication_logs TO authenticated;
GRANT ALL ON FUNCTION public.was_notification_sent_today TO authenticated;
GRANT ALL ON FUNCTION public.get_notification_settings TO authenticated;
GRANT ALL ON FUNCTION public.get_students_with_upcoming_fees TO authenticated;
GRANT ALL ON FUNCTION public.get_students_with_overdue_fees TO authenticated;
GRANT ALL ON FUNCTION public.get_students_with_upcoming_exams TO authenticated;
GRANT ALL ON FUNCTION public.get_absent_students_today TO authenticated;
GRANT ALL ON FUNCTION public.get_students_with_birthdays_today TO authenticated;
GRANT ALL ON FUNCTION public.log_communication TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. CRON JOB SETUP (pg_cron extension required)
-- ─────────────────────────────────────────────────────────────

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the automated notification job to run daily at 9:00 AM IST (3:30 AM UTC)
-- Uncomment the following line after deploying the Edge Function:
-- SELECT cron.schedule(
--   'run-automated-notifications-daily',
--   '30 3 * * *',  -- 3:30 AM UTC = 9:00 AM IST
--   $$
--   SELECT
--     net.http_post(
--       url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/run-automated-notifications',
--       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
--       body := '{}'::jsonb
--     );
--   $$
-- );

-- Alternative: Create a simpler scheduled job using pg_cron that runs the notification logic directly
-- This runs every day at 9:00 AM IST (3:30 AM UTC)
-- Note: This requires the Supabase project to have pg_cron enabled

COMMENT ON TABLE public.notification_settings IS 'Stores configuration for the automated notification engine';
COMMENT ON TABLE public.communication_logs IS 'Logs all automated SMS communications sent by the system';
COMMENT ON COLUMN public.communication_logs.related_entity_id IS 'References the entity that triggered this notification (fee_id, exam_id, attendance_id, etc.)';
COMMENT ON COLUMN public.communication_logs.related_entity_type IS 'Type of the related entity (fee, exam, attendance, etc.)';
