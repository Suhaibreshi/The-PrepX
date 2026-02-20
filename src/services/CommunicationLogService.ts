import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { 
  CommunicationLog, 
  CreateCommunicationLogDTO,
  CommunicationMessageType,
  DeliveryStatus,
  TriggerSource
} from "@/types/database";

type CommunicationLogRow = Database["public"]["Tables"]["communication_logs"]["Row"];
type CommunicationLogInsert = Database["public"]["Tables"]["communication_logs"]["Insert"];

export interface CommunicationLogFilters {
  student_id?: string;
  parent_id?: string;
  message_type?: CommunicationMessageType;
  delivery_status?: DeliveryStatus;
  triggered_by?: TriggerSource;
  date_from?: string;
  date_to?: string;
}

export interface CommunicationLogStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  by_type: Record<CommunicationMessageType, number>;
}

/**
 * Convert database row to CommunicationLog type
 */
function rowToCommunicationLog(row: CommunicationLogRow): CommunicationLog {
  return {
    id: row.id,
    student_id: row.student_id,
    parent_id: row.parent_id,
    message_type: row.message_type as CommunicationMessageType,
    message_content: row.message_content,
    delivery_status: row.delivery_status as DeliveryStatus,
    triggered_by: row.triggered_by as TriggerSource,
    error_message: row.error_message,
    provider_response: row.provider_response,
    related_entity_id: row.related_entity_id,
    related_entity_type: row.related_entity_type,
    sent_at: row.sent_at,
    created_at: row.created_at,
  };
}

/**
 * Service for managing communication logs
 */
export const CommunicationLogService = {
  /**
   * Get all communication logs with optional filters
   */
  async getAll(filters?: CommunicationLogFilters): Promise<CommunicationLog[]> {
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
    if (filters?.triggered_by) {
      query = query.eq("triggered_by", filters.triggered_by);
    }
    if (filters?.date_from) {
      query = query.gte("created_at", filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(rowToCommunicationLog);
  },

  /**
   * Get a single communication log by ID
   */
  async getById(id: string): Promise<CommunicationLog | null> {
    const { data, error } = await supabase
      .from("communication_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data ? rowToCommunicationLog(data) : null;
  },

  /**
   * Create a new communication log entry
   */
  async create(log: CreateCommunicationLogDTO): Promise<CommunicationLog> {
    const insertData: CommunicationLogInsert = {
      student_id: log.student_id ?? null,
      parent_id: log.parent_id ?? null,
      message_type: log.message_type,
      message_content: log.message_content,
      delivery_status: log.delivery_status || "pending",
      triggered_by: log.triggered_by || "automatic",
      error_message: log.error_message ?? null,
      provider_response: log.provider_response as Database["public"]["Tables"]["communication_logs"]["Insert"]["provider_response"],
      related_entity_id: log.related_entity_id ?? null,
      related_entity_type: log.related_entity_type ?? null,
      sent_at: log.sent_at ?? null,
    };

    const { data, error } = await supabase
      .from("communication_logs")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return rowToCommunicationLog(data);
  },

  /**
   * Update delivery status of a communication log
   */
  async updateStatus(
    id: string, 
    status: DeliveryStatus, 
    errorMessage?: string,
    providerResponse?: unknown
  ): Promise<CommunicationLog> {
    const updateData: Database["public"]["Tables"]["communication_logs"]["Update"] = {
      delivery_status: status,
    };

    if (status === "sent") {
      updateData.sent_at = new Date().toISOString();
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (providerResponse) {
      updateData.provider_response = providerResponse as Database["public"]["Tables"]["communication_logs"]["Update"]["provider_response"];
    }

    const { data, error } = await supabase
      .from("communication_logs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return rowToCommunicationLog(data);
  },

  /**
   * Get communication logs for a specific student
   */
  async getByStudentId(studentId: string): Promise<CommunicationLog[]> {
    const { data, error } = await supabase
      .from("communication_logs")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToCommunicationLog);
  },

  /**
   * Get communication logs for a specific parent
   */
  async getByParentId(parentId: string): Promise<CommunicationLog[]> {
    const { data, error } = await supabase
      .from("communication_logs")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(rowToCommunicationLog);
  },

  /**
   * Check if a notification was already sent today for a specific entity
   */
  async wasSentToday(
    studentId: string, 
    messageType: CommunicationMessageType, 
    relatedEntityId?: string
  ): Promise<boolean> {
    const today = new Date().toISOString().split("T")[0];
    
    let query = supabase
      .from("communication_logs")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("message_type", messageType)
      .gte("created_at", today)
      .lt("created_at", `${today}T23:59:59`);

    if (relatedEntityId) {
      query = query.eq("related_entity_id", relatedEntityId);
    }

    const { count, error } = await query;

    if (error) throw error;
    return (count ?? 0) > 0;
  },

  /**
   * Get communication statistics
   */
  async getStats(dateFrom?: string, dateTo?: string): Promise<CommunicationLogStats> {
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

    const stats: CommunicationLogStats = {
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
      },
    };

    data?.forEach((log) => {
      // Count by delivery status
      if (log.delivery_status === "sent") stats.sent++;
      else if (log.delivery_status === "failed") stats.failed++;
      else if (log.delivery_status === "pending") stats.pending++;

      // Count by message type
      if (log.message_type && stats.by_type[log.message_type as CommunicationMessageType] !== undefined) {
        stats.by_type[log.message_type as CommunicationMessageType]++;
      }
    });

    return stats;
  },

  /**
   * Delete old communication logs (cleanup)
   */
  async deleteOlderThan(days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from("communication_logs")
      .delete()
      .lt("created_at", cutoffDate.toISOString())
      .select("id");

    if (error) throw error;
    return data?.length || 0;
  },
};

export type { CreateCommunicationLogDTO, CommunicationLog };
