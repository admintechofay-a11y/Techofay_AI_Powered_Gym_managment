import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IRole extends Document {
  tenantId: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  permissions: string[]; // e.g., ["members:view", "members:create", "billing:view"]
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String, required: true }],
  },
  {
    timestamps: true,
  },
);

RoleSchema.index({ tenantId: 1, code: 1 }, { unique: true });

RoleSchema.plugin(tenantIsolationPlugin);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
