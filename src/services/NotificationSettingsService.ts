import { supabase } from "@/integrations/supabase/client";
import type { 
  NotificationSettings, 
  UpdateNotificationSettingsDTO 
} from "@/types/database";

/**
 * Service for managing notification engine settings
 */
export const NotificationSettingsService = {
  /**
   * Get the current notification settings
   * There should only be one row in this table
   */
  async getSettings(): Promise<NotificationSettings | null> {
    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      // If no settings exist, create default settings
      if (error.code === "PGRST116") {
        return this.createDefaultSettings();
      }
      throw error;
    }
    return data;
  },

  /**
   * Create default notification settings
   */
  async createDefaultSettings(): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from("notification_settings")
      .insert({
        enable_automatic_mode: false,
        fee_reminder_days_before: 3,
        exam_reminder_days_before: 1,
        enable_absent_alert: true,
        enable_overdue_alert: true,
        enable_birthday_wish: false,
        enable_fee_reminder: true,
        enable_exam_reminder: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update notification settings
   */
  async updateSettings(updates: UpdateNotificationSettingsDTO): Promise<NotificationSettings> {
    // First get the existing settings to get the ID
    const existing = await this.getSettings();
    
    if (!existing) {
      // Create default settings and then update
      const defaultSettings = await this.createDefaultSettings();
      const { data, error } = await supabase
        .from("notification_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", defaultSettings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from("notification_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Toggle automatic mode on/off
   */
  async toggleAutomaticMode(enabled: boolean): Promise<NotificationSettings> {
    return this.updateSettings({ enable_automatic_mode: enabled });
  },

  /**
   * Check if automatic mode is enabled
   */
  async isAutomaticModeEnabled(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings?.enable_automatic_mode ?? false;
  },
};

export type { UpdateNotificationSettingsDTO };
