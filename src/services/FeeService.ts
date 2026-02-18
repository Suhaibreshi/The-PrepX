import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Fee = Database["public"]["Tables"]["fees"]["Row"];
type FeeInsert = Database["public"]["Tables"]["fees"]["Insert"];
type FeeUpdate = Database["public"]["Tables"]["fees"]["Update"];

export interface CreateFeeDTO {
  student_id: string;
  batch_id?: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status?: "paid" | "pending" | "overdue";
  description?: string;
}

export interface UpdateFeeDTO extends Partial<CreateFeeDTO> {
  id: string;
}

export const FeeService = {
  async getAll(): Promise<Fee[]> {
    const { data, error } = await supabase
      .from("fees")
      .select("*, students(full_name, email), batches(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Fee | null> {
    const { data, error } = await supabase
      .from("fees")
      .select("*, students(full_name, email), batches(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getByStudentId(studentId: string): Promise<Fee[]> {
    const { data, error } = await supabase
      .from("fees")
      .select("*")
      .eq("student_id", studentId)
      .order("due_date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(fee: CreateFeeDTO): Promise<Fee> {
    const payload: FeeInsert = {
      student_id: fee.student_id,
      batch_id: fee.batch_id || null,
      amount: fee.amount,
      due_date: fee.due_date,
      paid_date: fee.paid_date || null,
      status: fee.status || "pending",
      description: fee.description || null,
    };

    const { data, error } = await supabase
      .from("fees")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(fee: UpdateFeeDTO): Promise<Fee> {
    const { id, ...payload } = fee;
    
    const { data, error } = await supabase
      .from("fees")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsPaid(id: string): Promise<Fee> {
    const { data, error } = await supabase
      .from("fees")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("fees")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getPendingFees(): Promise<Fee[]> {
    const { data, error } = await supabase
      .from("fees")
      .select("*, students(full_name, email)")
      .eq("status", "pending")
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getOverdueFees(): Promise<Fee[]> {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("fees")
      .select("*, students(full_name, email)")
      .eq("status", "pending")
      .lt("due_date", today)
      .order("due_date", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getTotalPending(): Promise<number> {
    const { data, error } = await supabase
      .from("fees")
      .select("amount")
      .eq("status", "pending");

    if (error) throw error;
    return (data || []).reduce((sum, fee) => sum + Number(fee.amount), 0);
  },

  async getTotalCollected(): Promise<number> {
    const { data, error } = await supabase
      .from("fees")
      .select("amount")
      .eq("status", "paid");

    if (error) throw error;
    return (data || []).reduce((sum, fee) => sum + Number(fee.amount), 0);
  },
};
