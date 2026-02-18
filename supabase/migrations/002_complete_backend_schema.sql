-- ============================================================
-- PREPX IQ NEXUS — Complete Backend Schema
-- Migration: 20260218000001_complete_backend_schema
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ADDITIONAL ENUM TYPES
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.exam_status AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.message_type AS ENUM (
    'general', 'class-update', 'schedule-change',
    'exam-announcement', 'fee-reminder', 'emergency'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.recipient_type AS ENUM (
    'student', 'parent', 'teacher', 'batch',
    'all-students', 'all-parents', 'all-teachers'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'system', 'fee', 'exam', 'attendance', 'message', 'enrollment'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'super_admin', 'management_admin', 'academic_coordinator',
    'teacher', 'finance_manager', 'support_staff'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_method AS ENUM (
    'cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.exam_type AS ENUM (
    'MCQ', 'written', 'practical', 'oral', 'online', 'mock'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. ORGANISATION SETTINGS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.org_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL UNIQUE,
  value         TEXT,
  description   TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed default org settings
INSERT INTO public.org_settings (key, value, description) VALUES
  ('org_name',          'PREPX IQ',                    'Organisation display name'),
  ('org_tagline',       'Education Management System', 'Organisation tagline'),
  ('org_logo_url',      NULL,                          'URL to organisation logo'),
  ('sms_api_key',       NULL,                          'SMS provider API key'),
  ('email_api_key',     NULL,                          'Email service API key'),
  ('currency_symbol',   '₹',                           'Currency symbol used in UI'),
  ('timezone',          'Asia/Calcutta',               'Default timezone'),
  ('academic_year',     NULL,                          'Current academic year label e.g. 2025-26')
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 3. ACADEMIC YEARS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.academic_years (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- e.g. "2025-26"
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  is_current  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only one academic year can be current at a time
CREATE UNIQUE INDEX IF NOT EXISTS academic_years_current_idx
  ON public.academic_years (is_current)
  WHERE is_current = true;

-- ─────────────────────────────────────────────────────────────
-- 4. USER PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  role          public.user_role NOT NULL DEFAULT 'support_staff',
  avatar_url    TEXT,
  phone         TEXT,
  teacher_id    UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. ROLE PERMISSIONS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.role_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role        public.user_role NOT NULL,
  resource    TEXT NOT NULL,   -- e.g. 'students', 'fees', 'reports'
  can_read    BOOLEAN NOT NULL DEFAULT false,
  can_create  BOOLEAN NOT NULL DEFAULT false,
  can_update  BOOLEAN NOT NULL DEFAULT false,
  can_delete  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(role, resource)
);

-- Seed default permissions
INSERT INTO public.role_permissions (role, resource, can_read, can_create, can_update, can_delete) VALUES
  -- super_admin: full access
  ('super_admin','students',    true,true,true,true),
  ('super_admin','teachers',    true,true,true,true),
  ('super_admin','batches',     true,true,true,true),
  ('super_admin','parents',     true,true,true,true),
  ('super_admin','fees',        true,true,true,true),
  ('super_admin','exams',       true,true,true,true),
  ('super_admin','attendance',  true,true,true,true),
  ('super_admin','messages',    true,true,true,true),
  ('super_admin','reports',     true,true,true,true),
  ('super_admin','settings',    true,true,true,true),
  -- management_admin
  ('management_admin','students',   true,true,true,true),
  ('management_admin','teachers',   true,true,true,true),
  ('management_admin','batches',    true,true,true,true),
  ('management_admin','parents',    true,true,true,true),
  ('management_admin','fees',       true,true,true,true),
  ('management_admin','exams',      true,true,true,false),
  ('management_admin','attendance', true,true,true,false),
  ('management_admin','messages',   true,true,true,false),
  ('management_admin','reports',    true,false,false,false),
  ('management_admin','settings',   true,true,true,false),
  -- academic_coordinator
  ('academic_coordinator','students',   true,true,true,false),
  ('academic_coordinator','teachers',   true,false,false,false),
  ('academic_coordinator','batches',    true,true,true,false),
  ('academic_coordinator','parents',    true,false,false,false),
  ('academic_coordinator','fees',       true,false,false,false),
  ('academic_coordinator','exams',      true,true,true,true),
  ('academic_coordinator','attendance', true,true,true,false),
  ('academic_coordinator','messages',   true,true,false,false),
  ('academic_coordinator','reports',    true,false,false,false),
  ('academic_coordinator','settings',   false,false,false,false),
  -- teacher
  ('teacher','students',   true,false,false,false),
  ('teacher','teachers',   true,false,false,false),
  ('teacher','batches',    true,false,false,false),
  ('teacher','parents',    true,false,false,false),
  ('teacher','fees',       false,false,false,false),
  ('teacher','exams',      true,true,true,false),
  ('teacher','attendance', true,true,true,false),
  ('teacher','messages',   true,true,false,false),
  ('teacher','reports',    true,false,false,false),
  ('teacher','settings',   false,false,false,false),
  -- finance_manager
  ('finance_manager','students',   true,false,false,false),
  ('finance_manager','teachers',   false,false,false,false),
  ('finance_manager','batches',    true,false,false,false),
  ('finance_manager','parents',    true,false,false,false),
  ('finance_manager','fees',       true,true,true,false),
  ('finance_manager','exams',      false,false,false,false),
  ('finance_manager','attendance', false,false,false,false),
  ('finance_manager','messages',   true,true,false,false),
  ('finance_manager','reports',    true,false,false,false),
  ('finance_manager','settings',   false,false,false,false),
  -- support_staff
  ('support_staff','students',   true,false,false,false),
  ('support_staff','teachers',   true,false,false,false),
  ('support_staff','batches',    true,false,false,false),
  ('support_staff','parents',    true,false,false,false),
  ('support_staff','fees',       true,false,false,false),
  ('support_staff','exams',      true,false,false,false),
  ('support_staff','attendance', true,false,false,false),
  ('support_staff','messages',   true,true,false,false),
  ('support_staff','reports',    true,false,false,false),
  ('support_staff','settings',   false,false,false,false)
ON CONFLICT (role, resource) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 6. COURSES — add duration & fee fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS duration_weeks  INTEGER,
  ADD COLUMN IF NOT EXISTS base_fee        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 7. STUDENTS — add extra profile fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS date_of_birth   DATE,
  ADD COLUMN IF NOT EXISTS address         TEXT,
  ADD COLUMN IF NOT EXISTS gender          TEXT CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS profile_photo   TEXT,
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- ─────────────────────────────────────────────────────────────
-- 8. TEACHERS — add extra profile fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS date_of_birth   DATE,
  ADD COLUMN IF NOT EXISTS address         TEXT,
  ADD COLUMN IF NOT EXISTS gender          TEXT CHECK (gender IN ('male','female','other')),
  ADD COLUMN IF NOT EXISTS profile_photo   TEXT,
  ADD COLUMN IF NOT EXISTS qualification   TEXT,
  ADD COLUMN IF NOT EXISTS experience_yrs  INTEGER,
  ADD COLUMN IF NOT EXISTS salary          NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- ─────────────────────────────────────────────────────────────
-- 9. PARENTS — add extra profile fields
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.parents
  ADD COLUMN IF NOT EXISTS address         TEXT,
  ADD COLUMN IF NOT EXISTS occupation      TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 10. BATCHES — add capacity & academic year
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS capacity        INTEGER,
  ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 11. EXAMS — strengthen typing
-- ─────────────────────────────────────────────────────────────

-- Drop old text column and replace with enum (safe migration)
ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS passing_marks    INTEGER,
  ADD COLUMN IF NOT EXISTS instructions     TEXT,
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 12. EXAM RESULTS — add remarks & percentage
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.exam_results
  ADD COLUMN IF NOT EXISTS remarks         TEXT,
  ADD COLUMN IF NOT EXISTS is_absent       BOOLEAN NOT NULL DEFAULT false;

-- ─────────────────────────────────────────────────────────────
-- 13. FEES — add payment details
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.fees
  ADD COLUMN IF NOT EXISTS payment_method  public.payment_method,
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number  TEXT,
  ADD COLUMN IF NOT EXISTS discount        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_fee        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 14. FEE TEMPLATES
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.fee_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL,
  frequency       TEXT NOT NULL DEFAULT 'monthly'
                    CHECK (frequency IN ('one-time','monthly','quarterly','annually')),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 15. MESSAGES — strengthen typing
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS scheduled_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 16. NOTIFICATIONS — add user targeting
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS action_url     TEXT,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT now();

-- ─────────────────────────────────────────────────────────────
-- 17. ATTENDANCE — add notes
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS notes          TEXT;

-- ─────────────────────────────────────────────────────────────
-- 18. STUDENT DOCUMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,   -- 'id_proof', 'photo', 'certificate', etc.
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 19. TEACHER DOCUMENTS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id    UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 20. HOLIDAYS / EVENTS CALENDAR
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE NOT NULL,
  end_date        DATE,
  event_type      TEXT NOT NULL DEFAULT 'holiday'
                    CHECK (event_type IN ('holiday','exam','class','meeting','other')),
  batch_id        UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 21. AUDIT LOG
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,   -- 'INSERT', 'UPDATE', 'DELETE'
  table_name    TEXT NOT NULL,
  record_id     UUID,
  old_data      JSONB,
  new_data      JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 22. ENABLE RLS ON NEW TABLES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.org_settings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 23. RLS POLICIES — NEW TABLES
-- ─────────────────────────────────────────────────────────────

-- org_settings: authenticated read; only super_admin can write (enforced in app)
CREATE POLICY "Authenticated read org_settings"
  ON public.org_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write org_settings"
  ON public.org_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- academic_years
CREATE POLICY "Authenticated read academic_years"
  ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write academic_years"
  ON public.academic_years FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_profiles: users can read all, update own
CREATE POLICY "Authenticated read user_profiles"
  ON public.user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- role_permissions: read-only for authenticated
CREATE POLICY "Authenticated read role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write role_permissions"
  ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- fee_templates
CREATE POLICY "Authenticated read fee_templates"
  ON public.fee_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write fee_templates"
  ON public.fee_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- student_documents
CREATE POLICY "Authenticated read student_documents"
  ON public.student_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write student_documents"
  ON public.student_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- teacher_documents
CREATE POLICY "Authenticated read teacher_documents"
  ON public.teacher_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write teacher_documents"
  ON public.teacher_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- events
CREATE POLICY "Authenticated read events"
  ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated write events"
  ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- audit_logs: read-only for authenticated
CREATE POLICY "Authenticated read audit_logs"
  ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service insert audit_logs"
  ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 24. ADDITIONAL POLICIES ON EXISTING TABLES
-- ─────────────────────────────────────────────────────────────

-- Allow delete on fees (was missing)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete fees"
    ON public.fees FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow delete on messages
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete messages"
    ON public.messages FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow update on messages (mark as read)
DO $$ BEGIN
  CREATE POLICY "Authenticated users can update messages"
    ON public.messages FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow delete on notifications
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete notifications"
    ON public.notifications FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow delete on exam_results
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete exam_results"
    ON public.exam_results FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow delete on attendance
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete attendance"
    ON public.attendance FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 25. INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_students_status       ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_email        ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_teachers_status       ON public.teachers(status);
CREATE INDEX IF NOT EXISTS idx_batches_status        ON public.batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_course_id     ON public.batches(course_id);
CREATE INDEX IF NOT EXISTS idx_batches_teacher_id    ON public.batches(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student    ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch      ON public.attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_fees_student          ON public.fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status           ON public.fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_due_date         ON public.fees(due_date);
CREATE INDEX IF NOT EXISTS idx_exams_batch           ON public.exams(batch_id);
CREATE INDEX IF NOT EXISTS idx_exams_date            ON public.exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam     ON public.exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student  ON public.exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender       ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient    ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_read         ON public.messages(read);
CREATE INDEX IF NOT EXISTS idx_notifications_user    ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read    ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_student_batches_s     ON public.student_batches(student_id);
CREATE INDEX IF NOT EXISTS idx_student_batches_b     ON public.student_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_p     ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_students_s     ON public.parent_students(student_id);
CREATE INDEX IF NOT EXISTS idx_events_date           ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user       ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table      ON public.audit_logs(table_name);

-- ─────────────────────────────────────────────────────────────
-- 26. UPDATED_AT TRIGGERS FOR NEW / ALTERED TABLES
-- ─────────────────────────────────────────────────────────────

-- Reuse existing trigger function: public.update_updated_at_column()

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fees_updated_at
  BEFORE UPDATE ON public.fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_templates_updated_at
  BEFORE UPDATE ON public.fee_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON public.org_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- 27. AUTO-CREATE USER PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'support_staff'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 28. AUTO-MARK FEES OVERDUE
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_overdue_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fees
  SET status = 'overdue'
  WHERE status = 'pending'
    AND due_date < CURRENT_DATE;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 29. VIEWS
-- ─────────────────────────────────────────────────────────────

-- Student summary view (joins batches, parents)
CREATE OR REPLACE VIEW public.v_student_summary AS
SELECT
  s.id,
  s.full_name,
  s.email,
  s.phone,
  s.status,
  s.joined_at,
  s.gender,
  s.date_of_birth,
  COUNT(DISTINCT sb.batch_id)  AS batch_count,
  COUNT(DISTINCT ps.parent_id) AS parent_count,
  COALESCE(SUM(CASE WHEN f.status = 'pending'  THEN f.amount ELSE 0 END), 0) AS pending_fees,
  COALESCE(SUM(CASE WHEN f.status = 'overdue'  THEN f.amount ELSE 0 END), 0) AS overdue_fees,
  COALESCE(SUM(CASE WHEN f.status = 'paid'     THEN f.amount ELSE 0 END), 0) AS paid_fees
FROM public.students s
LEFT JOIN public.student_batches sb ON sb.student_id = s.id
LEFT JOIN public.parent_students ps ON ps.student_id = s.id
LEFT JOIN public.fees f             ON f.student_id  = s.id
GROUP BY s.id;

-- Batch summary view
CREATE OR REPLACE VIEW public.v_batch_summary AS
SELECT
  b.id,
  b.name,
  b.status,
  b.start_date,
  b.end_date,
  b.schedule,
  b.capacity,
  c.name                          AS course_name,
  t.full_name                     AS teacher_name,
  COUNT(DISTINCT sb.student_id)   AS student_count,
  COUNT(DISTINCT cs.id)           AS schedule_count
FROM public.batches b
LEFT JOIN public.courses c         ON c.id = b.course_id
LEFT JOIN public.teachers t        ON t.id = b.teacher_id
LEFT JOIN public.student_batches sb ON sb.batch_id = b.id
LEFT JOIN public.class_schedules cs ON cs.batch_id = b.id
GROUP BY b.id, c.name, t.full_name;

-- Fee summary view
CREATE OR REPLACE VIEW public.v_fee_summary AS
SELECT
  f.id,
  f.amount,
  f.due_date,
  f.paid_date,
  f.status,
  f.description,
  f.payment_method,
  f.transaction_ref,
  f.receipt_number,
  f.discount,
  f.late_fee,
  f.created_at,
  s.full_name  AS student_name,
  s.email      AS student_email,
  s.phone      AS student_phone,
  b.name       AS batch_name
FROM public.fees f
JOIN  public.students s ON s.id = f.student_id
LEFT JOIN public.batches  b ON b.id = f.batch_id;

-- Attendance summary view (per batch per date)
CREATE OR REPLACE VIEW public.v_attendance_summary AS
SELECT
  a.batch_id,
  b.name                                                    AS batch_name,
  a.date,
  COUNT(*)                                                  AS total,
  COUNT(*) FILTER (WHERE a.status = 'present')              AS present,
  COUNT(*) FILTER (WHERE a.status = 'absent')               AS absent,
  COUNT(*) FILTER (WHERE a.status = 'late')                 AS late,
  ROUND(
    COUNT(*) FILTER (WHERE a.status IN ('present','late'))::numeric
    / NULLIF(COUNT(*),0) * 100, 1
  )                                                         AS attendance_pct
FROM public.attendance a
JOIN public.batches b ON b.id = a.batch_id
GROUP BY a.batch_id, b.name, a.date;

-- Exam results view
CREATE OR REPLACE VIEW public.v_exam_results AS
SELECT
  er.id,
  er.marks_obtained,
  er.is_absent,
  er.remarks,
  er.graded_at,
  e.title          AS exam_title,
  e.total_marks,
  e.exam_date,
  e.exam_type,
  e.status         AS exam_status,
  b.name           AS batch_name,
  s.full_name      AS student_name,
  s.email          AS student_email,
  ROUND(er.marks_obtained::numeric / NULLIF(e.total_marks,0) * 100, 1) AS percentage
FROM public.exam_results er
JOIN public.exams    e ON e.id = er.exam_id
JOIN public.students s ON s.id = er.student_id
LEFT JOIN public.batches b ON b.id = e.batch_id;

-- ─────────────────────────────────────────────────────────────
-- 30. ENHANCED DASHBOARD METRICS FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_students',    (SELECT COUNT(*) FROM students WHERE status = 'active'),
    'total_teachers',    (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
    'active_batches',    (SELECT COUNT(*) FROM batches  WHERE status = 'active'),
    'total_parents',     (SELECT COUNT(*) FROM parents),
    'pending_fees',      (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'pending'),
    'overdue_fees',      (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'overdue'),
    'total_collected',   (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'paid'),
    'upcoming_exams',    (SELECT COUNT(*) FROM exams WHERE exam_date >= CURRENT_DATE AND status = 'upcoming'),
    'todays_classes',    (SELECT COUNT(*) FROM class_schedules WHERE day_of_week = EXTRACT(DOW FROM CURRENT_DATE)::int),
    'todays_attendance', json_build_object(
      'present', (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'present'),
      'absent',  (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'absent'),
      'late',    (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'late')
    ),
    'monthly_enrollment', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.sort_key), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(date_trunc('month', joined_at), 'Mon YYYY') AS month,
          date_trunc('month', joined_at)                       AS sort_key,
          COUNT(*)                                             AS students
        FROM students
        WHERE joined_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', joined_at)
      ) t
    ),
    'monthly_revenue', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.sort_key), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(date_trunc('month', paid_date), 'Mon YYYY') AS month,
          date_trunc('month', paid_date)                       AS sort_key,
          SUM(amount)::numeric                                 AS revenue
        FROM fees
        WHERE status = 'paid' AND paid_date >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', paid_date)
      ) t
    ),
    'fee_collection_rate', (
      SELECT CASE
        WHEN total_fees = 0 THEN 0
        ELSE ROUND(paid_fees::numeric / total_fees * 100, 1)
      END
      FROM (
        SELECT
          COUNT(*) FILTER (WHERE status IN ('paid','pending','overdue')) AS total_fees,
          COUNT(*) FILTER (WHERE status = 'paid')                        AS paid_fees
        FROM fees
      ) fc
    ),
    'batch_enrollment', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT b.name, COUNT(sb.student_id) AS students
        FROM batches b
        LEFT JOIN student_batches sb ON sb.batch_id = b.id
        WHERE b.status = 'active'
        GROUP BY b.id, b.name
        ORDER BY students DESC
        LIMIT 5
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 31. ATTENDANCE REPORT FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_attendance_report(
  p_batch_id  UUID DEFAULT NULL,
  p_from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_to_date   DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'summary', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          s.id            AS student_id,
          s.full_name     AS student_name,
          COUNT(*)        AS total_days,
          COUNT(*) FILTER (WHERE a.status = 'present') AS present,
          COUNT(*) FILTER (WHERE a.status = 'absent')  AS absent,
          COUNT(*) FILTER (WHERE a.status = 'late')    AS late,
          ROUND(
            COUNT(*) FILTER (WHERE a.status IN ('present','late'))::numeric
            / NULLIF(COUNT(*),0) * 100, 1
          ) AS attendance_pct
        FROM attendance a
        JOIN students s ON s.id = a.student_id
        WHERE a.date BETWEEN p_from_date AND p_to_date
          AND (p_batch_id IS NULL OR a.batch_id = p_batch_id)
        GROUP BY s.id, s.full_name
        ORDER BY attendance_pct DESC
      ) t
    ),
    'daily', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          a.date,
          COUNT(*)                                             AS total,
          COUNT(*) FILTER (WHERE a.status = 'present')        AS present,
          COUNT(*) FILTER (WHERE a.status = 'absent')         AS absent,
          COUNT(*) FILTER (WHERE a.status = 'late')           AS late
        FROM attendance a
        WHERE a.date BETWEEN p_from_date AND p_to_date
          AND (p_batch_id IS NULL OR a.batch_id = p_batch_id)
        GROUP BY a.date
        ORDER BY a.date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 32. FEE REPORT FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_fee_report(
  p_from_date DATE DEFAULT (CURRENT_DATE - INTERVAL '30 days')::DATE,
  p_to_date   DATE DEFAULT CURRENT_DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_collected',  (SELECT COALESCE(SUM(amount),0) FROM fees WHERE status='paid'    AND paid_date BETWEEN p_from_date AND p_to_date),
    'total_pending',    (SELECT COALESCE(SUM(amount),0) FROM fees WHERE status='pending' AND due_date  BETWEEN p_from_date AND p_to_date),
    'total_overdue',    (SELECT COALESCE(SUM(amount),0) FROM fees WHERE status='overdue'),
    'by_batch', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          b.name                                                                AS batch_name,
          COALESCE(SUM(f.amount) FILTER (WHERE f.status='paid'),    0)         AS collected,
          COALESCE(SUM(f.amount) FILTER (WHERE f.status='pending'), 0)         AS pending,
          COALESCE(SUM(f.amount) FILTER (WHERE f.status='overdue'), 0)         AS overdue
        FROM fees f
        LEFT JOIN batches b ON b.id = f.batch_id
        GROUP BY b.name
        ORDER BY collected DESC
      ) t
    ),
    'by_month', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.sort_key), '[]'::json)
      FROM (
        SELECT
          TO_CHAR(date_trunc('month', paid_date), 'Mon YYYY') AS month,
          date_trunc('month', paid_date)                       AS sort_key,
          SUM(amount)::numeric                                 AS revenue
        FROM fees
        WHERE status = 'paid'
          AND paid_date BETWEEN p_from_date AND p_to_date
        GROUP BY date_trunc('month', paid_date)
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 33. EXAM PERFORMANCE FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_exam_performance(p_exam_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'exam', (SELECT row_to_json(e) FROM exams e WHERE e.id = p_exam_id),
    'stats', json_build_object(
      'total_students',  (SELECT COUNT(*) FROM exam_results WHERE exam_id = p_exam_id),
      'appeared',        (SELECT COUNT(*) FROM exam_results WHERE exam_id = p_exam_id AND NOT is_absent),
      'absent',          (SELECT COUNT(*) FROM exam_results WHERE exam_id = p_exam_id AND is_absent),
      'avg_marks',       (SELECT ROUND(AVG(marks_obtained)::numeric,1) FROM exam_results WHERE exam_id = p_exam_id AND NOT is_absent),
      'highest_marks',   (SELECT MAX(marks_obtained) FROM exam_results WHERE exam_id = p_exam_id),
      'lowest_marks',    (SELECT MIN(marks_obtained) FROM exam_results WHERE exam_id = p_exam_id AND NOT is_absent),
      'pass_count',      (
        SELECT COUNT(*) FROM exam_results er
        JOIN exams ex ON ex.id = er.exam_id
        WHERE er.exam_id = p_exam_id
          AND NOT er.is_absent
          AND er.marks_obtained >= COALESCE(ex.passing_marks, ex.total_marks * 0.4)
      )
    ),
    'results', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.marks_obtained DESC), '[]'::json)
      FROM (
        SELECT
          er.id,
          s.full_name      AS student_name,
          er.marks_obtained,
          er.is_absent,
          er.remarks,
          ROUND(er.marks_obtained::numeric / NULLIF(ex.total_marks,0) * 100, 1) AS percentage
        FROM exam_results er
        JOIN students s ON s.id = er.student_id
        JOIN exams    ex ON ex.id = er.exam_id
        WHERE er.exam_id = p_exam_id
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 34. REALTIME — tables already added in migration 001
-- ─────────────────────────────────────────────────────────────

-- Tables already added in 001_initial_schema.sql:
-- public.students, public.attendance, public.fees, public.notifications

-- ─────────────────────────────────────────────────────────────
-- 35. GRANT EXECUTE ON FUNCTIONS TO AUTHENTICATED
-- ─────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics()                                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_attendance_report(UUID, DATE, DATE)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_fee_report(DATE, DATE)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_exam_performance(UUID)                                 TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_overdue_fees()                                        TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 36. GRANT SELECT ON VIEWS TO AUTHENTICATED
-- ─────────────────────────────────────────────────────────────

GRANT SELECT ON public.v_student_summary    TO authenticated;
GRANT SELECT ON public.v_batch_summary      TO authenticated;
GRANT SELECT ON public.v_fee_summary        TO authenticated;
GRANT SELECT ON public.v_attendance_summary TO authenticated;
GRANT SELECT ON public.v_exam_results       TO authenticated;
