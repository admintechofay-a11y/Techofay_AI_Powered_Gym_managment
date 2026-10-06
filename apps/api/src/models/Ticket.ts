import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface ITicketMessage {
  senderId: Types.ObjectId;
  senderType: 'USER' | 'MEMBER';
  message: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  userId?: Types.ObjectId;
  memberId?: Types.ObjectId;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'BILLING' | 'EQUIPMENT' | 'FACILITY' | 'TRAINER' | 'APP' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToUserId?: Types.ObjectId;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderType: { type: String, enum: ['USER', 'MEMBER'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const TicketSchema = new Schema<ITicket>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    category: {
      type: String,
      enum: ['BILLING', 'EQUIPMENT', 'FACILITY', 'TRAINER', 'APP', 'OTHER'],
      default: 'OTHER',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assignedToUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: [TicketMessageSchema],
  },
  {
    timestamps: true,
  },
);

TicketSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

TicketSchema.plugin(tenantIsolationPlugin);

export const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
