import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import {
  COMMUNICATION_CHANNEL,
  type CommunicationChannel,
  WHATSAPP_TEMPLATE_STATUS,
  type WhatsAppTemplateStatus,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ITemplateLanguage {
  subject?: string;
  body: string;
}

export interface ITemplate extends Document {
  tenantId: Types.ObjectId;
  name: string;
  channel: CommunicationChannel;
  triggerEvent?: string; // e.g. "EXPIRY", "RENEWAL", "PAYMENT_DUE", "WELCOME", "BIRTHDAY", "ANNIVERSARY", "TRIAL", "INACTIVITY"
  category: 'TRANSACTIONAL' | 'MARKETING' | 'OTP';
  subject?: string;
  body: string;
  variables: string[];
  languages: {
    en: ITemplateLanguage;
    hi?: ITemplateLanguage;
    gu?: ITemplateLanguage;
  };
  whatsAppApprovalStatus: WhatsAppTemplateStatus;
  whatsAppTemplateName?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateLanguageSchema = new Schema<ITemplateLanguage>(
  {
    subject: { type: String },
    body: { type: String, required: true },
  },
  { _id: false },
);

const TemplateSchema = new Schema<ITemplate>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNEL),
      required: true,
      index: true,
    },
    triggerEvent: { type: String, index: true },
    category: {
      type: String,
      enum: ['TRANSACTIONAL', 'MARKETING', 'OTP'],
      default: 'TRANSACTIONAL',
    },
    subject: { type: String },
    body: { type: String, required: true },
    variables: [{ type: String }],
    languages: {
      en: { type: TemplateLanguageSchema, required: true },
      hi: { type: TemplateLanguageSchema },
      gu: { type: TemplateLanguageSchema },
    },
    whatsAppApprovalStatus: {
      type: String,
      enum: Object.values(WHATSAPP_TEMPLATE_STATUS),
      default: WHATSAPP_TEMPLATE_STATUS.DRAFT,
      index: true,
    },
    whatsAppTemplateName: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

TemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });
TemplateSchema.index({ tenantId: 1, channel: 1, triggerEvent: 1 });

TemplateSchema.plugin(tenantIsolationPlugin);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
