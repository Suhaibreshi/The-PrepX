import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];

export interface CreateNotificationDTO {
  title: string;
  body?: string;
  type?: string;
  read?: boolean;
}

export interface UpdateNotificationDTO extends Partial<CreateNotificationDTO> {
  id: string;
}

export const NotificationService = {
  async getAll(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUnread(): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Notification | null> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(notification: CreateNotificationDTO): Promise<Notification> {
    const payload: NotificationInsert = {
      title: notification.title,
      body: notification.body || null,
      type: notification.type || "system",
      read: notification.read ?? false,
    };

    const { data, error } = await supabase
      .from("notifications")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) throw error;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getUnreadCount(): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  },
};
