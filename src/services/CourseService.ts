import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"];

export interface CreateCourseDTO {
  name: string;
  description?: string;
  duration_weeks?: number;
  fee_amount?: number;
  fee_frequency?: string;
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  id: string;
}

export const CourseService = {
  async getAll(): Promise<Course[]> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Course | null> {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(course: CreateCourseDTO): Promise<Course> {
    const payload: CourseInsert = {
      name: course.name,
      description: course.description || null,
      duration_weeks: course.duration_weeks || null,
      fee_amount: course.fee_amount || null,
      fee_frequency: course.fee_frequency || null,
    };

    const { data, error } = await supabase
      .from("courses")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(course: UpdateCourseDTO): Promise<Course> {
    const { id, ...payload } = course;
    
    const { data, error } = await supabase
      .from("courses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  },
};
