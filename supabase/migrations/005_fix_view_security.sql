-- Fix security definer lint issues
-- Recreate views without SECURITY DEFINER

-- Drop and recreate views without security definer
DROP VIEW IF EXISTS public.v_fee_summary;
CREATE VIEW public.v_fee_summary AS
SELECT
  f.id,
  f.amount,
  f.due_date,
  f.paid_date,
  f.status,
  f.description,
  s.full_name  AS student_name,
  s.email      AS student_email,
  b.name       AS batch_name
FROM fees f
JOIN students s ON f.student_id = s.id
LEFT JOIN batches b ON f.batch_id = b.id;

DROP VIEW IF EXISTS public.v_student_summary;
CREATE VIEW public.v_student_summary AS
SELECT
  s.id,
  s.full_name,
  s.email,
  s.phone,
  s.status,
  s.joined_at,
  COALESCE(json_agg(DISTINCT jsonb_build_object('id', b.id, 'name', b.name)) FILTER (WHERE b.id IS NOT NULL), '[]') AS batches
FROM students s
LEFT JOIN student_batches sb ON s.id = sb.student_id
LEFT JOIN batches b ON sb.batch_id = b.id
GROUP BY s.id;

DROP VIEW IF EXISTS public.v_batch_summary;
CREATE VIEW public.v_batch_summary AS
SELECT
  b.id,
  b.name,
  c.name AS course_name,
  t.full_name AS teacher_name,
  b.status,
  b.start_date,
  b.end_date,
  COUNT(sb.student_id) AS student_count
FROM batches b
LEFT JOIN courses c ON b.course_id = c.id
LEFT JOIN teachers t ON b.teacher_id = t.id
LEFT JOIN student_batches sb ON b.id = sb.batch_id
GROUP BY b.id, c.name, t.full_name;

DROP VIEW IF EXISTS public.v_attendance_summary;
CREATE VIEW public.v_attendance_summary AS
SELECT
  a.id,
  a.date,
  a.status,
  s.full_name AS student_name,
  b.name AS batch_name
FROM attendance a
JOIN students s ON a.student_id = s.id
JOIN batches b ON a.batch_id = b.id;

DROP VIEW IF EXISTS public.v_exam_results;
CREATE VIEW public.v_exam_results AS
SELECT
  er.id,
  er.exam_id,
  er.student_id,
  er.marks_obtained,
  er.graded_at,
  s.full_name AS student_name,
  e.title AS exam_title,
  e.total_marks,
  ROUND((er.marks_obtained::numeric / e.total_marks) * 100, 2) AS percentage
FROM exam_results er
JOIN students s ON er.student_id = s.id
JOIN exams e ON er.exam_id = e.id;

-- Grant access
GRANT SELECT ON public.v_fee_summary TO authenticated;
GRANT SELECT ON public.v_student_summary TO authenticated;
GRANT SELECT ON public.v_batch_summary TO authenticated;
GRANT SELECT ON public.v_attendance_summary TO authenticated;
GRANT SELECT ON public.v_exam_results TO authenticated;
