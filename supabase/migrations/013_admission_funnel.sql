-- ============================================================
-- PREPX IQ — Admission Funnel Tracker Module
-- Migration: 013_admission_funnel
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. LEAD SOURCE ENUM
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.lead_source AS ENUM ('walk-in', 'website', 'referral', 'social_media', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. LEAD STAGE ENUM
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.lead_stage AS ENUM ('inquiry', 'follow_up', 'demo', 'converted', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. LEADS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leads (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name            TEXT NOT NULL,
  parent_name             TEXT,
  phone_number            TEXT NOT NULL,
  email                   TEXT,
  course_interested       TEXT,
  lead_source             public.lead_source NOT NULL DEFAULT 'other',
  assigned_counselor_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stage                   public.lead_stage NOT NULL DEFAULT 'inquiry',
  follow_up_date          DATE,
  remarks                 TEXT,
  converted_student_id    UUID REFERENCES public.students(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS leads_stage_idx ON public.leads(stage);
CREATE INDEX IF NOT EXISTS leads_assigned_counselor_id_idx ON public.leads(assigned_counselor_id);
CREATE INDEX IF NOT EXISTS leads_follow_up_date_idx ON public.leads(follow_up_date);
CREATE INDEX IF NOT EXISTS leads_lead_source_idx ON public.leads(lead_source);
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS leads_converted_student_id_idx ON public.leads(converted_student_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS leads_counselor_stage_idx ON public.leads(assigned_counselor_id, stage);
CREATE INDEX IF NOT EXISTS leads_stage_follow_up_idx ON public.leads(stage, follow_up_date);

-- ─────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin (reuse if exists)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id
    AND role IN ('super_admin', 'management_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check if user is counselor
CREATE OR REPLACE FUNCTION public.is_counselor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = user_id
    AND role IN ('super_admin', 'management_admin', 'academic_coordinator', 'support_staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Leads: SELECT - Admins see all, counselors see assigned leads
CREATE POLICY "Leads read access" ON public.leads
  FOR SELECT
  USING (
    public.is_admin(auth.uid())
    OR assigned_counselor_id = auth.uid()
    OR assigned_counselor_id IS NULL
  );

-- Leads: INSERT - Admins and counselors can create leads
CREATE POLICY "Leads insert access" ON public.leads
  FOR INSERT
  WITH CHECK (public.is_counselor(auth.uid()));

-- Leads: UPDATE - Admins can update all, counselors can update assigned leads
CREATE POLICY "Leads update access" ON public.leads
  FOR UPDATE
  USING (
    public.is_admin(auth.uid())
    OR assigned_counselor_id = auth.uid()
  );

-- Leads: DELETE - Only admin can delete
CREATE POLICY "Leads delete access" ON public.leads
  FOR DELETE
  USING (public.is_admin(auth.uid()));

-- ─────────────────────────────────────────────────────────────
-- 6. TRIGGERS FOR UPDATED_AT
-- ─────────────────────────────────────────────────────────────

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 7. LEAD SUMMARY VIEW
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.lead_summary AS
SELECT 
  l.id,
  l.student_name,
  l.parent_name,
  l.phone_number,
  l.email,
  l.course_interested,
  l.lead_source,
  l.assigned_counselor_id,
  l.stage,
  l.follow_up_date,
  l.remarks,
  l.converted_student_id,
  l.created_at,
  l.updated_at,
  c.full_name AS counselor_name,
  c.role AS counselor_role,
  s.full_name AS converted_student_name,
  CASE 
    WHEN l.stage = 'converted' THEN false
    WHEN l.follow_up_date IS NULL THEN false
    WHEN l.follow_up_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue_follow_up,
  CASE 
    WHEN l.follow_up_date = CURRENT_DATE THEN true
    ELSE false
  END AS is_follow_up_today
FROM public.leads l
LEFT JOIN public.user_profiles c ON l.assigned_counselor_id = c.id
LEFT JOIN public.students s ON l.converted_student_id = s.id;

-- Grant access to the view
GRANT SELECT ON public.lead_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 8. LEAD STATISTICS FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_lead_stats(p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_start_date DATE := COALESCE(p_start_date, date_trunc('month', CURRENT_DATE)::DATE);
  v_end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  SELECT json_build_object(
    'total_inquiries', (SELECT COUNT(*) FROM leads WHERE created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date),
    'converted', (SELECT COUNT(*) FROM leads WHERE stage = 'converted' AND created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date),
    'lost', (SELECT COUNT(*) FROM leads WHERE stage = 'lost' AND created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date),
    'in_pipeline', (SELECT COUNT(*) FROM leads WHERE stage IN ('inquiry', 'follow_up', 'demo')),
    'conversion_rate', (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE stage = 'converted')::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0 
      END
      FROM leads 
      WHERE created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date
    ),
    'lost_rate', (
      SELECT CASE 
        WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE stage = 'lost')::NUMERIC / COUNT(*)) * 100, 2)
        ELSE 0 
      END
      FROM leads 
      WHERE created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date
    ),
    'by_source', (
      SELECT json_agg(json_build_object(
        'source', lead_source,
        'count', COUNT(*)
      ))
      FROM leads 
      WHERE created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date
      GROUP BY lead_source
    ),
    'by_stage', (
      SELECT json_agg(json_build_object(
        'stage', stage,
        'count', COUNT(*)
      ))
      FROM leads 
      WHERE created_at::DATE >= v_start_date AND created_at::DATE <= v_end_date
      GROUP BY stage
    ),
    'follow_ups_today', (SELECT COUNT(*) FROM leads WHERE follow_up_date = CURRENT_DATE AND stage NOT IN ('converted', 'lost')),
    'overdue_follow_ups', (SELECT COUNT(*) FROM leads WHERE follow_up_date < CURRENT_DATE AND stage NOT IN ('converted', 'lost'))
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- 9. MONTHLY ADMISSIONS TREND FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_monthly_admissions_trend(p_months INTEGER DEFAULT 6)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(json_build_object(
    'month', TO_CHAR(created_at, 'Mon YYYY'),
    'month_sort', TO_CHAR(created_at, 'YYYY-MM'),
    'inquiries', COUNT(*),
    'converted', COUNT(*) FILTER (WHERE stage = 'converted')
  ))
  INTO result
  FROM leads
  WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * (p_months - 1))
  GROUP BY TO_CHAR(created_at, 'Mon YYYY'), TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY TO_CHAR(created_at, 'YYYY-MM');
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- 10. CONVERT LEAD TO STUDENT FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.convert_lead_to_student(
  p_lead_id UUID,
  p_email TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_student_id UUID;
  v_lead RECORD;
BEGIN
  -- Get lead details
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found';
  END IF;
  
  -- Check if already converted
  IF v_lead.stage = 'converted' AND v_lead.converted_student_id IS NOT NULL THEN
    RAISE EXCEPTION 'Lead already converted to student';
  END IF;
  
  -- Check for duplicate student by phone
  IF EXISTS (SELECT 1 FROM students WHERE phone = v_lead.phone_number) THEN
    RAISE EXCEPTION 'Student with this phone number already exists';
  END IF;
  
  -- Create student record
  INSERT INTO public.students (
    full_name,
    email,
    phone,
    status,
    date_of_birth,
    gender,
    address,
    notes,
    joined_at
  ) VALUES (
    v_lead.student_name,
    COALESCE(p_email, v_lead.email),
    v_lead.phone_number,
    'active',
    p_date_of_birth,
    p_gender,
    p_address,
    'Converted from lead. Parent: ' || COALESCE(v_lead.parent_name, 'N/A') || 
    '. Course interest: ' || COALESCE(v_lead.course_interested, 'N/A') ||
    '. Source: ' || v_lead.lead_source::TEXT,
    CURRENT_DATE
  ) RETURNING id INTO v_student_id;
  
  -- Update lead with conversion info
  UPDATE leads
  SET 
    stage = 'converted',
    converted_student_id = v_student_id,
    updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN v_student_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 11. MARK LEAD AS LOST FUNCTION (Admin only)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.mark_lead_as_lost(
  p_lead_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT public.is_admin(auth.uid()) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only administrators can mark leads as lost';
  END IF;
  
  -- Update lead
  UPDATE leads
  SET 
    stage = 'lost',
    remarks = COALESCE(p_reason, remarks),
    updated_at = now()
  WHERE id = p_lead_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- 12. GET TODAY'S FOLLOW-UPS FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_todays_follow_ups()
RETURNS TABLE (
  id UUID,
  student_name TEXT,
  parent_name TEXT,
  phone_number TEXT,
  course_interested TEXT,
  stage public.lead_stage,
  remarks TEXT,
  counselor_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.student_name,
    l.parent_name,
    l.phone_number,
    l.course_interested,
    l.stage,
    l.remarks,
    up.full_name AS counselor_name
  FROM leads l
  LEFT JOIN user_profiles up ON l.assigned_counselor_id = up.id
  WHERE l.follow_up_date = CURRENT_DATE
    AND l.stage NOT IN ('converted', 'lost')
    AND (
      public.is_admin(auth.uid())
      OR l.assigned_counselor_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- 13. GET OVERDUE FOLLOW-UPS FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_overdue_follow_ups()
RETURNS TABLE (
  id UUID,
  student_name TEXT,
  parent_name TEXT,
  phone_number TEXT,
  course_interested TEXT,
  stage public.lead_stage,
  follow_up_date DATE,
  remarks TEXT,
  counselor_name TEXT,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.student_name,
    l.parent_name,
    l.phone_number,
    l.course_interested,
    l.stage,
    l.follow_up_date,
    l.remarks,
    up.full_name AS counselor_name,
    (CURRENT_DATE - l.follow_up_date)::INTEGER AS days_overdue
  FROM leads l
  LEFT JOIN user_profiles up ON l.assigned_counselor_id = up.id
  WHERE l.follow_up_date < CURRENT_DATE
    AND l.stage NOT IN ('converted', 'lost')
    AND (
      public.is_admin(auth.uid())
      OR l.assigned_counselor_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- 14. GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT SELECT ON public.lead_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_counselor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lead_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_admissions_trend(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_student(UUID, TEXT, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_lead_as_lost(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_todays_follow_ups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_overdue_follow_ups() TO authenticated;
