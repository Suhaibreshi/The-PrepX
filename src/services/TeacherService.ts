import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
type TeacherInsert = Database["public"]["Tables"]["teachers"]["Insert"];
type TeacherUpdate = Database["public"]["Tables"]["teachers"]["Update"];

export interface CreateTeacherDTO {
  full_name: string;
  email?: string;
  phone?: string;
  subject?: string;
  status?: "active" | "inactive" | "alumni";
}

export interface UpdateTeacherDTO extends Partial<CreateTeacherDTO> {
  id: string;
}

export const TeacherService = {
  async getAll(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(teacher: CreateTeacherDTO): Promise<Teacher> {
    const payload: TeacherInsert = {
      full_name: teacher.full_name,
      email: teacher.email || null,
      phone: teacher.phone || null,
      subject: teacher.subject || null,
      status: teacher.status || "active",
    };

    const { data, error } = await supabase
      .from("teachers")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(teacher: UpdateTeacherDTO): Promise<Teacher> {
    const { id, ...payload } = teacher;
    
    const { data, error } = await supabase
      .from("teachers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getBySubject(subject: string): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("subject", subject)
      .eq("status", "active");

    if (error) throw error;
    return data || [];
  },

  async getActiveTeachers(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from("teachers")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  },
};
