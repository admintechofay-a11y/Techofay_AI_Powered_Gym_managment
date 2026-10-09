import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  COMMUNICATION_CHANNEL,
  type CommunicationChannel,
  NOTIFICATION_STATUS,
  type NotificationStatus,
  NOTIFICATION_TYPE,
  type NotificationType,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface INotification extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  recipientPhone?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  channel: CommunicationChannel;
  type: NotificationType;
  status: NotificationStatus;
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  deliveredAt?: Date;
  isSimulated: boolean;
  dedupeKey?: string;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  templateId?: Types.ObjectId;
  campaignId?: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    recipientPhone: { type: String, trim: true },
    recipientEmail: { type: String, trim: true, lowercase: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNEL),
      default: COMMUNICATION_CHANNEL.IN_APP,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.INFO,
    },
    status: {
      type: String,
      enum: Object.values(NOTIFICATION_STATUS),
      default: NOTIFICATION_STATUS.SENT,
      index: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    sentAt: { type: Date, default: Date.now, index: true },
    deliveredAt: { type: Date },
    isSimulated: { type: Boolean, default: false, index: true },
    dedupeKey: { type: String, sparse: true },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    failureReason: { type: String },
    templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign' },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, memberId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, leadId: 1, createdAt: -1 });
NotificationSchema.index({ tenantId: 1, dedupeKey: 1 }, { unique: true, sparse: true });
NotificationSchema.index({ tenantId: 1, channel: 1, status: 1 });

NotificationSchema.plugin(tenantIsolationPlugin);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
