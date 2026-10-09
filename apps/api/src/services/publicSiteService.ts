import { Types } from 'mongoose';
import { Tenant } from '../models/Tenant.js';
import { Branch } from '../models/Branch.js';
import { Plan } from '../models/Plan.js';
import { Trainer } from '../models/Trainer.js';
import { Review } from '../models/Review.js';
import { Lead } from '../models/Lead.js';
import { Trial } from '../models/Trial.js';
import { LEAD_SOURCE, LEAD_PIPELINE_STATUS, LEAD_SCORE } from '@gymos/shared';
import type { PublicTrialBookingInput, PublicPlanPurchaseInput } from '@gymos/shared';
import crypto from 'node:crypto';

export class PublicSiteService {
  /**
   * Resolve Tenant & Public Content by Subdomain or Custom Domain
   */
  public static async getPublicGymData(slugOrDomain: string) {
    const slug = slugOrDomain.toLowerCase().trim();

    // Query tenant by subdomain or customDomain
    const tenant = await Tenant.findOne({
      $or: [{ subdomain: slug }, { customDomain: slug }],
      isDeleted: false,
    }).lean();

    if (!tenant) {
      const err: any = new Error(`Gym "${slugOrDomain}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const tenantObjectId = tenant._id;

    // Fetch branches, plans, trainers, reviews
    const [branches, plans, trainers, reviews] = await Promise.all([
      Branch.find({ tenantId: tenantObjectId, isActive: true }).lean(),
      Plan.find({ tenantId: tenantObjectId, isActive: true }).sort({ priceInPaise: 1 }).lean(),
      Trainer.find({ tenantId: tenantObjectId, isActive: true }).populate('userId', 'name').lean(),
      Review.find({ tenantId: tenantObjectId, isPublic: true, isApproved: true }).sort({ rating: -1 }).limit(10).lean(),
    ]);

    const primaryBranch = branches[0];

    // WhatsApp Click-to-Chat number (clean non-digits)
    const cleanPhone = (tenant.contactPhone || '').replace(/\D/g, '');
    const whatsappLink = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(`Hi ${tenant.name}, I would like to enquire about gym membership and trial session!`)}`
      : '';

    // SEO Meta Tags & Schema.org JSON-LD
    const siteUrl = tenant.customDomain ? `https://${tenant.customDomain}` : `https://${tenant.subdomain}.gymos.techofay.com`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ExerciseGym',
      name: tenant.name,
      url: siteUrl,
      logo: tenant.settings?.logoUrl || `${siteUrl}/logo.png`,
      telephone: tenant.contactPhone,
      email: tenant.contactEmail,
      priceRange: '₹₹',
      address: primaryBranch ? {
        '@type': 'PostalAddress',
        streetAddress: primaryBranch.address,
        addressLocality: primaryBranch.city,
        addressRegion: primaryBranch.state,
        postalCode: primaryBranch.pincode,
        addressCountry: 'IN',
      } : undefined,
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '06:00',
          closes: '22:00',
        },
      ],
    };

    return {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        brandColor: tenant.settings?.brandColor || '#10b981',
        logoUrl: tenant.settings?.logoUrl,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        currency: tenant.settings?.currency || 'INR',
        whatsappLink,
      },
      branches: branches.map((b) => ({
        id: b._id,
        name: b.name,
        code: b.code,
        address: b.address,
        city: b.city,
        state: b.state,
        pincode: b.pincode,
        phone: b.phone,
        email: b.email,
        operatingHours: b.operatingHours,
      })),
      plans: plans.map((p) => ({
        id: p._id,
        name: p.name,
        code: p.code,
        description: p.description,
        durationDays: p.durationDays,
        priceInPaise: p.priceInPaise,
        priceFormatted: `₹${(p.priceInPaise / 100).toLocaleString('en-IN')}`,
        type: p.type,
      })),
      trainers: trainers.map((t: any) => ({
        id: t._id,
        name: t.name || t.userId?.name || 'Certified Fitness Coach',
        specializations: t.specializations || ['Strength Training', 'Functional Fitness'],
        qualifications: t.qualifications || ['ACE Certified'],
        rating: t.rating || 5,
        bio: t.bio || 'Passionate coach dedicated to transforming lives and achieving strength goals.',
      })),
      testimonials: reviews.map((r: any) => ({
        id: r._id,
        rating: r.rating,
        reviewText: r.reviewText,
        author: 'Verified Gym Member',
        createdAt: r.createdAt,
      })),
      facilities: [
        { name: 'Olympic Free Weights & Power Racks', icon: 'Dumbbell' },
        { name: 'State-of-the-Art Cardio Zone', icon: 'Activity' },
        { name: 'Functional Cross-Training Rig', icon: 'Flame' },
        { name: 'Luxury Shower & Locker Rooms', icon: 'ShieldCheck' },
        { name: 'Certified Nutrition & PT Consultations', icon: 'HeartPulse' },
        { name: 'Biometric & QR Instant Access', icon: 'QrCode' },
      ],
      seo: {
        title: `${tenant.name} | Premium Gym & Fitness Center`,
        description: `Join ${tenant.name}. World-class gym facilities, certified personal trainers, dynamic group workouts, and affordable memberships in ${primaryBranch?.city || 'India'}.`,
        jsonLd,
      },
    };
  }

  /**
   * Online Trial Booking: Ingests directly into CRM Pipeline as HOT lead
   */
  public static async bookTrialLead(input: PublicTrialBookingInput) {
    const slug = input.tenantSlug.toLowerCase().trim();
    const tenant = await Tenant.findOne({
      $or: [{ subdomain: slug }, { customDomain: slug }],
      isDeleted: false,
    });

    if (!tenant) {
      const err: any = new Error(`Gym "${input.tenantSlug}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const tenantObjectId = tenant._id;

    // Resolve branch
    let branchObjectId: Types.ObjectId;
    if (input.branchId) {
      branchObjectId = new Types.ObjectId(input.branchId);
    } else {
      const defaultBranch = await Branch.findOne({ tenantId: tenantObjectId, isActive: true });
      if (!defaultBranch) {
        const err: any = new Error('No active gym branch found to book trial');
        err.statusCode = 400;
        throw err;
      }
      branchObjectId = defaultBranch._id;
    }

    // 1. Create or Update Lead in CRM
    let lead = await Lead.findOne({
      tenantId: tenantObjectId,
      phone: input.phone.trim(),
    });

    if (!lead) {
      lead = await Lead.create({
        tenantId: tenantObjectId,
        branchId: branchObjectId,
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        phone: input.phone.trim(),
        source: LEAD_SOURCE.WEBSITE,
        pipelineStatus: LEAD_PIPELINE_STATUS.TRIAL_BOOKED,
        leadScore: LEAD_SCORE.HOT,
        tags: ['Website Trial Booking', input.fitnessGoal || 'General Fitness'],
        notes: `Online Trial Request for ${input.preferredDate || 'Upcoming date'} (${input.preferredTimeSlot || 'Anytime'}). Fitness Goal: ${input.fitnessGoal}. ${input.notes || ''}`,
      });
    } else {
      lead.pipelineStatus = LEAD_PIPELINE_STATUS.TRIAL_BOOKED;
      lead.leadScore = LEAD_SCORE.HOT;
      lead.tags.push('Website Trial Booking');
      lead.notes = `${lead.notes || ''}\nNew Trial Booking: ${input.preferredDate || 'Upcoming'} (${input.preferredTimeSlot || 'Anytime'})`;
      await lead.save();
    }

    // 2. Schedule Trial Record
    const slotTime = input.preferredDate ? new Date(input.preferredDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const trial = await Trial.create({
      tenantId: tenantObjectId,
      branchId: branchObjectId,
      leadId: lead._id,
      slotTime,
      status: 'SCHEDULED',
      notes: `Goal: ${input.fitnessGoal}. Slot: ${input.preferredTimeSlot || 'Standard Slot'}`,
    });

    const cleanPhone = (tenant.contactPhone || '').replace(/\D/g, '');
    const whatsappLink = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(`Hi ${tenant.name}, I just registered for a free trial session! (Booking Ref: ${trial._id})`)}`
      : '';

    return {
      success: true,
      bookingId: trial._id,
      leadId: lead._id,
      gymName: tenant.name,
      slotTime: trial.slotTime,
      whatsappLink,
      message: `Your free trial session at ${tenant.name} has been booked! Our fitness advisor will contact you shortly to confirm your slot.`,
    };
  }

  /**
   * Membership Enquiry from Website Form
   */
  public static async submitEnquiryLead(
    slug: string,
    data: { name: string; email: string; phone: string; message?: string; branchId?: string },
  ) {
    const tenant = await Tenant.findOne({
      $or: [{ subdomain: slug.toLowerCase() }, { customDomain: slug.toLowerCase() }],
      isDeleted: false,
    });

    if (!tenant) {
      const err: any = new Error(`Gym "${slug}" not found`);
      err.statusCode = 404;
      throw err;
    }

    let branchObjectId: Types.ObjectId;
    if (data.branchId) {
      branchObjectId = new Types.ObjectId(data.branchId);
    } else {
      const primaryBranch = await Branch.findOne({ tenantId: tenant._id, isActive: true });
      if (!primaryBranch) {
        const err: any = new Error('No active branch found');
        err.statusCode = 400;
        throw err;
      }
      branchObjectId = primaryBranch._id;
    }

    // Create lead in CRM
    const lead = await Lead.create({
      tenantId: tenant._id,
      branchId: branchObjectId,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      source: LEAD_SOURCE.WEBSITE,
      pipelineStatus: LEAD_PIPELINE_STATUS.NEW,
      leadScore: LEAD_SCORE.WARM,
      tags: ['Website Enquiry'],
      notes: data.message || 'General membership inquiry from website contact form.',
    });

    return {
      success: true,
      leadId: lead._id,
      message: `Thank you for reaching out to ${tenant.name}! Our team will get back to you within 2 hours.`,
    };
  }

  /**
   * Online Plan Purchase / Mock Razorpay Checkout
   */
  public static async initiatePlanPurchase(input: PublicPlanPurchaseInput) {
    const slug = input.tenantSlug.toLowerCase().trim();
    const tenant = await Tenant.findOne({
      $or: [{ subdomain: slug }, { customDomain: slug }],
      isDeleted: false,
    });

    if (!tenant) {
      const err: any = new Error(`Gym "${input.tenantSlug}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const plan = await Plan.findOne({ _id: new Types.ObjectId(input.planId), tenantId: tenant._id });
    if (!plan) {
      const err: any = new Error('Selected membership plan not found');
      err.statusCode = 404;
      throw err;
    }

    // Mock Razorpay Order ID
    const mockOrderId = `order_mock_${crypto.randomBytes(6).toString('hex')}`;

    // Record as Hot Lead in CRM
    let branchId: Types.ObjectId | undefined = input.branchId
      ? new Types.ObjectId(input.branchId)
      : plan.branchIds[0];

    if (!branchId) {
      const branch = await Branch.findOne({ tenantId: tenant._id, isActive: true });
      if (branch) {
        branchId = branch._id;
      }
    }

    if (branchId) {
      await Lead.create({
        tenantId: tenant._id,
        branchId,
        name: input.customerName.trim(),
        email: input.customerEmail.toLowerCase().trim(),
        phone: input.customerPhone.trim(),
        source: LEAD_SOURCE.WEBSITE,
        pipelineStatus: LEAD_PIPELINE_STATUS.INTERESTED,
        leadScore: LEAD_SCORE.HOT,
        tags: ['Online Purchase Attempt', plan.name],
        notes: `Initiated online checkout for plan "${plan.name}" (₹${plan.priceInPaise / 100}) via ${input.paymentMethod}. Order: ${mockOrderId}`,
      });
    }

    return {
      success: true,
      isMockPayment: true,
      paymentGateway: 'RAZORPAY_MOCK',
      orderId: mockOrderId,
      amountInPaise: plan.priceInPaise,
      currency: 'INR',
      keyId: 'rzp_test_MOCK_ENV_KEY',
      plan: {
        id: plan._id,
        name: plan.name,
        priceInPaise: plan.priceInPaise,
        priceFormatted: `₹${(plan.priceInPaise / 100).toLocaleString('en-IN')}`,
        durationDays: plan.durationDays,
      },
      customer: {
        name: input.customerName,
        email: input.customerEmail,
        phone: input.customerPhone,
      },
    };
  }
}
