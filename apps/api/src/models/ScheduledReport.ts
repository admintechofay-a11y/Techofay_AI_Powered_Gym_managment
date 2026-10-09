import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  REPORT_TYPE,
  REPORT_FORMAT,
  SCHEDULE_FREQUENCY,
  type ReportType,
  type ReportFormat,
  type ScheduleFrequency,
} from '@gymos/shared';
import { tenantIsolationPlugin } from '../plugins/tenantIsolationPlugin.js';

export interface IScheduledReport extends Document {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  reportType: ReportType;
  frequency: ScheduleFrequency;
  recipients: string[];
  format: ReportFormat;
  lastSentAt?: Date;
  nextRunAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledReportSchema = new Schema<IScheduledReport>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    reportType: {
      type: String,
      enum: Object.values(REPORT_TYPE),
      required: true,
      index: true,
    },
    frequency: {
      type: String,
      enum: Object.values(SCHEDULE_FREQUENCY),
      default: SCHEDULE_FREQUENCY.WEEKLY,
      required: true,
    },
    recipients: [{ type: String, required: true, trim: true, lowercase: true }],
    format: {
      type: String,
      enum: Object.values(REPORT_FORMAT),
      default: REPORT_FORMAT.PDF,
      required: true,
    },
    lastSentAt: { type: Date },
    nextRunAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  },
);

ScheduledReportSchema.plugin(tenantIsolationPlugin);
ScheduledReportSchema.index({ tenantId: 1, isActive: 1, frequency: 1 });

export const ScheduledReport = mongoose.model<IScheduledReport>('ScheduledReport', ScheduledReportSchema);
