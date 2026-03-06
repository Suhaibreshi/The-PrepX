// Supabase Edge Function: run-automated-notifications
// This function is designed to be called by a cron job (pg_cron) or externally

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Create Supabase client with service role for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// ─── Helper Functions ───────────────────────────────────────────

async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  try {
    // Get SMS API key from org settings
    const { data: settings, error: settingsError } = await supabase
      .from("org_settings")
      .select("value")
      .eq("key", "sms_api_key")
      .single();

    if (settingsError || !settings?.value) {
      return { success: false, error: "SMS API key not configured" };
    }

    // Validate phone number
    if (!phone || phone.trim().length < 10) {
      return { success: false, error: "Invalid phone number" };
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    const smsApiKey = settings.value;

    // ─── SMS Provider Integration ─────────────────────────────
    // Replace this section with your actual SMS provider's API
    // Common providers: Twilio, MSG91, TextLocal, Fast2SMS
    
    // Example: MSG91 API
    // const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "authkey": smsApiKey,
    //   },
    //   body: JSON.stringify({
    //     route: "4",  // Transactional route
    //     country: "91",
    //     sender: "PREPXIQ",
    //     sms: [{ message, to: [cleanPhone] }],
    //   }),
    // });

    // For development: Log the SMS instead of sending
    console.log(`[SMS] To: ${cleanPhone}, Message: ${message}`);
    
    // Simulate successful send for development
    return { success: true, data: { phone: cleanPhone, message, simulated: true } };
  } catch (error) {
    console.error("SMS sending error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function logCommunication(
  studentId: string | null,
  parentId: string | null,
  messageType: string,
  messageContent: string,
  deliveryStatus: "pending" | "sent" | "failed",
  errorMessage?: string,
  providerResponse?: unknown,
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("communication_logs")
    .insert({
      student_id: studentId,
      parent_id: parentId,
      message_type: messageType,
      message_content: messageContent,
      delivery_status: deliveryStatus,
      triggered_by: "automatic",
      error_message: errorMessage || null,
      provider_response: providerResponse || null,
      related_entity_id: relatedEntityId || null,
      related_entity_type: relatedEntityType || null,
      sent_at: deliveryStatus === "sent" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to log communication:", error);
    return "";
  }
  return data.id;
}

async function wasNotificationSentToday(
  studentId: string,
  messageType: string,
  relatedEntityId?: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  
  let query = supabase
    .from("communication_logs")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("message_type", messageType)
    .gte("created_at", today);

  if (relatedEntityId) {
    query = query.eq("related_entity_id", relatedEntityId);
  }

  const { count, error } = await query;
  if (error) {
    console.error("Error checking notification status:", error);
    return false;
  }
  return (count ?? 0) > 0;
}

// ─── Notification Processors ────────────────────────────────────

interface NotificationResult {
  type: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: string[];
}

async function processFeeReminders(settings: any): Promise<NotificationResult> {
  const result: NotificationResult = { type: "fee", total: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  if (!settings.enable_fee_reminder) return result;

  try {
    const { data: recipients, error } = await supabase.rpc("get_students_with_upcoming_fees", {
      p_days_before: settings.fee_reminder_days_before,
    });

    if (error) throw error;
    
    const recipientsList = (recipients as any[]) || [];
    result.total = recipientsList.length;

    for (const recipient of recipientsList) {
      const phone = recipient.parent_phone || recipient.student_phone;
      
      if (!phone) {
        result.skipped++;
        continue;
      }

      if (await wasNotificationSentToday(recipient.student_id, "fee", recipient.fee_id)) {
        result.skipped++;
        continue;
      }

      const message = MESSAGE_TEMPLATES.fee({
        student_name: recipient.student_name,
        amount: Number(recipient.amount),
        due_date: recipient.due_date,
        description: recipient.description,
      });

      const smsResult = await sendSMS(phone, message);
      
      await logCommunication(
        recipient.student_id,
        null,
        "fee",
        message,
        smsResult.success ? "sent" : "failed",
        smsResult.error,
        smsResult.data,
        recipient.fee_id,
        "fee"
      );

      if (smsResult.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${recipient.student_name}: ${smsResult.error}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

async function processOverdueReminders(settings: any): Promise<NotificationResult> {
  const result: NotificationResult = { type: "overdue", total: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  if (!settings.enable_overdue_alert) return result;

  try {
    const { data: recipients, error } = await supabase.rpc("get_students_with_overdue_fees");

    if (error) throw error;
    
    const recipientsList = (recipients as any[]) || [];
    result.total = recipientsList.length;

    for (const recipient of recipientsList) {
      const phone = recipient.parent_phone || recipient.student_phone;
      
      if (!phone) {
        result.skipped++;
        continue;
      }

      if (await wasNotificationSentToday(recipient.student_id, "overdue", recipient.fee_id)) {
        result.skipped++;
        continue;
      }

      const message = MESSAGE_TEMPLATES.overdue({
        student_name: recipient.student_name,
        amount: Number(recipient.amount),
        days_overdue: recipient.days_overdue,
      });

      const smsResult = await sendSMS(phone, message);
      
      await logCommunication(
        recipient.student_id,
        null,
        "overdue",
        message,
        smsResult.success ? "sent" : "failed",
        smsResult.error,
        smsResult.data,
        recipient.fee_id,
        "fee"
      );

      if (smsResult.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${recipient.student_name}: ${smsResult.error}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

async function processExamReminders(settings: any): Promise<NotificationResult> {
  const result: NotificationResult = { type: "exam", total: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  if (!settings.enable_exam_reminder) return result;

  try {
    const { data: recipients, error } = await supabase.rpc("get_students_with_upcoming_exams", {
      p_days_before: settings.exam_reminder_days_before,
    });

    if (error) throw error;
    
    const recipientsList = (recipients as any[]) || [];
    result.total = recipientsList.length;

    for (const recipient of recipientsList) {
      const phone = recipient.parent_phone || recipient.student_phone;
      
      if (!phone) {
        result.skipped++;
        continue;
      }

      if (await wasNotificationSentToday(recipient.student_id, "exam", recipient.exam_id)) {
        result.skipped++;
        continue;
      }

      const message = MESSAGE_TEMPLATES.exam({
        student_name: recipient.student_name,
        exam_title: recipient.exam_title,
        exam_date: recipient.exam_date || "TBD",
        batch_name: recipient.batch_name,
      });

      const smsResult = await sendSMS(phone, message);
      
      await logCommunication(
        recipient.student_id,
        null,
        "exam",
        message,
        smsResult.success ? "sent" : "failed",
        smsResult.error,
        smsResult.data,
        recipient.exam_id,
        "exam"
      );

      if (smsResult.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${recipient.student_name}: ${smsResult.error}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

async function processAbsentAlerts(settings: any): Promise<NotificationResult> {
  const result: NotificationResult = { type: "absent", total: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  if (!settings.enable_absent_alert) return result;

  try {
    const { data: recipients, error } = await supabase.rpc("get_absent_students_today");

    if (error) throw error;
    
    const recipientsList = (recipients as any[]) || [];
    result.total = recipientsList.length;

    for (const recipient of recipientsList) {
      const phone = recipient.parent_phone;
      
      if (!phone) {
        result.skipped++;
        continue;
      }

      if (await wasNotificationSentToday(recipient.student_id, "absent", recipient.attendance_id)) {
        result.skipped++;
        continue;
      }

      const message = MESSAGE_TEMPLATES.absent({
        student_name: recipient.student_name,
        batch_name: recipient.batch_name,
        date: recipient.attendance_date,
      });

      const smsResult = await sendSMS(phone, message);
      
      await logCommunication(
        recipient.student_id,
        null,
        "absent",
        message,
        smsResult.success ? "sent" : "failed",
        smsResult.error,
        smsResult.data,
        recipient.attendance_id,
        "attendance"
      );

      if (smsResult.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${recipient.student_name}: ${smsResult.error}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

async function processBirthdayWishes(settings: any): Promise<NotificationResult> {
  const result: NotificationResult = { type: "birthday", total: 0, sent: 0, failed: 0, skipped: 0, errors: [] };

  if (!settings.enable_birthday_wish) return result;

  try {
    const { data: recipients, error } = await supabase.rpc("get_students_with_birthdays_today");

    if (error) throw error;
    
    const recipientsList = (recipients as any[]) || [];
    result.total = recipientsList.length;

    for (const recipient of recipientsList) {
      const phone = recipient.student_phone || recipient.parent_phone;
      
      if (!phone) {
        result.skipped++;
        continue;
      }

      if (await wasNotificationSentToday(recipient.student_id, "birthday")) {
        result.skipped++;
        continue;
      }

      const message = MESSAGE_TEMPLATES.birthday({
        student_name: recipient.student_name,
      });

      const smsResult = await sendSMS(phone, message);
      
      await logCommunication(
        recipient.student_id,
        null,
        "birthday",
        message,
        smsResult.success ? "sent" : "failed",
        smsResult.error,
        smsResult.data
      );

      if (smsResult.success) {
        result.sent++;
      } else {
        result.failed++;
        result.errors.push(`${recipient.student_name}: ${smsResult.error}`);
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}

// ─── Main Handler ───────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Check if automatic mode is enabled
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .limit(1)
      .single();

    if (settingsError) {
      throw new Error("Failed to get notification settings");
    }

    if (!settings?.enable_automatic_mode) {
      return new Response(JSON.stringify({
        success: false,
        message: "Automatic mode is disabled",
        results: null,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Process all notification types
    const [feeReminders, overdueReminders, examReminders, absentAlerts, birthdayWishes] = 
      await Promise.all([
        processFeeReminders(settings),
        processOverdueReminders(settings),
        processExamReminders(settings),
        processAbsentAlerts(settings),
        processBirthdayWishes(settings),
      ]);

    const totalSent = feeReminders.sent + overdueReminders.sent + examReminders.sent + absentAlerts.sent + birthdayWishes.sent;
    const totalFailed = feeReminders.failed + overdueReminders.failed + examReminders.failed + absentAlerts.failed + birthdayWishes.failed;

    const result = {
      success: true,
      message: "Automated notifications processed",
      results: {
        fee_reminders: feeReminders,
        overdue_reminders: overdueReminders,
        exam_reminders: examReminders,
        absent_alerts: absentAlerts,
        birthday_wishes: birthdayWishes,
        total_sent: totalSent,
        total_failed: totalFailed,
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing notifications:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
