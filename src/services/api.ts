import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
type StudentsRow = Tables["students"]["Row"];
type TeachersRow = Tables["teachers"]["Row"];
type FeesRow = Tables["fees"]["Row"];
type BatchesRow = Tables["batches"]["Row"];
type CoursesRow = Tables["courses"]["Row"];
type AttendanceRow = Tables["attendance"]["Row"];
type ExamsRow = Tables["exams"]["Row"];
type ExamResultsRow = Tables["exam_results"]["Row"];
type ParentsRow = Tables["parents"]["Row"];
type MessagesRow = Tables["messages"]["Row"];
type NotificationsRow = Tables["notifications"]["Row"];
type StudentBatchesRow = Tables["student_batches"]["Row"];
type ParentStudentsRow = Tables["parent_students"]["Row"];
type ClassSchedulesRow = Tables["class_schedules"]["Row"];

export type {
  StudentsRow,
  TeachersRow,
  FeesRow,
  BatchesRow,
  CoursesRow,
  AttendanceRow,
  ExamsRow,
  ExamResultsRow,
  ParentsRow,
  MessagesRow,
  NotificationsRow,
  StudentBatchesRow,
  ParentStudentsRow,
  ClassSchedulesRow,
};

export const db = supabase;
