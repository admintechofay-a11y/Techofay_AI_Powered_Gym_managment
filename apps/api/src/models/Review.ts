import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IReview extends Document {
  tenantId: Types.ObjectId;
  branchId: Types.ObjectId;
  memberId: Types.ObjectId;
  rating: number; // 1 to 5
  reviewText: string;
  trainerId?: Types.ObjectId;
  isPublic: boolean;
  isApproved: boolean;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true, trim: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    isPublic: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'HIDDEN'],
      default: 'PENDING',
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

ReviewSchema.index({ tenantId: 1, branchId: 1, rating: -1 });

ReviewSchema.plugin(tenantIsolationPlugin);

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
