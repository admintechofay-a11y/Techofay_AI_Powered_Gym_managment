import { z } from 'zod';
import { SUBSCRIPTION_TIER, TENANT_STATUS } from '../constants/enums.js';

// Super Admin: Tenant Onboarding Wizard Schema
export const onboardTenantSchema = z.object({
  name: z.string().min(2, 'Gym name must be at least 2 characters').max(100),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain may only contain lowercase letters, numbers, and hyphens'),
  customDomain: z.string().optional(),
  tier: z.enum([SUBSCRIPTION_TIER.STARTER, SUBSCRIPTION_TIER.PROFESSIONAL, SUBSCRIPTION_TIER.ENTERPRISE]).default(SUBSCRIPTION_TIER.STARTER),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  contactEmail: z.string().email('Invalid contact email'),
  contactPhone: z.string().min(8, 'Contact phone is required'),
  trialDays: z.number().int().min(0).max(90).default(14),
  ownerName: z.string().min(2, 'Owner name is required'),
  ownerEmail: z.string().email('Invalid owner email'),
  ownerPassword: z.string().min(8, 'Password must be at least 8 characters'),
  branchName: z.string().min(2, 'Branch name is required'),
  branchCode: z.string().min(2).max(10).toUpperCase(),
  branchAddress: z.string().min(5, 'Address is required'),
  branchCity: z.string().min(2, 'City is required'),
  branchState: z.string().min(2, 'State is required'),
  branchPincode: z.string().regex(/^\d{6}$/, 'Enter valid 6-digit pincode'),
  branchPhone: z.string().min(8, 'Branch phone is required'),
});

export type OnboardTenantInput = z.infer<typeof onboardTenantSchema>;

// Tenant Status Update
export const tenantStatusUpdateSchema = z.object({
  status: z.enum([TENANT_STATUS.ACTIVE, TENANT_STATUS.TRIAL, TENANT_STATUS.SUSPENDED, TENANT_STATUS.CANCELLED]),
  reason: z.string().optional(),
});

// Member Branch Transfer Schema
export const transferMemberBranchSchema = z.object({
  memberId: z.string().min(1, 'Member ID is required'),
  destinationBranchId: z.string().min(1, 'Destination Branch ID is required'),
  reason: z.string().min(3, 'Reason for transfer is required'),
  transferActiveMemberships: z.boolean().default(true),
});

export type TransferMemberBranchInput = z.infer<typeof transferMemberBranchSchema>;

// Inventory Stock Adjustment Schema (Stock In / Stock Out)
export const stockAdjustmentSchema = z.object({
  inventoryId: z.string().min(1, 'Inventory ID is required'),
  type: z.enum(['STOCK_IN', 'STOCK_OUT']),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  unitCostInPaise: z.number().int().min(0).optional(),
  unitPriceInPaise: z.number().int().min(0).optional(),
  supplierId: z.string().optional(),
  reason: z.string().min(2, 'Reason for adjustment is required'),
  notes: z.string().optional(),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// Inventory Item Creation Schema
export const createInventoryItemSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  name: z.string().min(2, 'Item name is required'),
  sku: z.string().min(2, 'SKU is required').toUpperCase(),
  category: z.enum(['SUPPLEMENTS', 'MERCHANDISE', 'APPAREL', 'EQUIPMENT', 'ACCESSORIES']),
  supplierId: z.string().optional(),
  costPriceInPaise: z.number().int().min(0),
  sellingPriceInPaise: z.number().int().min(0),
  initialStock: z.number().int().min(0).default(0),
  minThresholdAlert: z.number().int().min(0).default(5),
  unit: z.string().default('pcs'),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

// Expense Creation Schema
export const createExpenseItemSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  category: z.enum([
    'SALARY',
    'UTILITIES',
    'RENT',
    'EQUIPMENT',
    'MARKETING',
    'SUPPLIES',
    'MAINTENANCE',
    'OTHER',
  ]),
  amountInPaise: z.number().int().positive('Amount must be positive'),
  paymentMethod: z.string().default('BANK_TRANSFER'),
  vendorName: z.string().min(2, 'Vendor or payee name is required'),
  invoiceNumber: z.string().optional(),
  date: z.string().optional(),
  recurringInterval: z.enum(['NONE', 'MONTHLY', 'YEARLY']).default('NONE'),
  notes: z.string().optional(),
});

export type CreateExpenseItemInput = z.infer<typeof createExpenseItemSchema>;

// Public Trial Booking & Enquiry Schema
export const publicTrialBookingSchema = z.object({
  tenantSlug: z.string().min(2, 'Tenant slug is required'),
  branchId: z.string().optional(),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  preferredDate: z.string().optional(),
  preferredTimeSlot: z.string().optional(),
  fitnessGoal: z.string().default('General Fitness'),
  notes: z.string().optional(),
});

export type PublicTrialBookingInput = z.infer<typeof publicTrialBookingSchema>;

// Public Plan Purchase / Checkout Intent
export const publicPlanPurchaseSchema = z.object({
  tenantSlug: z.string().min(2, 'Tenant slug is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  branchId: z.string().optional(),
  customerName: z.string().min(2, 'Customer name is required'),
  customerEmail: z.string().email('Customer email is required'),
  customerPhone: z.string().min(8, 'Customer phone is required'),
  paymentMethod: z.string().default('RAZORPAY'),
});

export type PublicPlanPurchaseInput = z.infer<typeof publicPlanPurchaseSchema>;

// White-Label Branding Schema
export const updateBrandingSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color code (e.g. #10b981)'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  tagline: z.string().max(200).optional(),
  customDomain: z.string().optional(),
  googleMapsEmbedUrl: z.string().optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().email().optional(),
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;

// Support Ticket Creation & Reply Schemas
export const createTicketSchema = z.object({
  branchId: z.string().optional(),
  subject: z.string().min(3, 'Subject is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  category: z.enum(['BILLING', 'EQUIPMENT', 'FACILITY', 'TRAINER', 'APP', 'OTHER']).default('OTHER'),
});

export const replyTicketSchema = z.object({
  message: z.string().min(2, 'Reply message cannot be empty'),
});

// Member PWA DPDP Schemas
export const dpdpAccountDeleteSchema = z.object({
  reason: z.string().min(5, 'Reason for account deletion is required'),
  confirmPhone: z.string().min(8, 'Phone verification required for DPDP compliance'),
});
