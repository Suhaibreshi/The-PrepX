import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
type AttendanceInsert = Database["public"]["Tables"]["attendance"]["Insert"];
type AttendanceUpdate = Database["public"]["Tables"]["attendance"]["Update"];

export interface CreateAttendanceDTO {
  student_id: string;
  batch_id: string;
  date: string;
  status: "present" | "absent" | "late";
}

export interface UpdateAttendanceDTO extends Partial<CreateAttendanceDTO> {
  id: string;
}

export interface BulkAttendanceDTO {
  batch_id: string;
  date: string;
  records: { student_id: string; status: "present" | "absent" | "late" }[];
}

export const AttendanceService = {
  async getAll(batchId?: string, date?: string): Promise<Attendance[]> {
    let query = supabase
      .from("attendance")
      .select("*, students(full_name), batches(name)");

    if (batchId) query = query.eq("batch_id", batchId);
    if (date) query = query.eq("date", date);

    const { data, error } = await query.order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Attendance | null> {
    const { data, error } = await supabase
      .from("attendance")
      .select("*, students(full_name), batches(name)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(attendance: CreateAttendanceDTO): Promise<Attendance> {
    const payload: AttendanceInsert = {
      student_id: attendance.student_id,
      batch_id: attendance.batch_id,
      date: attendance.date,
      status: attendance.status,
    };

    const { data, error } = await supabase
      .from("attendance")
      .upsert(payload, { onConflict: "student_id,batch_id,date" })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async bulkCreate(attendance: BulkAttendanceDTO): Promise<void> {
    const records = attendance.records.map((record) => ({
      student_id: record.student_id,
      batch_id: attendance.batch_id,
      date: attendance.date,
      status: record.status,
    }));

    const { error } = await supabase
      .from("attendance")
      .upsert(records, { onConflict: "student_id,batch_id,date" });

    if (error) throw error;
  },

  async update(attendance: UpdateAttendanceDTO): Promise<Attendance> {
    const { id, ...payload } = attendance;
    
    const { data, error } = await supabase
      .from("attendance")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getSummaryByBatch(batchId: string, fromDate: string, toDate: string) {
    const { data, error } = await supabase
      .from("attendance")
      .select("status")
      .eq("batch_id", batchId)
      .gte("date", fromDate)
      .lte("date", toDate);

    if (error) throw error;

    const records = data || [];
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;
    const total = records.length;

    return {
      present,
      absent,
      late,
      total,
      presentPercentage: total > 0 ? (present / total) * 100 : 0,
    };
  },
};
