-- ============================================================
-- SECURITY FIXES MIGRATION
-- Migration: 003_security_fixes
-- Date: 2026-02-18
-- Purpose: Fix critical security vulnerabilities identified in architecture report
-- ============================================================

-- ============================================================
-- PART 1: HELPER FUNCTIONS FOR ROLE-BASED ACCESS
-- ============================================================

-- Function to check if current user has a specific role
-- Note: Cast role to text for comparison since role is user_role enum type
CREATE OR REPLACE FUNCTION public.user_has_role(target_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role::text = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user has any of the specified roles
-- Note: Cast role to text for comparison since role is user_role enum type
CREATE OR REPLACE FUNCTION public.user_has_any_role(target_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND role::text = ANY(target_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's role
-- Note: Return role as text since it's stored as user_role enum type
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role::text FROM user_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PART 2: SERVER-SIDE VALIDATION (CHECK CONSTRAINTS)
-- ============================================================

-- Add CHECK constraint for positive fee amounts
ALTER TABLE public.fees 
  DROP CONSTRAINT IF EXISTS positive_amount;
ALTER TABLE public.fees 
  ADD CONSTRAINT positive_amount CHECK (amount > 0);

-- Add CHECK constraint for valid email format
ALTER TABLE public.students 
  DROP CONSTRAINT IF EXISTS valid_email;
ALTER TABLE public.students 
  ADD CONSTRAINT valid_email CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Add CHECK constraint for valid teacher email
ALTER TABLE public.teachers 
  DROP CONSTRAINT IF EXISTS valid_teacher_email;
ALTER TABLE public.teachers 
  ADD CONSTRAINT valid_teacher_email CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Add CHECK constraint for valid parent email
ALTER TABLE public.parents 
  DROP CONSTRAINT IF EXISTS valid_parent_email;
ALTER TABLE public.parents 
  ADD CONSTRAINT valid_parent_email CHECK (
    email IS NULL OR 
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  );

-- Add CHECK constraint for marks obtained
ALTER TABLE public.exam_results 
  DROP CONSTRAINT IF EXISTS non_negative_marks;
ALTER TABLE public.exam_results 
  ADD CONSTRAINT non_negative_marks CHECK (marks_obtained >= 0);

-- Add CHECK constraint for total marks
ALTER TABLE public.exams 
  DROP CONSTRAINT IF EXISTS positive_total_marks;
ALTER TABLE public.exams 
  ADD CONSTRAINT positive_total_marks CHECK (total_marks > 0);

-- ============================================================
-- PART 3: SECURE ROLE-BASED RLS POLICIES
-- ============================================================

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can read students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.students;

DROP POLICY IF EXISTS "Authenticated users can read teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can insert teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can update teachers" ON public.teachers;
DROP POLICY IF EXISTS "Authenticated users can delete teachers" ON public.teachers;

DROP POLICY IF EXISTS "Authenticated users can read courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can update courses" ON public.courses;

DROP POLICY IF EXISTS "Authenticated users can read batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can insert batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can update batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can delete batches" ON public.batches;

DROP POLICY IF EXISTS "Authenticated users can read student_batches" ON public.student_batches;
DROP POLICY IF EXISTS "Authenticated users can insert student_batches" ON public.student_batches;
DROP POLICY IF EXISTS "Authenticated users can delete student_batches" ON public.student_batches;

DROP POLICY IF EXISTS "Authenticated users can read parents" ON public.parents;
DROP POLICY IF EXISTS "Authenticated users can insert parents" ON public.parents;
DROP POLICY IF EXISTS "Authenticated users can update parents" ON public.parents;
DROP POLICY IF EXISTS "Authenticated users can delete parents" ON public.parents;

DROP POLICY IF EXISTS "Authenticated users can read parent_students" ON public.parent_students;
DROP POLICY IF EXISTS "Authenticated users can insert parent_students" ON public.parent_students;
DROP POLICY IF EXISTS "Authenticated users can delete parent_students" ON public.parent_students;

DROP POLICY IF EXISTS "Authenticated users can read attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Authenticated users can update attendance" ON public.attendance;

DROP POLICY IF EXISTS "Authenticated users can read exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can insert exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can update exams" ON public.exams;
DROP POLICY IF EXISTS "Authenticated users can delete exams" ON public.exams;

DROP POLICY IF EXISTS "Authenticated users can read exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Authenticated users can insert exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Authenticated users can update exam_results" ON public.exam_results;

DROP POLICY IF EXISTS "Authenticated users can read fees" ON public.fees;
DROP POLICY IF EXISTS "Authenticated users can insert fees" ON public.fees;
DROP POLICY IF EXISTS "Authenticated users can update fees" ON public.fees;

DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;

DROP POLICY IF EXISTS "Authenticated users can read notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can update notifications" ON public.notifications;

DROP POLICY IF EXISTS "Authenticated users can read class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Authenticated users can insert class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Authenticated users can update class_schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Authenticated users can delete class_schedules" ON public.class_schedules;

-- Create secure role-based RLS policies

-- STUDENTS: All authenticated users can read; only admins/coordinators can modify
CREATE POLICY "Students read access" ON public.students 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']));

CREATE POLICY "Students insert access" ON public.students 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Students update access" ON public.students 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Students delete access" ON public.students 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- TEACHERS: All authenticated users can read; only admins can modify
CREATE POLICY "Teachers read access" ON public.teachers 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Teachers insert access" ON public.teachers 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

CREATE POLICY "Teachers update access" ON public.teachers 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

CREATE POLICY "Teachers delete access" ON public.teachers 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- COURSES: All authenticated users can read; admins/coordinators can modify
CREATE POLICY "Courses read access" ON public.courses 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Courses insert access" ON public.courses 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Courses update access" ON public.courses 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

-- BATCHES: All authenticated users can read; admins/coordinators/teachers can modify
CREATE POLICY "Batches read access" ON public.batches 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']));

CREATE POLICY "Batches insert access" ON public.batches 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Batches update access" ON public.batches 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Batches delete access" ON public.batches 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- STUDENT_BATCHES: Enrollments - teachers/admins can manage
CREATE POLICY "Student_batches read access" ON public.student_batches 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Student_batches insert access" ON public.student_batches 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

CREATE POLICY "Student_batches delete access" ON public.student_batches 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

-- PARENTS: All authenticated users can read; admins/coordinators can modify
CREATE POLICY "Parents read access" ON public.parents 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Parents insert access" ON public.parents 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Parents update access" ON public.parents 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Parents delete access" ON public.parents 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- PARENT_STUDENTS: All authenticated users can read; admins/coordinators can modify
CREATE POLICY "Parent_students read access" ON public.parent_students 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Parent_students insert access" ON public.parent_students 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Parent_students delete access" ON public.parent_students 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

-- ATTENDANCE: Teachers/admins can manage
CREATE POLICY "Attendance read access" ON public.attendance 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Attendance insert access" ON public.attendance 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

CREATE POLICY "Attendance update access" ON public.attendance 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

-- EXAMS: Teachers/admins can manage
CREATE POLICY "Exams read access" ON public.exams 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Exams insert access" ON public.exams 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

CREATE POLICY "Exams update access" ON public.exams 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

CREATE POLICY "Exams delete access" ON public.exams 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

-- EXAM_RESULTS: Teachers/admins can manage
CREATE POLICY "Exam_results read access" ON public.exam_results 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Exam_results insert access" ON public.exam_results 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

CREATE POLICY "Exam_results update access" ON public.exam_results 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher']));

-- FEES: Finance managers/admins can manage
CREATE POLICY "Fees read access" ON public.fees 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'finance_manager', 'support_staff']));

CREATE POLICY "Fees insert access" ON public.fees 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'finance_manager']));

CREATE POLICY "Fees update access" ON public.fees 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'finance_manager']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'finance_manager']));

-- MESSAGES: Authenticated users can send and read their own
CREATE POLICY "Messages read access" ON public.messages 
  FOR SELECT TO authenticated 
  USING (
    user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff'])
    OR sender_id = auth.uid()
  );

CREATE POLICY "Messages insert access" ON public.messages 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']));

-- NOTIFICATIONS: Authenticated users can read all, only admins can insert
CREATE POLICY "Notifications read access" ON public.notifications 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']));

CREATE POLICY "Notifications insert access" ON public.notifications 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

CREATE POLICY "Notifications update access" ON public.notifications 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- CLASS_SCHEDULES: Teachers/admins can manage
CREATE POLICY "Class_schedules read access" ON public.class_schedules 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'support_staff']));

CREATE POLICY "Class_schedules insert access" ON public.class_schedules 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Class_schedules update access" ON public.class_schedules 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

CREATE POLICY "Class_schedules delete access" ON public.class_schedules 
  FOR DELETE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator']));

-- ============================================================
-- PART 4: SECURE USER_PROFILES ACCESS
-- ============================================================

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for displaying user info)
CREATE POLICY "User_profiles read access" ON public.user_profiles 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin', 'academic_coordinator', 'teacher', 'finance_manager', 'support_staff']));

-- Users can update their own profile
CREATE POLICY "User_profiles update own" ON public.user_profiles 
  FOR UPDATE TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Only admins can insert new profiles
CREATE POLICY "User_profiles insert access" ON public.user_profiles 
  FOR INSERT TO authenticated 
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- ============================================================
-- PART 5: SECURE ORG_SETTINGS ACCESS
-- ============================================================

-- Enable RLS on org_settings
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read org settings
CREATE POLICY "Org_settings read access" ON public.org_settings 
  FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify org settings
CREATE POLICY "Org_settings update access" ON public.org_settings 
  FOR UPDATE TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- ============================================================
-- PART 6: AUDIT LOG INTEGRITY
-- ============================================================

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Remove DELETE policy - make append-only
DROP POLICY IF EXISTS "Service insert audit_logs" ON public.audit_logs;

-- Only allow INSERT for authenticated users (auto-populated)
CREATE POLICY "Audit_logs insert access" ON public.audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- Only allow SELECT for admins
CREATE POLICY "Audit_logs read access" ON public.audit_logs 
  FOR SELECT TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- Add trigger to auto-set user_id if not provided
CREATE OR REPLACE FUNCTION public.set_audit_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS audit_user_set ON audit_logs;
CREATE TRIGGER audit_user_set
  BEFORE INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_audit_user();

-- ============================================================
-- PART 7: SECURE ACADEMIC_YEARS ACCESS
-- ============================================================

-- Enable RLS on academic_years
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read academic years
CREATE POLICY "Academic_years read access" ON public.academic_years 
  FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify
CREATE POLICY "Academic_years write access" ON public.academic_years 
  FOR ALL TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- ============================================================
-- PART 8: SECURE ROLE_PERMISSIONS ACCESS
-- ============================================================

-- Enable RLS on role_permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read permissions
CREATE POLICY "Role_permissions read access" ON public.role_permissions 
  FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify
CREATE POLICY "Role_permissions write access" ON public.role_permissions 
  FOR ALL TO authenticated 
  USING (user_has_any_role(ARRAY['super_admin', 'management_admin']))
  WITH CHECK (user_has_any_role(ARRAY['super_admin', 'management_admin']));

-- ============================================================
-- PART 9: SECURE DASHBOARD METRICS FUNCTION
-- ============================================================

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO anon;

-- ============================================================
-- PART 10: ADDITIONAL SECURITY IMPROVEMENTS
-- ============================================================

-- Create index on user_profiles for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Create index on audit_logs for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Comment on security functions
COMMENT ON FUNCTION public.user_has_role(TEXT) IS 'Checks if current user has a specific role';
COMMENT ON FUNCTION public.user_has_any_role(TEXT[]) IS 'Checks if current user has any of the specified roles';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Returns the role of the current user';
