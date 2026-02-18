import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Batch = Database["public"]["Tables"]["batches"]["Row"];
type BatchInsert = Database["public"]["Tables"]["batches"]["Insert"];
type BatchUpdate = Database["public"]["Tables"]["batches"]["Update"];

export interface CreateBatchDTO {
  name: string;
  course_id?: string;
  teacher_id?: string;
  status?: "active" | "inactive" | "alumni";
  start_date?: string;
  end_date?: string;
  schedule?: string;
}

export interface UpdateBatchDTO extends Partial<CreateBatchDTO> {
  id: string;
}

export const BatchService = {
  async getAll(): Promise<Batch[]> {
    const { data, error } = await supabase
      .from("batches")
      .select("*, courses(name), teachers(full_name, subject)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Batch | null> {
    const { data, error } = await supabase
      .from("batches")
      .select("*, courses(name), teachers(full_name, subject)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(batch: CreateBatchDTO): Promise<Batch> {
    const payload: BatchInsert = {
      name: batch.name,
      course_id: batch.course_id || null,
      teacher_id: batch.teacher_id || null,
      status: batch.status || "active",
      start_date: batch.start_date || null,
      end_date: batch.end_date || null,
      schedule: batch.schedule || null,
    };

    const { data, error } = await supabase
      .from("batches")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(batch: UpdateBatchDTO): Promise<Batch> {
    const { id, ...payload } = batch;
    
    const { data, error } = await supabase
      .from("batches")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("batches")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getActiveBatches(): Promise<Batch[]> {
    const { data, error } = await supabase
      .from("batches")
      .select("*, courses(name), teachers(full_name)")
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByCourseId(courseId: string): Promise<Batch[]> {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .eq("course_id", courseId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByTeacherId(teacherId: string): Promise<Batch[]> {
    const { data, error } = await supabase
      .from("batches")
      .select("*, courses(name)")
      .eq("teacher_id", teacherId)
      .eq("status", "active")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getStudentCount(batchId: string): Promise<number> {
    const { count, error } = await supabase
      .from("student_batches")
      .select("*", { count: "exact", head: true })
      .eq("batch_id", batchId);

    if (error) throw error;
    return count || 0;
  },

  async enrollStudent(batchId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from("student_batches")
      .insert({ batch_id: batchId, student_id: studentId });

    if (error) throw error;
  },

  async unenrollStudent(batchId: string, studentId: string): Promise<void> {
    const { error } = await supabase
      .from("student_batches")
      .delete()
      .eq("batch_id", batchId)
      .eq("student_id", studentId);

    if (error) throw error;
  },
};
