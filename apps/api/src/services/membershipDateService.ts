import { PLAN_TYPE } from '@gymos/shared';

/**
 * High-precision date arithmetic for membership tenures.
 * Handles month-end boundaries (e.g. Jan 31 + 1 month -> Feb 28/29),
 * leap years, exact day durations, and prorated monetary adjustments.
 */
export class MembershipDateService {
  /**
   * Calculate end date based on start date and plan type or custom days.
   */
  static calculateEndDate(startDate: Date, planType: string, customDays?: number): Date {
    const start = new Date(startDate);
    const end = new Date(start);

    switch (planType) {
      case PLAN_TYPE.MONTHLY: {
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        break;
      }
      case PLAN_TYPE.QUARTERLY: {
        end.setMonth(end.getMonth() + 3);
        end.setDate(end.getDate() - 1);
        break;
      }
      case PLAN_TYPE.HALF_YEARLY: {
        end.setMonth(end.getMonth() + 6);
        end.setDate(end.getDate() - 1);
        break;
      }
      case PLAN_TYPE.ANNUAL: {
        end.setFullYear(end.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
      }
      case PLAN_TYPE.TRIAL: {
        const days = customDays || 7;
        end.setDate(end.getDate() + days - 1);
        break;
      }
      case PLAN_TYPE.CUSTOM:
      default: {
        const days = customDays || 30;
        end.setDate(end.getDate() + days - 1);
        break;
      }
    }

    // Set to end of day in UTC (23:59:59.999)
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Extends an active membership end date by a specific number of days.
   */
  static extendEndDate(currentEndDate: Date, additionalDays: number): Date {
    const end = new Date(currentEndDate);
    end.setDate(end.getDate() + additionalDays);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Calculates freeze extension: when a membership is frozen from freezeStart to freezeEnd,
   * the end date is pushed out by the exact duration of the freeze period.
   */
  static calculateFrozenExtension(
    currentEndDate: Date,
    freezeStartDate: Date,
    freezeEndDate: Date,
  ): { extendedEndDate: Date; frozenDays: number } {
    const start = new Date(freezeStartDate).getTime();
    const end = new Date(freezeEndDate).getTime();
    const diffMs = end - start;
    const frozenDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const extendedEndDate = this.extendEndDate(currentEndDate, frozenDays);
    return { extendedEndDate, frozenDays };
  }

  /**
   * Calculate prorated credit for upgrade/downgrade.
   * Computes the unconsumed value of the current plan in integer paise.
   */
  static calculateProratedAdjustment(
    startDate: Date,
    endDate: Date,
    currentPriceInPaise: number,
    effectiveDate: Date = new Date(),
  ): {
    totalDays: number;
    usedDays: number;
    remainingDays: number;
    unconsumedCreditInPaise: number;
  } {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const effective = new Date(effectiveDate).getTime();

    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const usedDays = Math.max(0, Math.min(totalDays, Math.ceil((effective - start) / (1000 * 60 * 60 * 24))));
    const remainingDays = Math.max(0, totalDays - usedDays);

    // Prorated credit in integer paise
    const unconsumedCreditInPaise = Math.round((currentPriceInPaise * remainingDays) / totalDays);

    return {
      totalDays,
      usedDays,
      remainingDays,
      unconsumedCreditInPaise,
    };
  }
}
