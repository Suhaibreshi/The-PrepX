-- ============================================================
-- PREPX IQ — Internal Task Management Module
-- Migration: 012_task_management
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TASK PRIORITY ENUM
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. TASK STATUS ENUM
-- ─────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. TASKS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  assigned_to_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_student_id    UUID REFERENCES public.students(id) ON DELETE SET NULL,
  related_batch_id      UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  related_fee_id        UUID REFERENCES public.fees(id) ON DELETE SET NULL,
  priority              public.task_priority NOT NULL DEFAULT 'medium',
  status                public.task_status NOT NULL DEFAULT 'pending',
  due_date              DATE NOT NULL,
  reminder_date         DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 4. TASK COMMENTS TABLE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 5. INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS tasks_assigned_to_user_id_idx ON public.tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_assigned_by_user_id_idx ON public.tasks(assigned_by_user_id);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_related_student_id_idx ON public.tasks(related_student_id);
CREATE INDEX IF NOT EXISTS tasks_related_fee_id_idx ON public.tasks(related_fee_id);

CREATE INDEX IF NOT EXISTS task_comments_task_id_idx ON public.task_comments(task_id);
CREATE INDEX IF NOT EXISTS task_comments_user_id_idx ON public.task_comments(user_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS tasks_user_status_due_idx ON public.tasks(assigned_to_user_id, status, due_date);

-- ─────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
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

-- Tasks: SELECT - Users can see their own tasks, admins can see all
CREATE POLICY "Tasks read access" ON public.tasks
  FOR SELECT
  USING (
    assigned_to_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Tasks: INSERT - All authenticated users can create tasks
CREATE POLICY "Tasks insert access" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Tasks: UPDATE - Assigned user can update status, creator/admin can update all
CREATE POLICY "Tasks update access" ON public.tasks
  FOR UPDATE
  USING (
    assigned_to_user_id = auth.uid()
    OR assigned_by_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Tasks: DELETE - Only creator or admin can delete
CREATE POLICY "Tasks delete access" ON public.tasks
  FOR DELETE
  USING (
    assigned_by_user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- Task Comments: SELECT - Users who can see the task can see comments
CREATE POLICY "Task_comments read access" ON public.task_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_comments.task_id
      AND (
        tasks.assigned_to_user_id = auth.uid()
        OR tasks.assigned_by_user_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
    )
  );

-- Task Comments: INSERT - Users who can see the task can add comments
CREATE POLICY "Task_comments insert access" ON public.task_comments
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Task Comments: DELETE - Only comment author or admin can delete
CREATE POLICY "Task_comments delete access" ON public.task_comments
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR public.is_admin(auth.uid())
  );

-- ─────────────────────────────────────────────────────────────
-- 7. TRIGGERS FOR UPDATED_AT
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 8. TRIGGER FOR TASK NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on new task creation or when assignment changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.assigned_to_user_id IS DISTINCT FROM NEW.assigned_to_user_id) THEN
    INSERT INTO public.notifications (user_id, title, body, type, action_url)
    VALUES (
      NEW.assigned_to_user_id,
      'New Task Assigned',
      NEW.title,
      'system',
      '/tasks?id=' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER task_assignment_notification
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assignment();

-- ─────────────────────────────────────────────────────────────
-- 9. TASK SUMMARY VIEW
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.task_summary AS
SELECT 
  t.id,
  t.title,
  t.description,
  t.priority,
  t.status,
  t.due_date,
  t.reminder_date,
  t.created_at,
  t.updated_at,
  t.related_student_id,
  t.related_batch_id,
  t.related_fee_id,
  t.assigned_to_user_id,
  t.assigned_by_user_id,
  assigned_to.full_name AS assigned_to_name,
  assigned_to.role AS assigned_to_role,
  assigned_by.full_name AS assigned_by_name,
  s.full_name AS student_name,
  b.name AS batch_name,
  f.amount AS fee_amount,
  f.due_date AS fee_due_date,
  f.status AS fee_status,
  CASE 
    WHEN t.status IN ('completed', 'cancelled') THEN false
    WHEN t.due_date < CURRENT_DATE THEN true
    ELSE false
  END AS is_overdue,
  CASE 
    WHEN t.due_date = CURRENT_DATE THEN true
    ELSE false
  END AS is_due_today,
  CASE 
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '3 days' AND t.due_date > CURRENT_DATE THEN true
    ELSE false
  END AS is_due_soon
FROM public.tasks t
LEFT JOIN public.user_profiles assigned_to ON t.assigned_to_user_id = assigned_to.id
LEFT JOIN public.user_profiles assigned_by ON t.assigned_by_user_id = assigned_by.id
LEFT JOIN public.students s ON t.related_student_id = s.id
LEFT JOIN public.batches b ON t.related_batch_id = b.id
LEFT JOIN public.fees f ON t.related_fee_id = f.id;

-- Grant access to the view
GRANT SELECT ON public.task_summary TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- 10. TASK STATISTICS FUNCTION
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_task_stats(p_user_id UUID DEFAULT auth.uid())
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_assigned', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id),
    'pending', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND status = 'pending'),
    'in_progress', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND status = 'in_progress'),
    'completed', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND status = 'completed'),
    'overdue', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND status NOT IN ('completed', 'cancelled') AND due_date < CURRENT_DATE),
    'high_priority', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND priority = 'high' AND status NOT IN ('completed', 'cancelled')),
    'due_today', (SELECT COUNT(*) FROM tasks WHERE assigned_to_user_id = p_user_id AND status NOT IN ('completed', 'cancelled') AND due_date = CURRENT_DATE)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- 11. GRANT PERMISSIONS
-- ─────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tasks TO authenticated;
GRANT ALL ON public.task_comments TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_task_stats(UUID) TO authenticated;
