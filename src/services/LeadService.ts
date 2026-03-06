import { supabase } from "@/integrations/supabase/client";
import type { 
  Lead, 
  LeadSummary, 
  LeadStats, 
  MonthlyAdmissionsTrend,
  CreateLeadDTO, 
  UpdateLeadDTO, 
  ConvertLeadDTO,
  LeadFollowUp,
  LeadSource,
  LeadStage
} from "@/types/database";
import type { Database } from "@/integrations/supabase/types";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];
type LeadSummaryRow = Database["public"]["Views"]["lead_summary"]["Row"];

// ─────────────────────────────────────────────────────────────
// LEAD SERVICE
// ─────────────────────────────────────────────────────────────

export interface LeadFilters {
  stage?: LeadStage;
  counselor_id?: string;
  lead_source?: LeadSource;
  date_from?: string;
  date_to?: string;
  search?: string;
  follow_up_today?: boolean;
  overdue_follow_up?: boolean;
}

export interface LeadPagination {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface LeadListResult {
  data: LeadSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const LeadService = {
  // Get all leads with filters and pagination
  async getAll(filters?: LeadFilters, pagination?: LeadPagination): Promise<LeadListResult> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 10;
    const sortBy = pagination?.sortBy || "created_at";
    const sortOrder = pagination?.sortOrder || "desc";
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("lead_summary")
      .select("*", { count: "exact" });

    // Apply filters
    if (filters?.stage) {
      query = query.eq("stage", filters.stage);
    }
    if (filters?.counselor_id) {
      query = query.eq("assigned_counselor_id", filters.counselor_id);
    }
    if (filters?.lead_source) {
      query = query.eq("lead_source", filters.lead_source);
    }
    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to);
    }
    if (filters?.search) {
      query = query.or(`student_name.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }
    if (filters?.follow_up_today) {
      query = query.eq("is_follow_up_today", true);
    }
    if (filters?.overdue_follow_up) {
      query = query.eq("is_overdue_follow_up", true);
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder === "asc" });
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data || []) as unknown as LeadSummary[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  // Get lead by ID
  async getById(id: string): Promise<LeadSummary | null> {
    const { data, error } = await supabase
      .from("lead_summary")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as LeadSummary;
  },

  // Create lead
  async create(lead: CreateLeadDTO): Promise<Lead> {
    const payload: LeadInsert = {
      student_name: lead.student_name,
      parent_name: lead.parent_name || null,
      phone_number: lead.phone_number,
      email: lead.email || null,
      course_interested: lead.course_interested || null,
      lead_source: lead.lead_source,
      assigned_counselor_id: lead.assigned_counselor_id || null,
      stage: lead.stage || "inquiry",
      follow_up_date: lead.follow_up_date || null,
      remarks: lead.remarks || null,
    };

    const { data, error } = await supabase
      .from("leads")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Update lead
  async update(lead: UpdateLeadDTO): Promise<Lead> {
    const { id, ...payload } = lead;
    
    const updatePayload: LeadUpdate = {
      ...payload,
      parent_name: payload.parent_name || null,
      email: payload.email || null,
      course_interested: payload.course_interested || null,
      assigned_counselor_id: payload.assigned_counselor_id || null,
      follow_up_date: payload.follow_up_date || null,
      remarks: payload.remarks || null,
    };
    
    const { data, error } = await supabase
      .from("leads")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Update lead stage
  async updateStage(id: string, stage: LeadStage): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .update({ stage })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Assign counselor
  async assignCounselor(id: string, counselorId: string | null): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .update({ assigned_counselor_id: counselorId })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Set follow-up date
  async setFollowUpDate(id: string, followUpDate: string | null): Promise<Lead> {
    const { data, error } = await supabase
      .from("leads")
      .update({ follow_up_date: followUpDate })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  },

  // Delete lead
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // ─────────────────────────────────────────────────────────────
  // CONVERSION LOGIC
  // ─────────────────────────────────────────────────────────────

  // Convert lead to student
  async convertToStudent(dto: ConvertLeadDTO): Promise<{ studentId: string; lead: LeadSummary }> {
    const { data, error } = await supabase.rpc("convert_lead_to_student", {
      p_lead_id: dto.lead_id,
      p_email: dto.email || null,
      p_date_of_birth: dto.date_of_birth || null,
      p_gender: dto.gender || null,
      p_address: dto.address || null,
    });

    if (error) throw error;

    // Get the updated lead
    const lead = await this.getById(dto.lead_id);

    return { 
      studentId: data as string, 
      lead: lead as LeadSummary 
    };
  },

  // Mark lead as lost (admin only)
  async markAsLost(id: string, reason?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("mark_lead_as_lost", {
      p_lead_id: id,
      p_reason: reason || null,
    });

    if (error) throw error;
    return data as boolean;
  },

  // Check if phone number already exists
  async checkDuplicatePhone(phone: string): Promise<{ exists: boolean; type: "lead" | "student" | null; name?: string }> {
    // Check in leads
    const { data: leadData } = await supabase
      .from("leads")
      .select("student_name, stage")
      .eq("phone_number", phone)
      .maybeSingle();

    if (leadData) {
      return { exists: true, type: "lead", name: leadData.student_name };
    }

    // Check in students
    const { data: studentData } = await supabase
      .from("students")
      .select("full_name")
      .eq("phone", phone)
      .maybeSingle();

    if (studentData) {
      return { exists: true, type: "student", name: studentData.full_name };
    }

    return { exists: false, type: null };
  },

  // ─────────────────────────────────────────────────────────────
  // FOLLOW-UP TRACKING
  // ─────────────────────────────────────────────────────────────

  // Get today's follow-ups
  async getTodaysFollowUps(): Promise<LeadFollowUp[]> {
    const { data, error } = await supabase.rpc("get_todays_follow_ups");

    if (error) {
      // Fallback to direct query if RPC not available
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("lead_summary")
        .select("*")
        .eq("is_follow_up_today", true);

      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((l: LeadSummaryRow) => ({
        id: l.id!,
        student_name: l.student_name!,
        parent_name: l.parent_name,
        phone_number: l.phone_number!,
        course_interested: l.course_interested,
        stage: l.stage! as LeadStage,
        remarks: l.remarks,
        counselor_name: l.counselor_name,
      }));
    }

    return (data || []) as unknown as LeadFollowUp[];
  },

  // Get overdue follow-ups
  async getOverdueFollowUps(): Promise<LeadFollowUp[]> {
    const { data, error } = await supabase.rpc("get_overdue_follow_ups");

    if (error) {
      // Fallback to direct query if RPC not available
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("lead_summary")
        .select("*")
        .eq("is_overdue_follow_up", true);

      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map((l: LeadSummaryRow) => ({
        id: l.id!,
        student_name: l.student_name!,
        parent_name: l.parent_name,
        phone_number: l.phone_number!,
        course_interested: l.course_interested,
        stage: l.stage! as LeadStage,
        follow_up_date: l.follow_up_date,
        remarks: l.remarks,
        counselor_name: l.counselor_name,
        days_overdue: l.follow_up_date 
          ? Math.floor((new Date().getTime() - new Date(l.follow_up_date).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
    }

    return (data || []) as unknown as LeadFollowUp[];
  },

  // ─────────────────────────────────────────────────────────────
  // ANALYTICS & STATISTICS
  // ─────────────────────────────────────────────────────────────

  // Get lead statistics
  async getStats(startDate?: string, endDate?: string): Promise<LeadStats> {
    const { data, error } = await supabase.rpc("get_lead_stats", {
      p_start_date: startDate || null,
      p_end_date: endDate || null,
    });

    if (error) {
      // Fallback: calculate stats manually
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("stage, lead_source, follow_up_date, created_at");

      if (leadsError) throw leadsError;

      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
      
      const filteredLeads = (leads || []).filter(l => {
        if (!startDate && !endDate) {
          return l.created_at >= monthStart;
        }
        if (startDate && l.created_at < startDate) return false;
        if (endDate && l.created_at > endDate) return false;
        return true;
      });

      const totalInquiries = filteredLeads.length;
      const converted = filteredLeads.filter(l => l.stage === "converted").length;
      const lost = filteredLeads.filter(l => l.stage === "lost").length;
      const inPipeline = filteredLeads.filter(l => ["inquiry", "follow_up", "demo"].includes(l.stage)).length;

      // Count by source
      const sourceMap = new Map<LeadSource, number>();
      filteredLeads.forEach(l => {
        sourceMap.set(l.lead_source, (sourceMap.get(l.lead_source) || 0) + 1);
      });
      const bySource = Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count }));

      // Count by stage
      const stageMap = new Map<LeadStage, number>();
      filteredLeads.forEach(l => {
        stageMap.set(l.stage, (stageMap.get(l.stage) || 0) + 1);
      });
      const byStage = Array.from(stageMap.entries()).map(([stage, count]) => ({ stage, count }));

      // Follow-ups
      const allLeads = leads || [];
      const followUpsToday = allLeads.filter(l => 
        l.follow_up_date === today && !["converted", "lost"].includes(l.stage)
      ).length;
      const overdueFollowUps = allLeads.filter(l => 
        l.follow_up_date && l.follow_up_date < today && !["converted", "lost"].includes(l.stage)
      ).length;

      return {
        total_inquiries: totalInquiries,
        converted,
        lost,
        in_pipeline: inPipeline,
        conversion_rate: totalInquiries > 0 ? Math.round((converted / totalInquiries) * 10000) / 100 : 0,
        lost_rate: totalInquiries > 0 ? Math.round((lost / totalInquiries) * 10000) / 100 : 0,
        by_source: bySource,
        by_stage: byStage,
        follow_ups_today: followUpsToday,
        overdue_follow_ups: overdueFollowUps,
      };
    }

    return data as unknown as LeadStats;
  },

  // Get monthly admissions trend
  async getMonthlyTrend(months: number = 6): Promise<MonthlyAdmissionsTrend[]> {
    const { data, error } = await supabase.rpc("get_monthly_admissions_trend", {
      p_months: months,
    });

    if (error) {
      // Fallback: calculate trend manually
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (months - 1));
      startDate.setDate(1);

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("stage, created_at")
        .gte("created_at", startDate.toISOString());

      if (leadsError) throw leadsError;

      // Group by month
      const monthMap = new Map<string, { inquiries: number; converted: number }>();
      
      (leads || []).forEach(l => {
        const date = new Date(l.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, { inquiries: 0, converted: 0 });
        }
        
        const entry = monthMap.get(monthKey)!;
        entry.inquiries++;
        if (l.stage === "converted") entry.converted++;
      });

      return Array.from(monthMap.entries())
        .map(([monthKey, data]) => ({
          month: new Date(monthKey + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          month_sort: monthKey,
          inquiries: data.inquiries,
          converted: data.converted,
        }))
        .sort((a, b) => a.month_sort.localeCompare(b.month_sort));
    }

    return (data || []) as unknown as MonthlyAdmissionsTrend[];
  },

  // Get leads by stage (for kanban view)
  async getLeadsByStage(): Promise<Record<LeadStage, LeadSummary[]>> {
    const { data, error } = await supabase
      .from("lead_summary")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const stages: LeadStage[] = ["inquiry", "follow_up", "demo", "converted", "lost"];
    const result: Record<LeadStage, LeadSummary[]> = {
      inquiry: [],
      follow_up: [],
      demo: [],
      converted: [],
      lost: [],
    };

    (data || []).forEach((lead: LeadSummaryRow) => {
      if (lead.stage) {
        result[lead.stage as LeadStage].push(lead as unknown as LeadSummary);
      }
    });

    return result;
  },

  // Get leads count by source
  async getLeadsBySource(): Promise<{ source: LeadSource; count: number }[]> {
    const { data, error } = await supabase
      .from("leads")
      .select("lead_source");

    if (error) throw error;

    const sourceMap = new Map<LeadSource, number>();
    (data || []).forEach(l => {
      sourceMap.set(l.lead_source, (sourceMap.get(l.lead_source) || 0) + 1);
    });

    return Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  },

  // ─────────────────────────────────────────────────────────────
  // BULK OPERATIONS
  // ─────────────────────────────────────────────────────────────

  // Bulk update stage
  async bulkUpdateStage(ids: string[], stage: LeadStage): Promise<void> {
    const { error } = await supabase
      .from("leads")
      .update({ stage })
      .in("id", ids);

    if (error) throw error;
  },

  // Bulk assign counselor
  async bulkAssignCounselor(ids: string[], counselorId: string | null): Promise<void> {
    const { error } = await supabase
      .from("leads")
      .update({ assigned_counselor_id: counselorId })
      .in("id", ids);

    if (error) throw error;
  },

  // Export leads to CSV
  async exportToCSV(filters?: LeadFilters): Promise<string> {
    const result = await this.getAll(filters, { page: 1, pageSize: 1000, sortBy: "created_at", sortOrder: "desc" });
    
    const headers = [
      "Student Name",
      "Parent Name",
      "Phone",
      "Email",
      "Course Interested",
      "Source",
      "Stage",
      "Counselor",
      "Follow-up Date",
      "Remarks",
      "Created At",
    ];

    const rows = result.data.map(lead => [
      lead.student_name,
      lead.parent_name || "",
      lead.phone_number,
      lead.email || "",
      lead.course_interested || "",
      lead.lead_source,
      lead.stage,
      lead.counselor_name || "",
      lead.follow_up_date || "",
      lead.remarks || "",
      new Date(lead.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return csv;
  },
};
