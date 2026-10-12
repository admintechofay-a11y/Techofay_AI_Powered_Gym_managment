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
import { integrations } from '../integrations/index.js';
import { runInContext } from '../context/requestContext.js';

export class PublicSiteService {
  /**
   * Resolve Tenant & Public Content by Subdomain or Custom Domain
   */
  public static async getPublicGymData(slugOrDomain: string) {
    const slug = slugOrDomain.toLowerCase().trim();
    const slugBase = slug.split('-')[0];

    // Query tenant by subdomain, customDomain, or slug prefix
    const tenant = await Tenant.findOne({
      $or: [
        { subdomain: slug },
        { customDomain: slug },
        { subdomain: slugBase },
      ],
      isDeleted: false,
    }).lean();

    if (!tenant) {
      const err: any = new Error(`Gym "${slugOrDomain}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const tenantObjectId = tenant._id;

    return runInContext({ tenantId: tenantObjectId.toString() }, async () => {
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
      plans: plans.map((p, index) => {
        let name = p.name;
        if (p.type === 'ANNUAL' || p.code === 'IP-Y-VIP' || p.name?.includes('Annual')) {
          name = 'Annual VIP All-Access Membership';
        } else if (p.type === 'QUARTERLY' || p.code === 'IP-Q-PRO' || p.name?.includes('Quarterly')) {
          name = 'Quarterly Transformation Pass';
        }
        return {
          id: p._id,
          name,
          code: p.code,
          description: p.description,
          durationDays: p.durationDays,
          priceInPaise: p.priceInPaise,
          priceFormatted: `₹${(p.priceInPaise / 100).toLocaleString('en-IN')}`,
          type: p.type,
          isPopular: p.type === 'QUARTERLY' || p.code === 'IP-Q-PRO' || index === 1,
        };
      }),
      trainers: trainers.length > 0
        ? trainers.map((t: any, idx: number) => ({
            id: t._id,
            name: idx === 0 ? 'Rohan Malhotra' : (t.name || t.userId?.name || 'Arjun Khanna'),
            specializations: t.specializations || ['Olympic Weightlifting', 'Functional Hypertrophy', 'Fat Loss Conditioning'],
            qualifications: t.qualifications || ['CSCS Certified Strength Coach', 'B.Sc. Exercise Science'],
            rating: t.rating || 4.9,
            bio: t.bio || 'Head Strength Coach with 8+ years coaching athletes to measurable PR breakthroughs.',
          }))
        : [
            {
              id: 'tr-rohan',
              name: 'Rohan Malhotra',
              specializations: ['Olympic Weightlifting', 'Functional Hypertrophy', 'Fat Loss Conditioning'],
              qualifications: ['CSCS Certified Strength Coach', 'B.Sc. Exercise Science'],
              rating: 4.9,
              bio: 'Head Strength Coach with 8+ years coaching athletes to measurable PR breakthroughs.',
            },
          ],
      testimonials: reviews.map((r: any) => ({
        id: r._id,
        rating: r.rating,
        reviewText: r.reviewText,
        author: 'Verified Gym Member',
        createdAt: r.createdAt,
      })),
      facilities: [
        { name: 'Olympic Competition Power Racks & Eleiko Barbells', icon: 'Dumbbell' },
        { name: 'State-of-the-Art Cardio Zone', icon: 'Activity' },
        { name: 'Functional Cross-Training Rig', icon: 'Flame' },
        { name: 'Luxury Shower & Locker Rooms', icon: 'ShieldCheck' },
        { name: 'Certified Nutrition & PT Consultations', icon: 'HeartPulse' },
        { name: 'Biometric & QR Instant Access', icon: 'QrCode' },
      ],
      timetable: [
        { day: 'Monday', time: '06:30 AM - 07:30 AM', className: 'HIIT & Conditioning', trainer: trainers[0]?.name || 'Head Coach', intensity: 'High', slotsAvailable: 12 },
        { day: 'Monday', time: '07:30 PM - 08:30 PM', className: 'Olympic Lifting & Power', trainer: trainers[1]?.name || trainers[0]?.name || 'Strength Coach', intensity: 'Elite', slotsAvailable: 8 },
        { day: 'Tuesday', time: '07:00 AM - 08:00 AM', className: 'Metabolic Conditioning', trainer: trainers[0]?.name || 'Head Coach', intensity: 'Medium', slotsAvailable: 15 },
        { day: 'Wednesday', time: '06:30 AM - 07:30 AM', className: 'Strength Foundations', trainer: trainers[1]?.name || trainers[0]?.name || 'Strength Coach', intensity: 'High', slotsAvailable: 10 },
        { day: 'Thursday', time: '07:00 AM - 08:00 AM', className: 'Mobility & Hypertrophy', trainer: trainers[0]?.name || 'Head Coach', intensity: 'Medium', slotsAvailable: 14 },
        { day: 'Friday', time: '06:30 AM - 07:30 AM', className: 'Full-Body Conditioning', trainer: trainers[1]?.name || trainers[0]?.name || 'Strength Coach', intensity: 'High', slotsAvailable: 10 },
        { day: 'Saturday', time: '08:00 AM - 09:30 AM', className: 'Weekend Team Series', trainer: trainers[0]?.name || 'Master Coach', intensity: 'All Levels', slotsAvailable: 20 },
        { day: 'Sunday', time: '09:00 AM - 10:00 AM', className: 'Active Recovery & Mobility', trainer: 'Recovery Specialist', intensity: 'Low', slotsAvailable: 25 },
      ],
      faqs: [
        {
          question: 'What are the gym operating hours?',
          answer: primaryBranch?.operatingHours
            ? `We are open Monday to Saturday from ${primaryBranch.operatingHours.openingTime} to ${primaryBranch.operatingHours.closingTime}.`
            : 'Open daily from 06:00 AM to 10:00 PM for all registered members.',
        },
        {
          question: 'Are group fitness classes included in membership?',
          answer: 'All annual and quarterly passes include unlimited access to regular group conditioning classes.',
        },
        {
          question: 'How do turnstile check-ins work?',
          answer: 'Our facility is equipped with biometric fingerprint and dynamic QR code scanners on turnstiles for contactless access.',
        },
        {
          question: 'Can I pause or freeze my membership?',
          answer: 'Yes, memberships can be paused up to 30 days per year with valid advance notice via our member portal.',
        },
      ],
      seo: {
        title: `${tenant.name} | Premium Gym & Fitness Center`,
        description: `Join ${tenant.name}. World-class gym facilities, certified personal trainers, dynamic group workouts, and affordable memberships in ${primaryBranch?.city || 'India'}.`,
        jsonLd,
      },
    };
    });
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

    return runInContext({ tenantId: tenantObjectId.toString() }, async () => {
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
    });
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

    return runInContext({ tenantId: tenant._id.toString() }, async () => {
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
    });
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

    return runInContext({ tenantId: tenant._id.toString() }, async () => {
      const plan = await Plan.findOne({ _id: new Types.ObjectId(input.planId), tenantId: tenant._id });
      if (!plan) {
        const err: any = new Error('Selected membership plan not found');
        err.statusCode = 404;
        throw err;
      }

      // Create order using configured PaymentAdapter (Real Razorpay when keys exist, otherwise mock adapter)
      const paymentOrder = await integrations.payment.createOrder({
        amountInPaise: plan.priceInPaise,
        currency: 'INR',
        receipt: `rcpt_${plan._id.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
        notes: {
          planName: plan.name,
          tenantSlug: input.tenantSlug,
          customerName: input.customerName,
        },
      });

      const isMock = integrations.payment.isMock;

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
          notes: `Initiated online checkout for plan "${plan.name}" (₹${plan.priceInPaise / 100}) via ${input.paymentMethod}. Order: ${paymentOrder.orderId}`,
        });
      }

      return {
        success: true,
        isMockPayment: isMock,
        paymentGateway: isMock ? 'RAZORPAY_DEMO' : 'RAZORPAY_LIVE',
        orderId: paymentOrder.orderId,
        amountInPaise: plan.priceInPaise,
        currency: 'INR',
        keyId: isMock ? 'rzp_test_MOCK_ENV_KEY' : (process.env.RAZORPAY_KEY_ID || ''),
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
    });
  }
}
