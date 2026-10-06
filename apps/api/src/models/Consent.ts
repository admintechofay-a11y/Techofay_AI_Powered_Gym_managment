import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IConsent extends Document {
  tenantId: Types.ObjectId;
  memberId: Types.ObjectId;
  consentType:
    | 'TERMS_AND_CONDITIONS'
    | 'PRIVACY_POLICY'
    | 'MARKETING'
    | 'BIOMETRIC'
    | 'HEALTH_DATA_SHARE';
  isGiven: boolean;
  givenAt: Date;
  revokedAt?: Date;
  ipAddress?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsentSchema = new Schema<IConsent>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    consentType: {
      type: String,
      enum: [
        'TERMS_AND_CONDITIONS',
        'PRIVACY_POLICY',
        'MARKETING',
        'BIOMETRIC',
        'HEALTH_DATA_SHARE',
      ],
      required: true,
    },
    isGiven: { type: Boolean, required: true },
    givenAt: { type: Date, default: Date.now, required: true },
    revokedAt: { type: Date },
    ipAddress: { type: String },
    version: { type: String, default: '1.0' },
  },
  {
    timestamps: true,
  },
);

ConsentSchema.index({ tenantId: 1, memberId: 1, consentType: 1 });

ConsentSchema.plugin(tenantIsolationPlugin);

export const Consent: Model<IConsent> =
  mongoose.models.Consent || mongoose.model<IConsent>('Consent', ConsentSchema);
