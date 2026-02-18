
-- Core enum types
CREATE TYPE public.student_status AS ENUM ('active', 'inactive', 'alumni');
CREATE TYPE public.fee_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late');

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status student_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  subject TEXT,
  status student_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Batches table
CREATE TABLE public.batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  status student_status NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  schedule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student-Batch junction
CREATE TABLE public.student_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, batch_id)
);

-- Parents table
CREATE TABLE public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parent-Student junction
CREATE TABLE public.parent_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  UNIQUE(parent_id, student_id)
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status attendance_status NOT NULL DEFAULT 'present',
  marked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, batch_id, date)
);

-- Exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  exam_date DATE,
  total_marks INTEGER NOT NULL DEFAULT 100,
  exam_type TEXT DEFAULT 'MCQ',
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Exam results
CREATE TABLE public.exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained INTEGER NOT NULL DEFAULT 0,
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(exam_id, student_id)
);

-- Fees table
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status fee_status NOT NULL DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_type TEXT NOT NULL,
  recipient_id UUID,
  message_type TEXT DEFAULT 'general',
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'system',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Class schedules
CREATE TABLE public.class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies: authenticated users can read/write all management data
-- (Role-based filtering will be added in app logic + future fine-grained policies)
CREATE POLICY "Authenticated users can read students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert students" ON public.students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update students" ON public.students FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete students" ON public.students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert teachers" ON public.teachers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teachers" ON public.teachers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teachers" ON public.teachers FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update courses" ON public.courses FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert batches" ON public.batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update batches" ON public.batches FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete batches" ON public.batches FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read student_batches" ON public.student_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert student_batches" ON public.student_batches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete student_batches" ON public.student_batches FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read parents" ON public.parents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parents" ON public.parents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update parents" ON public.parents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete parents" ON public.parents FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read parent_students" ON public.parent_students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert parent_students" ON public.parent_students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete parent_students" ON public.parent_students FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read attendance" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read exams" ON public.exams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert exams" ON public.exams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exams" ON public.exams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete exams" ON public.exams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read exam_results" ON public.exam_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert exam_results" ON public.exam_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exam_results" ON public.exam_results FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read fees" ON public.fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert fees" ON public.fees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update fees" ON public.fees FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read messages" ON public.messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can read notifications" ON public.notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update notifications" ON public.notifications FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read class_schedules" ON public.class_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert class_schedules" ON public.class_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update class_schedules" ON public.class_schedules FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete class_schedules" ON public.class_schedules FOR DELETE TO authenticated USING (true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Dashboard metrics function
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
    'total_students', (SELECT COUNT(*) FROM students WHERE status = 'active'),
    'total_teachers', (SELECT COUNT(*) FROM teachers WHERE status = 'active'),
    'active_batches', (SELECT COUNT(*) FROM batches WHERE status = 'active'),
    'total_parents', (SELECT COUNT(*) FROM parents),
    'pending_fees', (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'pending'),
    'overdue_fees', (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'overdue'),
    'total_collected', (SELECT COALESCE(SUM(amount), 0) FROM fees WHERE status = 'paid'),
    'upcoming_exams', (SELECT COUNT(*) FROM exams WHERE exam_date >= CURRENT_DATE AND status = 'upcoming'),
    'todays_classes', (SELECT COUNT(*) FROM class_schedules WHERE day_of_week = EXTRACT(DOW FROM CURRENT_DATE)),
    'todays_attendance', json_build_object(
      'present', (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'present'),
      'absent', (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'absent'),
      'late', (SELECT COUNT(*) FROM attendance WHERE date = CURRENT_DATE AND status = 'late')
    ),
    'monthly_enrollment', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT TO_CHAR(date_trunc('month', joined_at), 'Mon') as month,
               COUNT(*) as students
        FROM students
        WHERE joined_at >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', joined_at)
        ORDER BY date_trunc('month', joined_at)
      ) t
    ),
    'monthly_revenue', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
        SELECT TO_CHAR(date_trunc('month', paid_date), 'Mon') as month,
               SUM(amount)::numeric as revenue
        FROM fees
        WHERE status = 'paid' AND paid_date >= NOW() - INTERVAL '6 months'
        GROUP BY date_trunc('month', paid_date)
        ORDER BY date_trunc('month', paid_date)
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
