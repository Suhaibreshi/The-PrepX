import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database["public"]["Tables"]["exams"]["Row"];
type ExamInsert = Database["public"]["Tables"]["exams"]["Insert"];
type ExamUpdate = Database["public"]["Tables"]["exams"]["Update"];

type ExamResult = Database["public"]["Tables"]["exam_results"]["Row"];
type ExamResultInsert = Database["public"]["Tables"]["exam_results"]["Insert"];
type ExamResultUpdate = Database["public"]["Tables"]["exam_results"]["Update"];

export interface CreateExamDTO {
  title: string;
  batch_id?: string;
  exam_date?: string;
  total_marks?: number;
  passing_marks?: number;
  exam_type?: string;
  status?: string;
  duration_minutes?: number;
  instructions?: string;
}

export interface UpdateExamDTO extends Partial<CreateExamDTO> {
  id: string;
}

export interface CreateExamResultDTO {
  exam_id: string;
  student_id: string;
  marks_obtained?: number;
  is_absent?: boolean;
  remarks?: string;
}

export interface UpdateExamResultDTO extends Partial<CreateExamResultDTO> {
  id: string;
}

export const ExamService = {
  async getAllExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, batches(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getExamById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from("exams")
      .select("*, batches(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createExam(exam: CreateExamDTO): Promise<Exam> {
    const payload: ExamInsert = {
      title: exam.title,
      batch_id: exam.batch_id || null,
      exam_date: exam.exam_date || null,
      total_marks: exam.total_marks ?? 100,
      passing_marks: exam.passing_marks ?? null,
      exam_type: exam.exam_type || "MCQ",
      status: exam.status || "upcoming",
      duration_minutes: exam.duration_minutes ?? null,
      instructions: exam.instructions || null,
    };

    const { data, error } = await supabase
      .from("exams")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExam(exam: UpdateExamDTO): Promise<Exam> {
    const { id, ...payload } = exam;
    
    const { data, error } = await supabase
      .from("exams")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExam(id: string): Promise<void> {
    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getUpcomingExams(): Promise<Exam[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("exams")
      .select("*, batches(name)")
      .gte("exam_date", today)
      .eq("status", "upcoming")
      .order("exam_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getExamResults(examId: string): Promise<ExamResult[]> {
    const { data, error } = await supabase
      .from("exam_results")
      .select("*, students(full_name, email), exams(title, total_marks)")
      .eq("exam_id", examId)
      .order("marks_obtained", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getResultsByStudent(studentId: string): Promise<ExamResult[]> {
    const { data, error } = await supabase
      .from("exam_results")
      .select("*, exams(title, total_marks)")
      .eq("student_id", studentId)
      .order("graded_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createExamResult(result: CreateExamResultDTO): Promise<ExamResult> {
    const payload: ExamResultInsert = {
      exam_id: result.exam_id,
      student_id: result.student_id,
      marks_obtained: result.marks_obtained ?? 0,
      is_absent: result.is_absent ?? false,
      remarks: result.remarks || null,
    };

    const { data, error } = await supabase
      .from("exam_results")
      .upsert(payload, { onConflict: "exam_id,student_id" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkCreateExamResults(
    examId: string,
    results: { student_id: string; marks_obtained: number; is_absent?: boolean }[]
  ): Promise<void> {
    const records = results.map((r) => ({
      exam_id: examId,
      student_id: r.student_id,
      marks_obtained: r.marks_obtained ?? 0,
      is_absent: r.is_absent ?? false,
    }));

    const { error } = await supabase
      .from("exam_results")
      .upsert(records, { onConflict: "exam_id,student_id" });

    if (error) throw error;
  },

  async updateExamResult(result: UpdateExamResultDTO): Promise<ExamResult> {
    const { id, ...payload } = result;
    
    const { data, error } = await supabase
      .from("exam_results")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExamResult(id: string): Promise<void> {
    const { error } = await supabase
      .from("exam_results")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
