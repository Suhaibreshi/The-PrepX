-- ============================================================
-- ADD DELETE POLICY FOR COURSES TABLE
-- This migration adds the missing DELETE policy for courses
-- ============================================================

-- Add DELETE policy for courses
CREATE POLICY "Authenticated users can delete courses" ON public.courses FOR DELETE TO authenticated USING (true);