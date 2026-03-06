/**
 * SMS Provider Service
 * 
 * This service provides a unified interface for sending SMS messages
 * through various SMS providers. Currently supports:
 * - MSG91
 * - Twilio
 * - TextLocal
 * - Fast2SMS
 * 
 * To configure a provider:
 * 1. Set the SMS_API_KEY in org_settings table
 * 2. Optionally set SMS_PROVIDER to specify which provider to use
 * 3. Optionally set SMS_SENDER_ID for the sender name
 */

import { supabase } from "@/integrations/supabase/client";

// ─── Types ─────────────────────────────────────────────────────

export interface SMSConfig {
  provider: SMSProvider;
  apiKey: string;
  senderId?: string;
  countryCode?: string;
}

export type SMSProvider = "msg91" | "twilio" | "textlocal" | "fast2sms" | "auto";

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface SMSProviderAdapter {
  send(phone: string, message: string, config: SMSConfig): Promise<SMSResponse>;
}

// ─── MSG91 Adapter ─────────────────────────────────────────────

const MSG91Adapter: SMSProviderAdapter = {
  async send(phone: string, message: string, config: SMSConfig): Promise<SMSResponse> {
    try {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const countryCode = config.countryCode || "91";
      
      const response = await fetch("https://api.msg91.com/api/v2/sendsms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": config.apiKey,
        },
        body: JSON.stringify({
          route: "4", // Transactional route
          country: countryCode,
          sender: config.senderId || "PREPXIQ",
          sms: [{ message, to: [cleanPhone] }],
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.type === "success") {
        return {
          success: true,
          messageId: data.messageId,
          data,
        };
      }

      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// ─── Twilio Adapter ────────────────────────────────────────────

const TwilioAdapter: SMSProviderAdapter = {
  async send(phone: string, message: string, config: SMSConfig): Promise<SMSResponse> {
    try {
      // Twilio API key format: AccountSID:AuthToken
      const [accountSid, authToken] = config.apiKey.split(":");
      
      if (!accountSid || !authToken) {
        return {
          success: false,
          error: "Invalid Twilio API key format. Expected: AccountSID:AuthToken",
        };
      }

      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      const from = config.senderId || "+1234567890"; // Twilio phone number
      const to = `+${config.countryCode || "91"}${cleanPhone}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            From: from,
            To: to,
            Body: message,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.status !== "failed") {
        return {
          success: true,
          messageId: data.sid,
          data,
        };
      }

      return {
        success: false,
        error: data.message || data.error_message || `HTTP ${response.status}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// ─── TextLocal Adapter ─────────────────────────────────────────

const TextLocalAdapter: SMSProviderAdapter = {
  async send(phone: string, message: string, config: SMSConfig): Promise<SMSResponse> {
    try {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
      
      const response = await fetch("https://api.textlocal.in/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          apikey: config.apiKey,
          numbers: cleanPhone,
          message,
          sender: config.senderId || "TXTLCL",
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        return {
          success: true,
          messageId: data.messages?.[0]?.messageid,
          data,
        };
      }

      return {
        success: false,
        error: data.errors?.[0]?.message || data.message || `HTTP ${response.status}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// ─── Fast2SMS Adapter ──────────────────────────────────────────

const Fast2SMSAdapter: SMSProviderAdapter = {
  async send(phone: string, message: string, config: SMSConfig): Promise<SMSResponse> {
    try {
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q", // Quick transactional route
          message,
          language: "english",
          flash: 0,
          numbers: cleanPhone,
        }),
      });

      const data = await response.json();

      if (response.ok && data.return === true) {
        return {
          success: true,
          messageId: data.request_id,
          data,
        };
      }

      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};

// ─── Provider Registry ─────────────────────────────────────────

const providers: Record<string, SMSProviderAdapter> = {
  msg91: MSG91Adapter,
  twilio: TwilioAdapter,
  textlocal: TextLocalAdapter,
  fast2sms: Fast2SMSAdapter,
};

// ─── SMS Service ───────────────────────────────────────────────

export const SMSService = {
  /**
   * Get SMS configuration from org_settings
   */
  async getConfig(): Promise<SMSConfig | null> {
    const { data: settings, error } = await supabase
      .from("org_settings")
      .select("key, value")
      .in("key", ["sms_api_key", "sms_provider", "sms_sender_id", "sms_country_code"]);

    if (error || !settings || settings.length === 0) {
      return null;
    }

    const settingsMap = Object.fromEntries(
      settings.map((s) => [s.key, s.value])
    );

    if (!settingsMap.sms_api_key) {
      return null;
    }

    return {
      provider: (settingsMap.sms_provider as SMSProvider) || "msg91",
      apiKey: settingsMap.sms_api_key,
      senderId: settingsMap.sms_sender_id || undefined,
      countryCode: settingsMap.sms_country_code || "91",
    };
  },

  /**
   * Send SMS using configured provider
   */
  async send(phone: string, message: string): Promise<SMSResponse> {
    const config = await this.getConfig();

    if (!config) {
      return {
        success: false,
        error: "SMS not configured. Please set SMS_API_KEY in settings.",
      };
    }

    // Validate phone number
    if (!phone || phone.trim().length < 10) {
      return {
        success: false,
        error: "Invalid phone number",
      };
    }

    // Get the appropriate adapter
    const adapter = providers[config.provider];

    if (!adapter) {
      return {
        success: false,
        error: `Unknown SMS provider: ${config.provider}`,
      };
    }

    return adapter.send(phone, message, config);
  },

  /**
   * Send SMS to multiple recipients
   */
  async sendBulk(recipients: { phone: string; message: string }[]): Promise<SMSResponse[]> {
    return Promise.all(
      recipients.map(({ phone, message }) => this.send(phone, message))
    );
  },

  /**
   * Test SMS configuration
   */
  async testConfig(testPhone: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfig();

    if (!config) {
      return {
        success: false,
        message: "SMS not configured. Please set SMS_API_KEY in settings.",
      };
    }

    const testMessage = "This is a test message from PrepX IQ. Your SMS configuration is working correctly.";
    const result = await this.send(testPhone, testMessage);

    return {
      success: result.success,
      message: result.success
        ? "Test SMS sent successfully!"
        : `Failed to send test SMS: ${result.error}`,
    };
  },
};

export default SMSService;
