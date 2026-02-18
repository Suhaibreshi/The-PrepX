import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];

export interface CreateStudentDTO {
  full_name: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive" | "alumni";
  date_of_birth?: string;
  gender?: string;
  address?: string;
  notes?: string;
}

export interface UpdateStudentDTO extends Partial<CreateStudentDTO> {
  id: string;
}

export const StudentService = {
  async getAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(student: CreateStudentDTO): Promise<Student> {
    const payload: StudentInsert = {
      full_name: student.full_name,
      email: student.email || null,
      phone: student.phone || null,
      status: student.status || "active",
      date_of_birth: student.date_of_birth || null,
      gender: student.gender || null,
      address: student.address || null,
      notes: student.notes || null,
    };

    const { data, error } = await supabase
      .from("students")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(student: UpdateStudentDTO): Promise<Student> {
    const { id, ...payload } = student;
    
    const { data, error } = await supabase
      .from("students")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async search(query: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order("full_name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByStatus(status: Student["status"]): Promise<Student[]> {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getCount(): Promise<number> {
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    return count || 0;
  },

  async getActiveCount(): Promise<number> {
    const { count, error } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    if (error) throw error;
    return count || 0;
  },
};
