import { MembershipDateService } from '../src/services/membershipDateService.js';
import { PLAN_TYPE } from '@gymos/shared';

describe('MembershipDateService - High-Precision Date Math & Proration', () => {
  it('calculates monthly end date correctly to end of tenure', () => {
    const start = new Date('2026-01-15T10:00:00.000Z');
    const endDate = MembershipDateService.calculateEndDate(start, PLAN_TYPE.MONTHLY);
    // Jan 15 + 1 month - 1 day = Feb 14
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(1); // February
    expect(endDate.getDate()).toBe(14);
  });

  it('calculates quarterly end date correctly', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    const endDate = MembershipDateService.calculateEndDate(start, PLAN_TYPE.QUARTERLY);
    // Jan 01 + 3 months - 1 day = March 31
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(2); // March
    expect(endDate.getDate()).toBe(31);
  });

  it('calculates annual end date across standard year', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    const endDate = MembershipDateService.calculateEndDate(start, PLAN_TYPE.ANNUAL);
    // Jan 01 2026 + 1 year - 1 day = Dec 31 2026
    expect(endDate.getFullYear()).toBe(2026);
    expect(endDate.getMonth()).toBe(11); // December
    expect(endDate.getDate()).toBe(31);
  });

  it('calculates trial end date with custom day allowance', () => {
    const start = new Date('2026-04-10T00:00:00.000Z');
    const endDate = MembershipDateService.calculateEndDate(start, PLAN_TYPE.TRIAL, 7);
    // April 10 + 7 days - 1 day = April 16
    expect(endDate.getDate()).toBe(16);
  });

  it('calculates freeze days and extends membership end date precisely', () => {
    const originalEndDate = new Date(2026, 5, 30, 23, 59, 59);
    const freezeStart = new Date(2026, 2, 1);
    const freezeEnd = new Date(2026, 2, 15); // 14 days frozen

    const { extendedEndDate, frozenDays } = MembershipDateService.calculateFrozenExtension(
      originalEndDate,
      freezeStart,
      freezeEnd,
    );

    expect(frozenDays).toBe(14);
    // 2026-06-30 + 14 days = 2026-07-14
    expect(extendedEndDate.getDate()).toBe(14);
    expect(extendedEndDate.getMonth()).toBe(6); // July
    expect(extendedEndDate.getFullYear()).toBe(2026);
  });

  it('calculates prorated adjustment with integer paise accuracy', () => {
    // 100-day span costing 10,000 INR = 1,000,000 paise
    const startDate = new Date('2026-01-01T00:00:00.000Z');
    const endDate = new Date('2026-04-11T00:00:00.000Z'); // 100 days
    const effectiveDate = new Date('2026-02-10T00:00:00.000Z'); // 40 days used, 60 days remaining
    const currentPriceInPaise = 1000000;

    const adjustment = MembershipDateService.calculateProratedAdjustment(
      startDate,
      endDate,
      currentPriceInPaise,
      effectiveDate,
    );

    expect(adjustment.totalDays).toBe(100);
    expect(adjustment.usedDays).toBe(40);
    expect(adjustment.remainingDays).toBe(60);
    // 60% of 1,000,000 = 600,000 paise
    expect(adjustment.unconsumedCreditInPaise).toBe(600000);
    expect(Number.isInteger(adjustment.unconsumedCreditInPaise)).toBe(true);
  });
});
