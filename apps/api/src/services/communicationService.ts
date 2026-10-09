import mongoose, { Types } from 'mongoose';
import {
  COMMUNICATION_CHANNEL,
  type CommunicationChannel,
  NOTIFICATION_STATUS,
  type NotificationStatus,
  NOTIFICATION_TYPE,
  type NotificationType,
  WHATSAPP_TEMPLATE_STATUS,
} from '@gymos/shared';
import { Notification, type INotification } from '../models/Notification.js';
import { Template, type ITemplate } from '../models/Template.js';
import { Member } from '../models/Member.js';
import { Lead } from '../models/Lead.js';
import { integrationRegistry } from '../integrations/index.js';

export interface SendNotificationPayload {
  tenantId: string | Types.ObjectId;
  channel: CommunicationChannel;
  type?: NotificationType;
  title: string;
  message: string;
  memberId?: string | Types.ObjectId;
  leadId?: string | Types.ObjectId;
  recipientEmail?: string;
  recipientPhone?: string;
  templateId?: string | Types.ObjectId;
  variables?: Record<string, string>;
  dedupeKey?: string;
  isUrgent?: boolean;
  campaignId?: string | Types.ObjectId;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startHour: number; // e.g. 21 (9 PM)
  endHour: number;   // e.g. 8 (8 AM)
  timezone: string;
}

// In-memory tenant quiet hours cache (can be persisted in tenant settings)
const tenantQuietHours = new Map<string, QuietHoursSettings>();

export class CommunicationService {
  /**
   * Check if current time is within quiet hours for tenant
   */
  isQuietHours(tenantId: string): boolean {
    const settings = this.getQuietHours(tenantId);
    if (!settings.enabled) return false;

    const now = new Date();
    // Default to Indian Standard Time (UTC+5:30) or local hour
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const istHours = (utcHours + 5 + Math.floor((utcMinutes + 30) / 60)) % 24;

    const { startHour, endHour } = settings;
    if (startHour > endHour) {
      // Overnight (e.g. 21:00 to 08:00)
      return istHours >= startHour || istHours < endHour;
    } else {
      return istHours >= startHour && istHours < endHour;
    }
  }

  getQuietHours(tenantId: string): QuietHoursSettings {
    const key = tenantId.toString();
    if (!tenantQuietHours.has(key)) {
      tenantQuietHours.set(key, {
        enabled: true,
        startHour: 21,
        endHour: 8,
        timezone: 'Asia/Kolkata',
      });
    }
    return tenantQuietHours.get(key)!;
  }

  setQuietHours(tenantId: string, settings: Partial<QuietHoursSettings>): QuietHoursSettings {
    const current = this.getQuietHours(tenantId);
    const updated = { ...current, ...settings };
    tenantQuietHours.set(tenantId.toString(), updated);
    return updated;
  }

  /**
   * Check if member has opted in for the given channel
   */
  async checkMemberOptIn(tenantId: string, memberId: string | Types.ObjectId, channel: CommunicationChannel): Promise<boolean> {
    const member = await Member.findOne({ _id: memberId, tenantId });
    if (!member) return true;

    if (!member.notificationPreferences) return true;

    switch (channel) {
      case COMMUNICATION_CHANNEL.WHATSAPP:
        return member.notificationPreferences.whatsapp !== false;
      case COMMUNICATION_CHANNEL.SMS:
        return member.notificationPreferences.sms !== false;
      case COMMUNICATION_CHANNEL.EMAIL:
        return member.notificationPreferences.email !== false;
      case COMMUNICATION_CHANNEL.PUSH:
        return member.notificationPreferences.push !== false;
      case COMMUNICATION_CHANNEL.IN_APP:
        return member.notificationPreferences.inApp !== false;
      default:
        return true;
    }
  }

  /**
   * Update member notification preferences (Opt-in / Opt-out)
   */
  async updateMemberPreferences(
    tenantId: string,
    memberId: string,
    preferences: { whatsapp?: boolean; sms?: boolean; email?: boolean; push?: boolean; inApp?: boolean },
  ) {
    const member = await Member.findOneAndUpdate(
      { _id: memberId, tenantId },
      { $set: { notificationPreferences: preferences } },
      { new: true },
    );
    return member;
  }

  /**
   * Unsubscribe handler (1-click unsubscribe)
   */
  async handleUnsubscribe(tenantId: string, memberId: string, channel: CommunicationChannel) {
    const channelFieldMap: Record<string, string> = {
      [COMMUNICATION_CHANNEL.WHATSAPP]: 'notificationPreferences.whatsapp',
      [COMMUNICATION_CHANNEL.SMS]: 'notificationPreferences.sms',
      [COMMUNICATION_CHANNEL.EMAIL]: 'notificationPreferences.email',
      [COMMUNICATION_CHANNEL.PUSH]: 'notificationPreferences.push',
      [COMMUNICATION_CHANNEL.IN_APP]: 'notificationPreferences.inApp',
    };

    const updateField = channelFieldMap[channel];
    if (!updateField) return null;

    return Member.findOneAndUpdate(
      { _id: memberId, tenantId },
      { $set: { [updateField]: false } },
      { new: true },
    );
  }

  /**
   * Send notification with deduplication, quiet hours check, retry with backoff, and simulation tracking
   */
  async sendNotification(payload: SendNotificationPayload): Promise<{
    success: boolean;
    notification?: INotification;
    status: NotificationStatus;
    isSimulated: boolean;
    skipped?: boolean;
    reason?: string;
  }> {
    const tenantIdStr = payload.tenantId.toString();

    // 1. Idempotency / Deduplication check
    if (payload.dedupeKey) {
      const existing = await Notification.findOne({
        tenantId: payload.tenantId,
        dedupeKey: payload.dedupeKey,
      });
      if (existing) {
        return {
          success: existing.status !== NOTIFICATION_STATUS.FAILED,
          notification: existing,
          status: existing.status,
          isSimulated: existing.isSimulated,
          skipped: true,
          reason: 'Duplicate notification ignored (dedupeKey matched)',
        };
      }
    }

    // 2. Member opt-in verification
    if (payload.memberId) {
      const isOptedIn = await this.checkMemberOptIn(tenantIdStr, payload.memberId, payload.channel);
      if (!isOptedIn) {
        return {
          success: false,
          status: NOTIFICATION_STATUS.FAILED,
          isSimulated: false,
          skipped: true,
          reason: `Member has opted out of ${payload.channel} notifications`,
        };
      }
    }

    // 3. Quiet Hours Check
    const inQuietHours = this.isQuietHours(tenantIdStr);
    let finalStatus: NotificationStatus = NOTIFICATION_STATUS.SENT;
    let isQueuedForQuietHours = false;

    if (inQuietHours && !payload.isUrgent && payload.channel !== COMMUNICATION_CHANNEL.IN_APP) {
      // Non-urgent marketing or reminder queued during quiet hours
      finalStatus = NOTIFICATION_STATUS.QUEUED;
      isQueuedForQuietHours = true;
    }

    // Resolve recipient phone / email if not provided
    let recipientPhone = payload.recipientPhone;
    let recipientEmail = payload.recipientEmail;

    if (payload.memberId && (!recipientPhone || !recipientEmail)) {
      const member = await Member.findOne({ _id: payload.memberId, tenantId: payload.tenantId });
      if (member) {
        recipientPhone = recipientPhone || member.phone;
        recipientEmail = recipientEmail || member.email;
      }
    } else if (payload.leadId && (!recipientPhone || !recipientEmail)) {
      const lead = await Lead.findOne({ _id: payload.leadId, tenantId: payload.tenantId });
      if (lead) {
        recipientPhone = recipientPhone || lead.phone;
        recipientEmail = recipientEmail || lead.email;
      }
    }

    // 4. Dispatch through integration adapter (with retry logic)
    let isSimulated = false;
    let dispatchSuccess = true;
    let failureReason: string | undefined;

    if (!isQueuedForQuietHours) {
      const dispatchResult = await this.dispatchChannelWithRetry(payload.channel, {
        toPhone: recipientPhone || '+91 98765 43210',
        toEmail: recipientEmail || 'member@ironpulse-fitness.org',
        title: payload.title,
        message: payload.message,
        variables: payload.variables,
      });

      dispatchSuccess = dispatchResult.success;
      isSimulated = dispatchResult.isSimulated;
      finalStatus = dispatchResult.status;
      failureReason = dispatchResult.error;
    }

    // 5. Persist Notification Document
    const notification = new Notification({
      tenantId: payload.tenantId,
      memberId: payload.memberId,
      leadId: payload.leadId,
      recipientPhone,
      recipientEmail,
      title: payload.title,
      message: payload.message,
      channel: payload.channel,
      type: payload.type || NOTIFICATION_TYPE.INFO,
      status: finalStatus,
      isRead: false,
      sentAt: new Date(),
      deliveredAt: finalStatus === NOTIFICATION_STATUS.DELIVERED ? new Date() : undefined,
      isSimulated,
      dedupeKey: payload.dedupeKey,
      retryCount: 0,
      maxRetries: 3,
      failureReason,
      templateId: payload.templateId,
      campaignId: payload.campaignId,
      metadata: {
        variables: payload.variables,
        isQueuedForQuietHours,
        simulatedLabel: isSimulated ? 'simulated' : undefined,
      },
    });

    await notification.save();

    return {
      success: dispatchSuccess,
      notification,
      status: finalStatus,
      isSimulated,
    };
  }

  /**
   * Internal dispatcher with exponential backoff retries
   */
  private async dispatchChannelWithRetry(
    channel: CommunicationChannel,
    opts: {
      toPhone: string;
      toEmail: string;
      title: string;
      message: string;
      variables?: Record<string, string>;
    },
    maxRetries = 3,
  ): Promise<{ success: boolean; isSimulated: boolean; status: NotificationStatus; error?: string }> {
    let attempts = 0;
    let lastError = '';

    while (attempts < maxRetries) {
      try {
        attempts++;
        switch (channel) {
          case COMMUNICATION_CHANNEL.WHATSAPP: {
            const isMock = integrationRegistry.whatsapp.isMock;
            const res = await integrationRegistry.whatsapp.sendTextMessage(opts.toPhone, opts.message);
            return {
              success: res.success,
              isSimulated: isMock,
              status: isMock ? NOTIFICATION_STATUS.DELIVERED : NOTIFICATION_STATUS.SENT,
            };
          }
          case COMMUNICATION_CHANNEL.SMS: {
            const isMock = integrationRegistry.sms.isMock;
            const res = await integrationRegistry.sms.sendSms(opts.toPhone, opts.message);
            return {
              success: res.success,
              isSimulated: isMock,
              status: isMock ? NOTIFICATION_STATUS.DELIVERED : NOTIFICATION_STATUS.SENT,
            };
          }
          case COMMUNICATION_CHANNEL.EMAIL: {
            const isMock = integrationRegistry.email.isMock;
            const res = await integrationRegistry.email.sendEmail(
              opts.toEmail,
              opts.title,
              `<p>${opts.message}</p>`,
              opts.message,
            );
            return {
              success: res.success,
              isSimulated: isMock,
              status: isMock ? NOTIFICATION_STATUS.DELIVERED : NOTIFICATION_STATUS.SENT,
            };
          }
          case COMMUNICATION_CHANNEL.PUSH: {
            const isMock = integrationRegistry.push.isMock;
            const res = await integrationRegistry.push.sendPush(null, {
              title: opts.title,
              body: opts.message,
            });
            return {
              success: res.success,
              isSimulated: isMock,
              status: isMock ? NOTIFICATION_STATUS.DELIVERED : NOTIFICATION_STATUS.SENT,
            };
          }
          case COMMUNICATION_CHANNEL.IN_APP:
          default: {
            return {
              success: true,
              isSimulated: false,
              status: NOTIFICATION_STATUS.DELIVERED,
            };
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Dispatch failure';
        if (attempts < maxRetries) {
          // Exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 100));
        }
      }
    }

    return {
      success: false,
      isSimulated: false,
      status: NOTIFICATION_STATUS.FAILED,
      error: lastError,
    };
  }

  /**
   * Get communication history per member or lead
   */
  async getHistory(filters: {
    tenantId: string | Types.ObjectId;
    memberId?: string | Types.ObjectId;
    leadId?: string | Types.ObjectId;
    channel?: CommunicationChannel;
    status?: NotificationStatus;
    page?: number;
    limit?: number;
  }) {
    const query: Record<string, any> = { tenantId: filters.tenantId };
    if (filters.memberId) query.memberId = filters.memberId;
    if (filters.leadId) query.leadId = filters.leadId;
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) query.status = filters.status;

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 50));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  // ================= TEMPLATE MANAGER =================

  async getTemplates(tenantId: string | Types.ObjectId, channel?: CommunicationChannel) {
    const query: Record<string, any> = { tenantId };
    if (channel) query.channel = channel;
    return Template.find(query).sort({ name: 1 }).lean();
  }

  async getTemplateById(tenantId: string | Types.ObjectId, templateId: string) {
    return Template.findOne({ _id: templateId, tenantId }).lean();
  }

  async createTemplate(tenantId: string | Types.ObjectId, data: any) {
    const template = new Template({
      tenantId,
      ...data,
      languages: data.languages || {
        en: { subject: data.subject, body: data.body },
      },
    });
    return template.save();
  }

  async updateTemplate(tenantId: string | Types.ObjectId, templateId: string, data: any) {
    return Template.findOneAndUpdate(
      { _id: templateId, tenantId },
      { $set: data },
      { new: true },
    );
  }

  async deleteTemplate(tenantId: string | Types.ObjectId, templateId: string) {
    return Template.findOneAndDelete({ _id: templateId, tenantId });
  }

  /**
   * Render template with variables and language support
   */
  renderTemplate(
    template: ITemplate,
    variables: Record<string, string> = {},
    lang: 'en' | 'hi' | 'gu' = 'en',
  ): { subject?: string; body: string } {
    const langContent = (template.languages && template.languages[lang]) || template.languages.en || {
      subject: template.subject,
      body: template.body,
    };

    let body = langContent.body;
    let subject = langContent.subject;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      body = body.replace(regex, value);
      if (subject) {
        subject = subject.replace(regex, value);
      }
    }

    return { subject, body };
  }
}

export const communicationService = new CommunicationService();
