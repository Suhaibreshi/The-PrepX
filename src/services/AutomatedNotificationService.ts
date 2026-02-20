import { supabase } from "@/integrations/supabase/client";
import { NotificationSettingsService } from "./NotificationSettingsService";
import { CommunicationLogService } from "./CommunicationLogService";
import type { 
  NotificationSettings,
  FeeReminderRecipient,
  OverdueReminderRecipient,
  ExamReminderRecipient,
  AbsentAlertRecipient,
  BirthdayRecipient,
  CommunicationMessageType
} from "@/types/database";

// ─── SMS Message Templates ─────────────────────────────────────

const MESSAGE_TEMPLATES = {
  fee: (data: { student_name: string; amount: number; due_date: string; description?: string | null }) => 
    `Dear Parent, fee reminder for ${data.student_name}. Amount: ₹${data.amount} due on ${data.due_date}.${data.description ? ` Note: ${data.description}` : ''} - PrepX IQ`,

  overdue: (data: { student_name: string; amount: number; days_overdue: number }) => 
    `Dear Parent, fee overdue alert for ${data.student_name}. Amount: ₹${data.amount} is ${data.days_overdue} days overdue. Please clear the dues at the earliest. - PrepX IQ`,

  exam: (data: { student_name: string; exam_title: string; exam_date: string; batch_name?: string | null }) => 
    `Dear Parent, ${data.student_name} has an exam "${data.exam_title}" scheduled for ${data.exam_date}.${data.batch_name ? ` Batch: ${data.batch_name}` : ''} Please ensure preparation. - PrepX IQ`,

  absent: (data: { student_name: string; batch_name?: string | null; date: string }) => 
    `Dear Parent, your child ${data.student_name} was marked absent on ${data.date}${data.batch_name ? ` for batch ${data.batch_name}` : ''}. Please contact the institute if this is unexpected. - PrepX IQ`,

  birthday: (data: { student_name: string }) => 
    `🎂 Happy Birthday ${data.student_name}! Wishing you a wonderful year ahead filled with success and happiness. - PrepX IQ Team`,
};

// ─── SMS Provider Response Interface ───────────────────────────

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: unknown;
}

// ─── Notification Result Types ─────────────────────────────────

export interface NotificationResult {
  type: CommunicationMessageType;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface BatchNotificationResult {
  fee_reminders: NotificationResult;
  overdue_reminders: NotificationResult;
  exam_reminders: NotificationResult;
  absent_alerts: NotificationResult;
  birthday_wishes: NotificationResult;
  total_sent: number;
  total_failed: number;
  timestamp: string;
}

// ─── Automated Notification Service ────────────────────────────

export const AutomatedNotificationService = {
  /**
   * Send SMS using the configured SMS provider
   * This integrates with the existing SMS configuration in org_settings
   */
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    try {
      // Get SMS API key from org settings
      const { data: settings, error: settingsError } = await supabase
        .from("org_settings")
        .select("value")
        .eq("key", "sms_api_key")
        .single();

      if (settingsError || !settings?.value) {
        return {
          success: false,
          error: "SMS API key not configured",
        };
      }

      // Validate phone number
      if (!phone || phone.trim().length < 10) {
        return {
          success: false,
          error: "Invalid phone number",
        };
      }

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

      // Call the SMS provider API
      // This is a placeholder implementation - replace with actual SMS provider integration
      // Common providers: Twilio, MSG91, TextLocal, Fast2SMS
      const smsApiKey = settings.value;
      
      // Example: Using a generic SMS API endpoint
      // You would replace this with your actual SMS provider's API
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${smsApiKey}`,
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message,
        }),
      });

      // For development/demo purposes, simulate success
      // In production, handle actual API response
      if (!response.ok) {
        // If the API endpoint doesn't exist (development), simulate success
        if (response.status === 404) {
          console.log(`[DEV] SMS would be sent to ${cleanPhone}: ${message}`);
          return {
            success: true,
            messageId: `dev_${Date.now()}`,
            data: { phone: cleanPhone, message },
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }

      const responseData = await response.json();
      return {
        success: true,
        messageId: responseData.messageId || responseData.id,
        data: responseData,
      };
    } catch (error) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Send a notification and log it
   */
  async sendAndLogNotification(
    recipient: { student_id?: string; parent_id?: string; phone?: string | null },
    messageType: CommunicationMessageType,
    message: string,
    relatedEntityId?: string,
    relatedEntityType?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    // Check if already sent today
    if (recipient.student_id) {
      const alreadySent = await CommunicationLogService.wasSentToday(
        recipient.student_id,
        messageType,
        relatedEntityId
      );
      if (alreadySent) {
        return { success: false, error: "Already sent today" };
      }
    }

    // Create pending log entry
    const log = await CommunicationLogService.create({
      student_id: recipient.student_id,
      parent_id: recipient.parent_id,
      message_type: messageType,
      message_content: message,
      delivery_status: "pending",
      triggered_by: "automatic",
      related_entity_id: relatedEntityId,
      related_entity_type: relatedEntityType,
    });

    // Send SMS
    const phone = recipient.phone;
    if (!phone) {
      await CommunicationLogService.updateStatus(
        log.id,
        "failed",
        "No phone number available"
      );
      return { success: false, error: "No phone number available" };
    }

    const result = await this.sendSMS(phone, message);

    // Update log with result
    await CommunicationLogService.updateStatus(
      log.id,
      result.success ? "sent" : "failed",
      result.error,
      result.data
    );

    return {
      success: result.success,
      logId: log.id,
      error: result.error,
    };
  },

  /**
   * Process fee reminders
   */
  async processFeeReminders(settings: NotificationSettings): Promise<NotificationResult> {
    const result: NotificationResult = {
      type: "fee",
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (!settings.enable_fee_reminder) {
      return result;
    }

    try {
      // Get students with upcoming fee due dates
      const { data, error } = await supabase.rpc("get_students_with_upcoming_fees", {
        p_days_before: settings.fee_reminder_days_before,
      });

      if (error) throw error;
      
      const recipients = (data as unknown as FeeReminderRecipient[]) || [];
      result.total = recipients.length;

      for (const recipient of recipients) {
        // Prefer parent phone, fallback to student phone
        const phone = recipient.parent_phone || recipient.student_phone;
        
        if (!phone) {
          result.skipped++;
          continue;
        }

        const message = MESSAGE_TEMPLATES.fee({
          student_name: recipient.student_name,
          amount: Number(recipient.amount),
          due_date: recipient.due_date,
          description: recipient.description,
        });

        const sendResult = await this.sendAndLogNotification(
          { student_id: recipient.student_id, phone },
          "fee",
          message,
          recipient.fee_id,
          "fee"
        );

        if (sendResult.success) {
          result.sent++;
        } else if (sendResult.error === "Already sent today") {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${recipient.student_name}: ${sendResult.error}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  },

  /**
   * Process overdue fee reminders
   */
  async processOverdueReminders(settings: NotificationSettings): Promise<NotificationResult> {
    const result: NotificationResult = {
      type: "overdue",
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (!settings.enable_overdue_alert) {
      return result;
    }

    try {
      const { data, error } = await supabase.rpc("get_students_with_overdue_fees");

      if (error) throw error;
      
      const recipients = (data as unknown as OverdueReminderRecipient[]) || [];
      result.total = recipients.length;

      for (const recipient of recipients) {
        const phone = recipient.parent_phone || recipient.student_phone;
        
        if (!phone) {
          result.skipped++;
          continue;
        }

        const message = MESSAGE_TEMPLATES.overdue({
          student_name: recipient.student_name,
          amount: Number(recipient.amount),
          days_overdue: recipient.days_overdue,
        });

        const sendResult = await this.sendAndLogNotification(
          { student_id: recipient.student_id, phone },
          "overdue",
          message,
          recipient.fee_id,
          "fee"
        );

        if (sendResult.success) {
          result.sent++;
        } else if (sendResult.error === "Already sent today") {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${recipient.student_name}: ${sendResult.error}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  },

  /**
   * Process exam reminders
   */
  async processExamReminders(settings: NotificationSettings): Promise<NotificationResult> {
    const result: NotificationResult = {
      type: "exam",
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (!settings.enable_exam_reminder) {
      return result;
    }

    try {
      const { data, error } = await supabase.rpc("get_students_with_upcoming_exams", {
        p_days_before: settings.exam_reminder_days_before,
      });

      if (error) throw error;
      
      const recipients = (data as unknown as ExamReminderRecipient[]) || [];
      result.total = recipients.length;

      for (const recipient of recipients) {
        const phone = recipient.parent_phone || recipient.student_phone;
        
        if (!phone) {
          result.skipped++;
          continue;
        }

        const message = MESSAGE_TEMPLATES.exam({
          student_name: recipient.student_name,
          exam_title: recipient.exam_title,
          exam_date: recipient.exam_date || "TBD",
          batch_name: recipient.batch_name,
        });

        const sendResult = await this.sendAndLogNotification(
          { student_id: recipient.student_id, phone },
          "exam",
          message,
          recipient.exam_id,
          "exam"
        );

        if (sendResult.success) {
          result.sent++;
        } else if (sendResult.error === "Already sent today") {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${recipient.student_name}: ${sendResult.error}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  },

  /**
   * Process absent alerts
   */
  async processAbsentAlerts(settings: NotificationSettings): Promise<NotificationResult> {
    const result: NotificationResult = {
      type: "absent",
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (!settings.enable_absent_alert) {
      return result;
    }

    try {
      const { data, error } = await supabase.rpc("get_absent_students_today");

      if (error) throw error;
      
      const recipients = (data as unknown as AbsentAlertRecipient[]) || [];
      result.total = recipients.length;

      for (const recipient of recipients) {
        const phone = recipient.parent_phone;
        
        if (!phone) {
          result.skipped++;
          continue;
        }

        const message = MESSAGE_TEMPLATES.absent({
          student_name: recipient.student_name,
          batch_name: recipient.batch_name,
          date: recipient.attendance_date,
        });

        const sendResult = await this.sendAndLogNotification(
          { student_id: recipient.student_id, phone },
          "absent",
          message,
          recipient.attendance_id,
          "attendance"
        );

        if (sendResult.success) {
          result.sent++;
        } else if (sendResult.error === "Already sent today") {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${recipient.student_name}: ${sendResult.error}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  },

  /**
   * Process birthday wishes
   */
  async processBirthdayWishes(settings: NotificationSettings): Promise<NotificationResult> {
    const result: NotificationResult = {
      type: "birthday",
      total: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    };

    if (!settings.enable_birthday_wish) {
      return result;
    }

    try {
      const { data, error } = await supabase.rpc("get_students_with_birthdays_today");

      if (error) throw error;
      
      const recipients = (data as unknown as BirthdayRecipient[]) || [];
      result.total = recipients.length;

      for (const recipient of recipients) {
        const phone = recipient.student_phone || recipient.parent_phone;
        
        if (!phone) {
          result.skipped++;
          continue;
        }

        const message = MESSAGE_TEMPLATES.birthday({
          student_name: recipient.student_name,
        });

        const sendResult = await this.sendAndLogNotification(
          { student_id: recipient.student_id, phone },
          "birthday",
          message
        );

        if (sendResult.success) {
          result.sent++;
        } else if (sendResult.error === "Already sent today") {
          result.skipped++;
        } else {
          result.failed++;
          result.errors.push(`${recipient.student_name}: ${sendResult.error}`);
        }
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }

    return result;
  },

  /**
   * Run all automated notifications
   * This is the main entry point for the scheduler
   */
  async runAllNotifications(): Promise<BatchNotificationResult> {
    // Check if automatic mode is enabled
    const isAutomaticModeEnabled = await NotificationSettingsService.isAutomaticModeEnabled();
    
    if (!isAutomaticModeEnabled) {
      return {
        fee_reminders: { type: "fee", total: 0, sent: 0, failed: 0, skipped: 0, errors: ["Automatic mode disabled"] },
        overdue_reminders: { type: "overdue", total: 0, sent: 0, failed: 0, skipped: 0, errors: ["Automatic mode disabled"] },
        exam_reminders: { type: "exam", total: 0, sent: 0, failed: 0, skipped: 0, errors: ["Automatic mode disabled"] },
        absent_alerts: { type: "absent", total: 0, sent: 0, failed: 0, skipped: 0, errors: ["Automatic mode disabled"] },
        birthday_wishes: { type: "birthday", total: 0, sent: 0, failed: 0, skipped: 0, errors: ["Automatic mode disabled"] },
        total_sent: 0,
        total_failed: 0,
        timestamp: new Date().toISOString(),
      };
    }

    // Get current settings
    const settings = await NotificationSettingsService.getSettings();
    
    if (!settings) {
      throw new Error("Failed to get notification settings");
    }

    // Process all notification types
    const [feeReminders, overdueReminders, examReminders, absentAlerts, birthdayWishes] = 
      await Promise.all([
        this.processFeeReminders(settings),
        this.processOverdueReminders(settings),
        this.processExamReminders(settings),
        this.processAbsentAlerts(settings),
        this.processBirthdayWishes(settings),
      ]);

    const totalSent = feeReminders.sent + overdueReminders.sent + examReminders.sent + absentAlerts.sent + birthdayWishes.sent;
    const totalFailed = feeReminders.failed + overdueReminders.failed + examReminders.failed + absentAlerts.failed + birthdayWishes.failed;

    return {
      fee_reminders: feeReminders,
      overdue_reminders: overdueReminders,
      exam_reminders: examReminders,
      absent_alerts: absentAlerts,
      birthday_wishes: birthdayWishes,
      total_sent: totalSent,
      total_failed: totalFailed,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Trigger absent alert for a specific student (called when marking attendance)
   */
  async triggerAbsentAlert(
    studentId: string,
    studentName: string,
    parentPhone: string | null,
    batchName?: string,
    attendanceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const settings = await NotificationSettingsService.getSettings();
    
    if (!settings?.enable_absent_alert || !settings.enable_automatic_mode) {
      return { success: false, error: "Absent alerts disabled" };
    }

    if (!parentPhone) {
      return { success: false, error: "No parent phone available" };
    }

    const message = MESSAGE_TEMPLATES.absent({
      student_name: studentName,
      batch_name: batchName || null,
      date: new Date().toISOString().split("T")[0],
    });

    return this.sendAndLogNotification(
      { student_id: studentId, phone: parentPhone },
      "absent",
      message,
      attendanceId,
      "attendance"
    );
  },
};
