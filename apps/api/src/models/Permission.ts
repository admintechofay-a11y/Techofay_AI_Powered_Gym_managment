import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IPermission extends Document {
  tenantId: Types.ObjectId;
  module: string;
  action: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    module: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

PermissionSchema.index({ tenantId: 1, module: 1, action: 1 }, { unique: true });

PermissionSchema.plugin(tenantIsolationPlugin);

export const Permission: Model<IPermission> =
  mongoose.models.Permission || mongoose.model<IPermission>('Permission', PermissionSchema);
