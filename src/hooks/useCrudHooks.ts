import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────
export function useStudents() {
  return useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (student: {
      id?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      status?: string;
      date_of_birth?: string;
      gender?: string;
      address?: string;
      notes?: string;
    }) => {
      // Validate required fields
      if (!student.full_name?.trim()) {
        throw new Error("Full name is required");
      }
      
      const payload = {
        full_name: student.full_name.trim(),
        email: student.email?.trim() || null,
        phone: student.phone?.trim() || null,
        status: (student.status as any) || "active",
        date_of_birth: student.date_of_birth || null,
        gender: student.gender?.trim() || null,
        address: student.address?.trim() || null,
        notes: student.notes?.trim() || null,
      };
      if (student.id) {
        const { error } = await supabase.from("students").update(payload).eq("id", student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("students").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Student saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Student deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// TEACHERS
// ─────────────────────────────────────────────────────────────
export function useTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: {
      id?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      subject?: string;
      status?: string;
      qualification?: string;
      experience_yrs?: number;
      gender?: string;
      address?: string;
      notes?: string;
    }) => {
      // Validate required fields
      if (!t.full_name?.trim()) {
        throw new Error("Full name is required");
      }
      
      const payload = {
        full_name: t.full_name.trim(),
        email: t.email?.trim() || null,
        phone: t.phone?.trim() || null,
        subject: t.subject?.trim() || null,
        status: (t.status as any) || "active",
        qualification: t.qualification?.trim() || null,
        experience_yrs: t.experience_yrs ?? null,
        gender: t.gender?.trim() || null,
        address: t.address?.trim() || null,
        notes: t.notes?.trim() || null,
      };
      if (t.id) {
        const { error } = await supabase.from("teachers").update(payload).eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("teachers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Teacher saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teachers"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Teacher deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// BATCHES
// ─────────────────────────────────────────────────────────────
export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("*, teachers(full_name), courses(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: {
      id?: string;
      name?: string;
      schedule?: string;
      status?: string;
      teacher_id?: string;
      course_id?: string;
      start_date?: string;
      end_date?: string;
      capacity?: number;
      description?: string;
      academic_year_id?: string;
    }) => {
      // Validate required fields
      if (!b.name?.trim()) {
        throw new Error("Batch name is required");
      }
      
      const payload = {
        name: b.name.trim(),
        schedule: b.schedule?.trim() || null,
        status: (b.status as any) || "active",
        teacher_id: b.teacher_id || null,
        course_id: b.course_id || null,
        start_date: b.start_date || null,
        end_date: b.end_date || null,
        capacity: b.capacity ?? null,
        description: b.description?.trim() || null,
        academic_year_id: b.academic_year_id || null,
      };
      if (b.id) {
        const { error } = await supabase.from("batches").update(payload).eq("id", b.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("batches").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Batch saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("batches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Batch deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// PARENTS
// ─────────────────────────────────────────────────────────────
export function useParents() {
  return useQuery({
    queryKey: ["parents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id?: string;
      full_name?: string;
      email?: string;
      phone?: string;
      address?: string;
      occupation?: string;
    }) => {
      // Validate required fields
      if (!p.full_name?.trim()) {
        throw new Error("Full name is required");
      }
      
      const payload = {
        full_name: p.full_name.trim(),
        email: p.email?.trim() || null,
        phone: p.phone?.trim() || null,
        address: p.address?.trim() || null,
        occupation: p.occupation?.trim() || null,
      };
      if (p.id) {
        const { error } = await supabase.from("parents").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("parents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Parent saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteParent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parents"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Parent deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────────────────────
export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: {
      id?: string;
      name?: string;
      description?: string;
      duration_weeks?: number;
      base_fee?: number;
      is_active?: boolean;
    }) => {
      // Validate required fields
      if (!c.name?.trim()) {
        throw new Error("Course name is required");
      }
      
      const payload = {
        name: c.name.trim(),
        description: c.description?.trim() || null,
        duration_weeks: c.duration_weeks ?? null,
        base_fee: c.base_fee ?? null,
        is_active: c.is_active ?? true,
      };
      if (c.id) {
        const { error } = await supabase.from("courses").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// FEES
// ─────────────────────────────────────────────────────────────
export function useFees() {
  return useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fees")
        .select("*, students(full_name, email, phone), batches(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: {
      id?: string;
      student_id?: string;
      batch_id?: string;
      amount?: number;
      due_date?: string;
      paid_date?: string;
      status?: string;
      description?: string;
      payment_method?: string;
      transaction_ref?: string;
      receipt_number?: string;
      discount?: number;
      late_fee?: number;
    }) => {
      // Validate required fields
      if (!f.student_id) {
        throw new Error("Student is required");
      }
      if (!f.amount || f.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (!f.due_date) {
        throw new Error("Due date is required");
      }
      
      const payload = {
        student_id: f.student_id,
        batch_id: f.batch_id || null,
        amount: f.amount,
        due_date: f.due_date,
        paid_date: f.paid_date || null,
        status: (f.status as any) || "pending",
        description: f.description?.trim() || null,
        payment_method: (f.payment_method as any) || null,
        transaction_ref: f.transaction_ref?.trim() || null,
        receipt_number: f.receipt_number?.trim() || null,
        discount: f.discount ?? 0,
        late_fee: f.late_fee ?? 0,
      };
      if (f.id) {
        const { error } = await supabase.from("fees").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fees").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Fee record saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Fee record deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useMarkFeesPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payment_method, transaction_ref }: {
      id: string;
      payment_method?: string;
      transaction_ref?: string;
    }) => {
      const { error } = await supabase.from("fees").update({
        status: "paid",
        paid_date: new Date().toISOString().split("T")[0],
        payment_method: (payment_method as any) || null,
        transaction_ref: transaction_ref || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fees"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Fee marked as paid");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// FEE TEMPLATES
// ─────────────────────────────────────────────────────────────
export function useFeeTemplates() {
  return useQuery({
    queryKey: ["fee-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fee_templates")
        .select("*, courses(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: {
      id?: string;
      name: string;
      course_id?: string;
      amount: number;
      frequency?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const payload = {
        name: t.name,
        course_id: t.course_id || null,
        amount: t.amount,
        frequency: t.frequency || "monthly",
        description: t.description || null,
        is_active: t.is_active ?? true,
      };
      if (t.id) {
        const { error } = await supabase.from("fee_templates").update(payload).eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fee_templates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-templates"] });
      toast.success("Fee template saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteFeeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-templates"] });
      toast.success("Fee template deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// EXAMS
// ─────────────────────────────────────────────────────────────
export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select("*, batches(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: {
      id?: string;
      title?: string;
      batch_id?: string;
      exam_date?: string;
      total_marks?: number;
      passing_marks?: number;
      exam_type?: string;
      status?: string;
      duration_minutes?: number;
      instructions?: string;
    }) => {
      // Validate required fields
      if (!e.title?.trim()) {
        throw new Error("Exam title is required");
      }
      
      const payload = {
        title: e.title.trim(),
        batch_id: e.batch_id || null,
        exam_date: e.exam_date || null,
        total_marks: e.total_marks ?? 100,
        passing_marks: e.passing_marks ?? null,
        exam_type: e.exam_type || "MCQ",
        status: e.status || "upcoming",
        duration_minutes: e.duration_minutes ?? null,
        instructions: e.instructions?.trim() || null,
      };
      if (e.id) {
        const { error } = await supabase.from("exams").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exams").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Exam saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exams"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Exam deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// EXAM RESULTS
// ─────────────────────────────────────────────────────────────
export function useExamResults(examId?: string) {
  return useQuery({
    queryKey: ["exam-results", examId],
    enabled: !!examId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_results")
        .select("*, students(full_name, email), exams(title, total_marks)")
        .eq("exam_id", examId!)
        .order("marks_obtained", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertExamResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: {
      id?: string;
      exam_id: string;
      student_id: string;
      marks_obtained?: number;
      is_absent?: boolean;
      remarks?: string;
    }) => {
      const payload = {
        exam_id: r.exam_id,
        student_id: r.student_id,
        marks_obtained: r.marks_obtained ?? 0,
        is_absent: r.is_absent ?? false,
        remarks: r.remarks || null,
      };
      if (r.id) {
        const { error } = await supabase.from("exam_results").update(payload).eq("id", r.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_results").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["exam-results", v.exam_id] });
      toast.success("Result saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────
export function useAttendance(batchId?: string, date?: string) {
  return useQuery({
    queryKey: ["attendance", batchId, date],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("*, students(full_name), batches(name)")
        .order("date", { ascending: false });
      if (batchId) query = query.eq("batch_id", batchId);
      if (date) query = query.eq("date", date);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceSummary(batchId?: string) {
  return useQuery({
    queryKey: ["attendance-summary", batchId],
    queryFn: async () => {
      let query = supabase
        .from("v_attendance_summary" as any)
        .select("*")
        .order("date", { ascending: false });
      if (batchId) query = query.eq("batch_id", batchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: {
      id?: string;
      student_id?: string;
      batch_id?: string;
      date?: string;
      status?: string;
      notes?: string;
    }) => {
      // Validate required fields
      if (!a.student_id) {
        throw new Error("Student is required");
      }
      if (!a.batch_id) {
        throw new Error("Batch is required");
      }
      
      const payload = {
        student_id: a.student_id,
        batch_id: a.batch_id,
        date: a.date || new Date().toISOString().split("T")[0],
        status: (a.status as any) || "present",
        notes: a.notes?.trim() || null,
      };
      if (a.id) {
        const { error } = await supabase.from("attendance").update(payload).eq("id", a.id);
        if (error) throw error;
      } else {
        // upsert on (student_id, batch_id, date)
        const { error } = await supabase.from("attendance").upsert(payload, {
          onConflict: "student_id,batch_id,date",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Attendance saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (records: {
      student_id: string;
      batch_id: string;
      date: string;
      status: string;
      notes?: string;
    }[]) => {
      const { error } = await supabase.from("attendance").upsert(
        records.map((r) => ({
          student_id: r.student_id,
          batch_id: r.batch_id,
          date: r.date,
          status: r.status as any,
          notes: r.notes || null,
        })),
        { onConflict: "student_id,batch_id,date" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-summary"] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Attendance marked for all students");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("attendance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["attendance-summary"] });
      toast.success("Attendance record deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// MESSAGES
// ─────────────────────────────────────────────────────────────
export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: {
      sender_id?: string;
      recipient_type: string;
      recipient_id?: string;
      message_type?: string;
      subject: string;
      body: string;
      scheduled_at?: string;
    }) => {
      const payload = {
        sender_id: m.sender_id || null,
        recipient_type: m.recipient_type,
        recipient_id: m.recipient_id || null,
        message_type: m.message_type || "general",
        subject: m.subject,
        body: m.body,
        read: false,
        scheduled_at: m.scheduled_at || null,
        sent_at: m.scheduled_at ? null : new Date().toISOString(),
      };
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message sent");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["messages"] }),
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages"] });
      toast.success("Message deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (userId) query = query.or(`user_id.eq.${userId},user_id.is.null`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId?: string) => {
      let query = supabase.from("notifications").update({ read: true }).eq("read", false);
      if (userId) query = query.eq("user_id", userId);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// ACADEMIC YEARS
// ─────────────────────────────────────────────────────────────
export function useAcademicYears() {
  return useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (y: {
      id?: string;
      name: string;
      start_date: string;
      end_date: string;
      is_current?: boolean;
    }) => {
      const payload = {
        name: y.name,
        start_date: y.start_date,
        end_date: y.end_date,
        is_current: y.is_current ?? false,
      };
      if (y.id) {
        const { error } = await supabase.from("academic_years").update(payload).eq("id", y.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("academic_years").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// ORG SETTINGS
// ─────────────────────────────────────────────────────────────
export function useOrgSettings() {
  return useQuery({
    queryKey: ["org-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("*");
      if (error) throw error;
      // Return as key-value map
      return Object.fromEntries((data ?? []).map((s) => [s.key, s.value])) as Record<string, string | null>;
    },
  });
}

export function useUpdateOrgSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("org_settings")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-settings"] });
      toast.success("Setting updated");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// ROLE PERMISSIONS
// ─────────────────────────────────────────────────────────────
export function useRolePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("role_permissions").select("*");
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateRolePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      can_read: boolean;
      can_create: boolean;
      can_update: boolean;
      can_delete: boolean;
    }) => {
      const { error } = await supabase
        .from("role_permissions")
        .update({
          can_read: p.can_read,
          can_create: p.can_create,
          can_update: p.can_update,
          can_delete: p.can_delete,
        })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role-permissions"] });
      toast.success("Permission updated");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────────────────────
export function useUserProfile(userId?: string) {
  return useQuery({
    queryKey: ["user-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      id: string;
      full_name?: string;
      phone?: string;
      avatar_url?: string;
    }) => {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: p.full_name || null,
          phone: p.phone || null,
          avatar_url: p.avatar_url || null,
        })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["user-profile", v.id] });
      toast.success("Profile updated");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// CLASS SCHEDULES
// ─────────────────────────────────────────────────────────────
export function useClassSchedules(batchId?: string) {
  return useQuery({
    queryKey: ["class-schedules", batchId],
    queryFn: async () => {
      let query = supabase
        .from("class_schedules")
        .select("*, batches(name)")
        .order("day_of_week");
      if (batchId) query = query.eq("batch_id", batchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: {
      id?: string;
      batch_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      room?: string;
      meeting_link?: string;
    }) => {
      const payload = {
        batch_id: s.batch_id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room || null,
        meeting_link: s.meeting_link || null,
      };
      if (s.id) {
        const { error } = await supabase.from("class_schedules").update(payload).eq("id", s.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("class_schedules").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["class-schedules", v.batch_id] });
      qc.invalidateQueries({ queryKey: ["dashboard-metrics"] });
      toast.success("Schedule saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("class_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["class-schedules"] });
      toast.success("Schedule deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// STUDENT-BATCH ENROLLMENT
// ─────────────────────────────────────────────────────────────
export function useStudentBatches(studentId?: string) {
  return useQuery({
    queryKey: ["student-batches", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_batches")
        .select("*, batches(name, status)")
        .eq("student_id", studentId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollStudentInBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ student_id, batch_id }: { student_id: string; batch_id: string }) => {
      const { error } = await supabase.from("student_batches").insert({ student_id, batch_id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["student-batches", v.student_id] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Student enrolled in batch");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useRemoveStudentFromBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("student_batches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["student-batches"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Student removed from batch");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// PARENT-STUDENT LINKS
// ─────────────────────────────────────────────────────────────
export function useParentStudents(parentId?: string) {
  return useQuery({
    queryKey: ["parent-students", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_students")
        .select("*, students(full_name, email, phone, status)")
        .eq("parent_id", parentId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useLinkParentStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parent_id, student_id }: { parent_id: string; student_id: string }) => {
      const { error } = await supabase.from("parent_students").insert({ parent_id, student_id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["parent-students", v.parent_id] });
      toast.success("Parent linked to student");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useUnlinkParentStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("parent_students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["parent-students"] });
      toast.success("Link removed");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// EVENTS / CALENDAR
// ─────────────────────────────────────────────────────────────
export function useEvents(batchId?: string) {
  return useQuery({
    queryKey: ["events", batchId],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (batchId) query = query.eq("batch_id", batchId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: {
      id?: string;
      title: string;
      description?: string;
      event_date: string;
      end_date?: string;
      event_type?: string;
      batch_id?: string;
      academic_year_id?: string;
      created_by?: string;
    }) => {
      const payload = {
        title: e.title,
        description: e.description || null,
        event_date: e.event_date,
        end_date: e.end_date || null,
        event_type: e.event_type || "other",
        batch_id: e.batch_id || null,
        academic_year_id: e.academic_year_id || null,
        created_by: e.created_by || null,
      };
      if (e.id) {
        const { error } = await supabase.from("events").update(payload).eq("id", e.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION SETTINGS
// ─────────────────────────────────────────────────────────────
export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (settings: {
      enable_automatic_mode?: boolean;
      fee_reminder_days_before?: number;
      exam_reminder_days_before?: number;
      enable_absent_alert?: boolean;
      enable_overdue_alert?: boolean;
      enable_birthday_wish?: boolean;
      enable_fee_reminder?: boolean;
      enable_exam_reminder?: boolean;
    }) => {
      // Get existing settings first
      const { data: existing } = await supabase
        .from("notification_settings")
        .select("id")
        .limit(1)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("notification_settings")
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({
            ...settings,
            enable_automatic_mode: settings.enable_automatic_mode ?? false,
            fee_reminder_days_before: settings.fee_reminder_days_before ?? 3,
            exam_reminder_days_before: settings.exam_reminder_days_before ?? 1,
            enable_absent_alert: settings.enable_absent_alert ?? true,
            enable_overdue_alert: settings.enable_overdue_alert ?? true,
            enable_birthday_wish: settings.enable_birthday_wish ?? false,
            enable_fee_reminder: settings.enable_fee_reminder ?? true,
            enable_exam_reminder: settings.enable_exam_reminder ?? true,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-settings"] });
      toast.success("Notification settings updated");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// COMMUNICATION LOGS
// ─────────────────────────────────────────────────────────────
export function useCommunicationLogs(filters?: {
  student_id?: string;
  parent_id?: string;
  message_type?: "fee" | "overdue" | "exam" | "absent" | "birthday";
  delivery_status?: "pending" | "sent" | "failed";
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ["communication-logs", filters],
    queryFn: async () => {
      let query = supabase
        .from("communication_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.student_id) {
        query = query.eq("student_id", filters.student_id);
      }
      if (filters?.parent_id) {
        query = query.eq("parent_id", filters.parent_id);
      }
      if (filters?.message_type) {
        query = query.eq("message_type", filters.message_type);
      }
      if (filters?.delivery_status) {
        query = query.eq("delivery_status", filters.delivery_status);
      }
      if (filters?.date_from) {
        query = query.gte("created_at", filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte("created_at", filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunicationLogStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["communication-log-stats", dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from("communication_logs")
        .select("delivery_status, message_type");

      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("created_at", dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        sent: 0,
        failed: 0,
        pending: 0,
        by_type: {
          fee: 0,
          overdue: 0,
          exam: 0,
          absent: 0,
          birthday: 0,
        } as Record<string, number>,
      };

      data?.forEach((log) => {
        if (log.delivery_status === "sent") stats.sent++;
        else if (log.delivery_status === "failed") stats.failed++;
        else if (log.delivery_status === "pending") stats.pending++;

        if (log.message_type && stats.by_type[log.message_type] !== undefined) {
          stats.by_type[log.message_type]++;
        }
      });

      return stats;
    },
  });
}

// ─────────────────────────────────────────────────────────────
// RUN AUTOMATED NOTIFICATIONS (Manual Trigger)
// ─────────────────────────────────────────────────────────────
export function useRunAutomatedNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("run-automated-notifications");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communication-logs"] });
      qc.invalidateQueries({ queryKey: ["communication-log-stats"] });
      toast.success("Automated notifications processed");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// TASKS
// ─────────────────────────────────────────────────────────────
export function useTasks(filters?: {
  assigned_to?: string;
  status?: string;
  priority?: string;
  due_date_from?: string;
  due_date_to?: string;
  student_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("task_summary")
        .select("*")
        .order("due_date", { ascending: true });

      if (filters?.assigned_to) {
        query = query.eq("assigned_to_user_id", filters.assigned_to);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.priority) {
        query = query.eq("priority", filters.priority);
      }
      if (filters?.due_date_from) {
        query = query.gte("due_date", filters.due_date_from);
      }
      if (filters?.due_date_to) {
        query = query.lte("due_date", filters.due_date_to);
      }
      if (filters?.student_id) {
        query = query.eq("related_student_id", filters.student_id);
      }
      if (filters?.search) {
        query = query.ilike("title", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("task_summary")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useMyTasks() {
  return useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_summary")
        .select("*")
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_summary")
        .select("*")
        .eq("is_overdue", true)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useHighPriorityTasks() {
  return useQuery({
    queryKey: ["high-priority-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_summary")
        .select("*")
        .eq("priority", "high")
        .in("status", ["pending", "in_progress"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("status, priority, due_date")
        .eq("assigned_to_user_id", user.user.id);

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      return {
        total_assigned: tasks?.length || 0,
        pending: tasks?.filter((t) => t.status === "pending").length || 0,
        in_progress: tasks?.filter((t) => t.status === "in_progress").length || 0,
        completed: tasks?.filter((t) => t.status === "completed").length || 0,
        overdue: tasks?.filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date < today).length || 0,
        high_priority: tasks?.filter((t) => t.priority === "high" && t.status !== "completed" && t.status !== "cancelled").length || 0,
        due_today: tasks?.filter((t) => t.status !== "completed" && t.status !== "cancelled" && t.due_date === today).length || 0,
      };
    },
  });
}

export function useUpsertTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      id?: string;
      title: string;
      description?: string;
      assigned_to_user_id: string;
      related_student_id?: string;
      related_batch_id?: string;
      related_fee_id?: string;
      priority?: "low" | "medium" | "high";
      status?: "pending" | "in_progress" | "completed" | "cancelled";
      due_date: string;
      reminder_date?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const payload = {
        title: task.title,
        description: task.description || null,
        assigned_to_user_id: task.assigned_to_user_id,
        assigned_by_user_id: user.user.id,
        related_student_id: task.related_student_id || null,
        related_batch_id: task.related_batch_id || null,
        related_fee_id: task.related_fee_id || null,
        priority: task.priority || "medium",
        status: task.status || "pending",
        due_date: task.due_date,
        reminder_date: task.reminder_date || null,
      };

      if (task.id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["overdue-tasks"] });
      qc.invalidateQueries({ queryKey: ["high-priority-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Task saved");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "in_progress" | "completed" | "cancelled" }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["overdue-tasks"] });
      qc.invalidateQueries({ queryKey: ["high-priority-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Task status updated");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["overdue-tasks"] });
      qc.invalidateQueries({ queryKey: ["high-priority-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Task deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useCreateFollowUpTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      feeId,
      studentId,
      title,
      description,
      assignedToUserId,
    }: {
      feeId: string;
      studentId: string;
      title?: string;
      description?: string;
      assignedToUserId?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      // Get fee details
      const { data: fee, error: feeError } = await supabase
        .from("fees")
        .select("*, students(full_name)")
        .eq("id", feeId)
        .single();

      if (feeError) throw feeError;

      const taskTitle = title || `Fee Follow-up: ${(fee as any).students?.full_name || "Student"}`;
      const taskDescription = description || `Follow up on pending fee of ₹${(fee as any).amount} due on ${(fee as any).due_date}.`;

      const payload = {
        title: taskTitle,
        description: taskDescription,
        assigned_to_user_id: assignedToUserId || user.user.id,
        assigned_by_user_id: user.user.id,
        related_student_id: studentId,
        related_fee_id: feeId,
        priority: "high" as const,
        status: "pending" as const,
        due_date: new Date().toISOString().split("T")[0],
      };

      const { error } = await supabase.from("tasks").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["my-tasks"] });
      qc.invalidateQueries({ queryKey: ["task-stats"] });
      toast.success("Follow-up task created");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// TASK COMMENTS
// ─────────────────────────────────────────────────────────────
export function useTaskComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      const { data, error } = await supabase
        .from("task_comments")
        .select("*, user_profiles(full_name)")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        user_name: c.user_profiles?.full_name || "Unknown",
      }));
    },
    enabled: !!taskId,
  });
}

export function useAddTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("task_comments").insert({
        task_id: taskId,
        user_id: user.user.id,
        comment,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["task-comments", variables.taskId] });
      toast.success("Comment added");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

export function useDeleteTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase.from("task_comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["task-comments", variables.taskId] });
      toast.success("Comment deleted");
    },
    onError: (e: any) => toast.error(getSafeErrorMessage(e)),
  });
}

// ─────────────────────────────────────────────────────────────
// USER PROFILES (for task assignment dropdown)
// ─────────────────────────────────────────────────────────────
export function useUserProfiles() {
  return useQuery({
    queryKey: ["user-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, full_name, role")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
