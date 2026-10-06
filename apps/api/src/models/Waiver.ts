import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IWaiver extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  waiverTemplateVersion: string;
  signedPdfUrl?: string;
  signatureDataUrl?: string;
  signedAt: Date;
  ipAddress?: string;
  guardianSignature?: boolean;
  guardianName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WaiverSchema = new Schema<IWaiver>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    waiverTemplateVersion: { type: String, default: '1.0' },
    signedPdfUrl: { type: String },
    signatureDataUrl: { type: String },
    signedAt: { type: Date, default: Date.now, required: true },
    ipAddress: { type: String },
    guardianSignature: { type: Boolean, default: false },
    guardianName: { type: String },
  },
  {
    timestamps: true,
  },
);

WaiverSchema.index({ tenantId: 1, memberId: 1 });

WaiverSchema.plugin(tenantIsolationPlugin);

export const Waiver: Model<IWaiver> =
  mongoose.models.Waiver || mongoose.model<IWaiver>('Waiver', WaiverSchema);
