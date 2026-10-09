import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  COMMUNICATION_CHANNEL,
  type CommunicationChannel,
  AUTOMATION_TRIGGER,
  type AutomationTrigger,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IAutomationRuleCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN';
  value: any;
}

export interface IAutomationRuleAction {
  type: 'SEND_NOTIFICATION' | 'SEND_WHATSAPP' | 'SEND_SMS' | 'SEND_EMAIL' | 'CREATE_COUPON' | 'CREATE_STAFF_TASK';
  channel?: CommunicationChannel;
  templateId?: Types.ObjectId;
  templateName?: string;
  couponConfig?: {
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
    validDays: number;
  };
}

export interface IAutomationLog {
  executedAt: Date;
  entityId?: Types.ObjectId;
  entityType?: 'MEMBER' | 'LEAD';
  recipientName?: string;
  recipientContact?: string;
  trigger: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  message: string;
  dedupeKey?: string;
}

export interface IAutomationRule extends Document {
  tenantId: Types.ObjectId;
  name: string;
  trigger: AutomationTrigger;
  conditions: IAutomationRuleCondition[];
  action: IAutomationRuleAction;
  isActive: boolean;
  executionCount: number;
  lastRunAt?: Date;
  logs: IAutomationLog[];
  createdAt: Date;
  updatedAt: Date;
}

const AutomationLogSchema = new Schema<IAutomationLog>(
  {
    executedAt: { type: Date, default: Date.now },
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String, enum: ['MEMBER', 'LEAD'] },
    recipientName: { type: String },
    recipientContact: { type: String },
    trigger: { type: String, required: true },
    action: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED', 'SKIPPED'], required: true },
    message: { type: String, required: true },
    dedupeKey: { type: String },
  },
  { _id: false },
);

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    trigger: {
      type: String,
      enum: Object.values(AUTOMATION_TRIGGER),
      required: true,
      index: true,
    },
    conditions: [
      {
        field: { type: String, required: true },
        operator: {
          type: String,
          enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN'],
          required: true,
        },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    action: {
      type: {
        type: String,
        enum: [
          'SEND_NOTIFICATION',
          'SEND_WHATSAPP',
          'SEND_SMS',
          'SEND_EMAIL',
          'CREATE_COUPON',
          'CREATE_STAFF_TASK',
        ],
        required: true,
      },
      channel: {
        type: String,
        enum: Object.values(COMMUNICATION_CHANNEL),
      },
      templateId: { type: Schema.Types.ObjectId, ref: 'Template' },
      templateName: { type: String },
      couponConfig: {
        discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'] },
        discountValue: { type: Number },
        validDays: { type: Number, default: 14 },
      },
    },
    isActive: { type: Boolean, default: true, index: true },
    executionCount: { type: Number, default: 0 },
    lastRunAt: { type: Date },
    logs: [AutomationLogSchema],
  },
  {
    timestamps: true,
  },
);

AutomationRuleSchema.index({ tenantId: 1, trigger: 1, isActive: 1 });

AutomationRuleSchema.plugin(tenantIsolationPlugin);

export const AutomationRule: Model<IAutomationRule> =
  mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
