-- Fix security definer on views - run this directly in SQL Editor
ALTER VIEW public.v_fee_summary SET (security_invoker = on);
ALTER VIEW public.v_student_summary SET (security_invoker = on);
ALTER VIEW public.v_batch_summary SET (security_invoker = on);
ALTER VIEW public.v_attendance_summary SET (security_invoker = on);
ALTER VIEW public.v_exam_results SET (security_invoker = on);
