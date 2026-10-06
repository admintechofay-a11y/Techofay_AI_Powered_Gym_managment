import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { COMMUNICATION_CHANNEL, type CommunicationChannel } from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface INotification extends Document {
  tenantId: Types.ObjectId;
  userId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  title: string;
  message: string;
  channel: CommunicationChannel;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'REMINDER';
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNEL),
      default: COMMUNICATION_CHANNEL.IN_APP,
      required: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'WARNING', 'SUCCESS', 'REMINDER'],
      default: 'INFO',
    },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    sentAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
);

NotificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
NotificationSchema.index({ tenantId: 1, memberId: 1, isRead: 1 });

NotificationSchema.plugin(tenantIsolationPlugin);

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
