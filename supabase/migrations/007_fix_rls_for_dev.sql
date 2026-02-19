-- ============================================================
-- FIX RLS POLICIES FOR DEVELOPMENT
-- This migration makes RLS policies more permissive for authenticated users
-- ============================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Students read access" ON public.students;
DROP POLICY IF EXISTS "Students insert access" ON public.students;
DROP POLICY IF EXISTS "Students update access" ON public.students;
DROP POLICY IF EXISTS "Students delete access" ON public.students;

DROP POLICY IF EXISTS "Teachers read access" ON public.teachers;
DROP POLICY IF EXISTS "Teachers insert access" ON public.teachers;
DROP POLICY IF EXISTS "Teachers update access" ON public.teachers;
DROP POLICY IF EXISTS "Teachers delete access" ON public.teachers;

DROP POLICY IF EXISTS "Courses read access" ON public.courses;
DROP POLICY IF EXISTS "Courses insert access" ON public.courses;
DROP POLICY IF EXISTS "Courses update access" ON public.courses;

DROP POLICY IF EXISTS "Batches read access" ON public.batches;
DROP POLICY IF EXISTS "Batches insert access" ON public.batches;
DROP POLICY IF EXISTS "Batches update access" ON public.batches;
DROP POLICY IF EXISTS "Batches delete access" ON public.batches;

DROP POLICY IF EXISTS "Student_batches read access" ON public.student_batches;
DROP POLICY IF EXISTS "Student_batches insert access" ON public.student_batches;
DROP POLICY IF EXISTS "Student_batches delete access" ON public.student_batches;

DROP POLICY IF EXISTS "Parents read access" ON public.parents;
DROP POLICY IF EXISTS "Parents insert access" ON public.parents;
DROP POLICY IF EXISTS "Parents update access" ON public.parents;
DROP POLICY IF EXISTS "Parents delete access" ON public.parents;

DROP POLICY IF EXISTS "Parent_students read access" ON public.parent_students;
DROP POLICY IF EXISTS "Parent_students insert access" ON public.parent_students;
DROP POLICY IF EXISTS "Parent_students delete access" ON public.parent_students;

DROP POLICY IF EXISTS "Attendance read access" ON public.attendance;
DROP POLICY IF EXISTS "Attendance insert access" ON public.attendance;
DROP POLICY IF EXISTS "Attendance update access" ON public.attendance;

DROP POLICY IF EXISTS "Exams read access" ON public.exams;
DROP POLICY IF EXISTS "Exams insert access" ON public.exams;
DROP POLICY IF EXISTS "Exams update access" ON public.exams;
DROP POLICY IF EXISTS "Exams delete access" ON public.exams;

DROP POLICY IF EXISTS "Exam_results read access" ON public.exam_results;
DROP POLICY IF EXISTS "Exam_results insert access" ON public.exam_results;
DROP POLICY IF EXISTS "Exam_results update access" ON public.exam_results;

DROP POLICY IF EXISTS "Fees read access" ON public.fees;
DROP POLICY IF EXISTS "Fees insert access" ON public.fees;
DROP POLICY IF EXISTS "Fees update access" ON public.fees;

DROP POLICY IF EXISTS "Fee_templates read access" ON public.fee_templates;
DROP POLICY IF EXISTS "Fee_templates insert access" ON public.fee_templates;
DROP POLICY IF EXISTS "Fee_templates update access" ON public.fee_templates;
DROP POLICY IF EXISTS "Fee_templates delete access" ON public.fee_templates;

DROP POLICY IF EXISTS "Messages read access" ON public.messages;
DROP POLICY IF EXISTS "Messages insert access" ON public.messages;

DROP POLICY IF EXISTS "Notifications read access" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert access" ON public.notifications;
DROP POLICY IF EXISTS "Notifications update access" ON public.notifications;

DROP POLICY IF EXISTS "Class_schedules read access" ON public.class_schedules;
DROP POLICY IF EXISTS "Class_schedules insert access" ON public.class_schedules;
DROP POLICY IF EXISTS "Class_schedules update access" ON public.class_schedules;
DROP POLICY IF EXISTS "Class_schedules delete access" ON public.class_schedules;

-- Create permissive policies for authenticated users
-- STUDENTS
CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE TO authenticated USING (true);

-- TEACHERS
CREATE POLICY "Authenticated users can read teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert teachers" ON public.teachers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teachers" ON public.teachers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete teachers" ON public.teachers FOR DELETE TO authenticated USING (true);

-- COURSES
CREATE POLICY "Authenticated users can read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update courses" ON public.courses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- BATCHES
CREATE POLICY "Authenticated users can read batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update batches" ON public.batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete batches" ON public.batches FOR DELETE TO authenticated USING (true);

-- STUDENT_BATCHES
CREATE POLICY "Authenticated users can read student_batches" ON public.student_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert student_batches" ON public.student_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete student_batches" ON public.student_batches FOR DELETE TO authenticated USING (true);

-- PARENTS
CREATE POLICY "Authenticated users can read parents" ON public.parents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parents" ON public.parents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parents" ON public.parents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parents" ON public.parents FOR DELETE TO authenticated USING (true);

-- PARENT_STUDENTS
CREATE POLICY "Authenticated users can read parent_students" ON public.parent_students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parent_students" ON public.parent_students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parent_students" ON public.parent_students FOR DELETE TO authenticated USING (true);

-- ATTENDANCE
CREATE POLICY "Authenticated users can read attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- EXAMS
CREATE POLICY "Authenticated users can read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exams" ON public.exams FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete exams" ON public.exams FOR DELETE TO authenticated USING (true);

-- EXAM_RESULTS
CREATE POLICY "Authenticated users can read exam_results" ON public.exam_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert exam_results" ON public.exam_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exam_results" ON public.exam_results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- FEES
CREATE POLICY "Authenticated users can read fees" ON public.fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fees" ON public.fees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fees" ON public.fees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- FEE_TEMPLATES
CREATE POLICY "Authenticated users can read fee_templates" ON public.fee_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fee_templates" ON public.fee_templates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fee_templates" ON public.fee_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete fee_templates" ON public.fee_templates FOR DELETE TO authenticated USING (true);

-- MESSAGES
CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

-- NOTIFICATIONS
CREATE POLICY "Authenticated users can read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- CLASS_SCHEDULES
CREATE POLICY "Authenticated users can read class_schedules" ON public.class_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert class_schedules" ON public.class_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update class_schedules" ON public.class_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete class_schedules" ON public.class_schedules FOR DELETE TO authenticated USING (true);

-- ACADEMIC_YEARS
DROP POLICY IF EXISTS "Academic_years read access" ON public.academic_years;
CREATE POLICY "Authenticated users can read academic_years" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert academic_years" ON public.academic_years FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update academic_years" ON public.academic_years FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- USER_PROFILES - allow users to read and update their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
