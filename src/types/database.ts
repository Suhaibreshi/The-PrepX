// ─── Enums ───────────────────────────────────────────────────
export type StudentStatus = "active" | "inactive" | "alumni";
export type FeeStatus = "paid" | "pending" | "overdue";
export type AttendanceStatus = "present" | "absent" | "late";
export type ExamStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type ExamType = "MCQ" | "written" | "practical" | "oral" | "online" | "mock";
export type PaymentMethod = "cash" | "bank_transfer" | "upi" | "cheque" | "card" | "other";
export type MessageType = "general" | "class-update" | "schedule-change" | "exam-announcement" | "fee-reminder" | "emergency";
export type RecipientType = "student" | "parent" | "teacher" | "batch" | "all-students" | "all-parents" | "all-teachers";
export type NotificationType = "system" | "fee" | "exam" | "attendance" | "message" | "enrollment";
export type UserRole = "super_admin" | "management_admin" | "academic_coordinator" | "teacher" | "finance_manager" | "support_staff";

// ─── Dashboard ───────────────────────────────────────────────
export interface DashboardMetrics {
  total_students: number;
  total_teachers: number;
  active_batches: number;
  total_parents: number;
  pending_fees: number;
  overdue_fees: number;
  total_collected: number;
  upcoming_exams: number;
  todays_classes: number;
  fee_collection_rate: number;
  todays_attendance: {
    present: number;
    absent: number;
    late: number;
  };
  monthly_enrollment: { month: string; students: number }[];
  monthly_revenue: { month: string; revenue: number }[];
  batch_enrollment: { name: string; students: number }[];
}

// ─── Core Entities ───────────────────────────────────────────
export interface Student {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: StudentStatus;
  joined_at: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  profile_photo: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  status: StudentStatus;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  profile_photo: string | null;
  qualification: string | null;
  experience_yrs: number | null;
  salary: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  duration_weeks: number | null;
  base_fee: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  name: string;
  course_id: string | null;
  teacher_id: string | null;
  academic_year_id: string | null;
  status: StudentStatus;
  start_date: string | null;
  end_date: string | null;
  schedule: string | null;
  capacity: number | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  courses?: { name: string } | null;
  teachers?: { full_name: string } | null;
}

export interface Parent {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  occupation: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

// ─── Fees ────────────────────────────────────────────────────
export interface Fee {
  id: string;
  student_id: string;
  batch_id: string | null;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: FeeStatus;
  description: string | null;
  payment_method: PaymentMethod | null;
  transaction_ref: string | null;
  receipt_number: string | null;
  discount: number | null;
  late_fee: number | null;
  created_at: string;
  updated_at: string;
}

export interface FeeTemplate {
  id: string;
  name: string;
  course_id: string | null;
  amount: number;
  frequency: "one-time" | "monthly" | "quarterly" | "annually";
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Exams ───────────────────────────────────────────────────
export interface Exam {
  id: string;
  title: string;
  batch_id: string | null;
  exam_date: string | null;
  total_marks: number;
  passing_marks: number | null;
  exam_type: ExamType | null;
  status: ExamStatus | null;
  duration_minutes: number | null;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number;
  is_absent: boolean;
  remarks: string | null;
  graded_at: string;
}

// ─── Attendance ──────────────────────────────────────────────
export interface AttendanceRecord {
  id: string;
  student_id: string;
  batch_id: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
  marked_at: string;
}

// ─── Messaging ───────────────────────────────────────────────
export interface Message {
  id: string;
  sender_id: string | null;
  recipient_type: RecipientType;
  recipient_id: string | null;
  message_type: MessageType | null;
  subject: string;
  body: string;
  read: boolean;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  body: string | null;
  type: NotificationType | null;
  read: boolean;
  action_url: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Settings ────────────────────────────────────────────────
export interface OrgSetting {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  resource: string;
  can_read: boolean;
  can_create: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  phone: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Class Schedules ─────────────────────────────────────────
export interface ClassSchedule {
  id: string;
  batch_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  meeting_link: string | null;
  created_at: string;
}

// ─── Events ──────────────────────────────────────────────────
export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  event_type: "holiday" | "exam" | "class" | "meeting" | "other";
  batch_id: string | null;
  academic_year_id: string | null;
  created_by: string | null;
  created_at: string;
}

// ─── Junction Tables ─────────────────────────────────────────
export interface StudentBatch {
  id: string;
  student_id: string;
  batch_id: string;
  enrolled_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
}

// ─── View Types ──────────────────────────────────────────────
export interface StudentSummary {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  joined_at: string;
  gender: string | null;
  date_of_birth: string | null;
  batch_count: number;
  parent_count: number;
  pending_fees: number;
  overdue_fees: number;
  paid_fees: number;
}

export interface BatchSummary {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  schedule: string | null;
  capacity: number | null;
  course_name: string | null;
  teacher_name: string | null;
  student_count: number;
  schedule_count: number;
}

export interface FeeSummary {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  description: string | null;
  payment_method: string | null;
  transaction_ref: string | null;
  receipt_number: string | null;
  discount: number | null;
  late_fee: number | null;
  created_at: string;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  batch_name: string | null;
}

export interface AttendanceSummary {
  batch_id: string;
  batch_name: string;
  date: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  attendance_pct: number;
}

export interface ExamResultView {
  id: string;
  marks_obtained: number;
  is_absent: boolean;
  remarks: string | null;
  graded_at: string;
  exam_title: string;
  total_marks: number;
  exam_date: string | null;
  exam_type: string | null;
  exam_status: string | null;
  batch_name: string | null;
  student_name: string;
  student_email: string | null;
  percentage: number;
}
