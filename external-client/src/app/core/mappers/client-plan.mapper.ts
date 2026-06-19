import { PaymentStatus, SubscriptionStatus } from '../models/common.models';
import { CleaningReportSummary, PropertyPlanDetails, PropertySummary } from '../models/client.models';

interface ApiSubscriptionPlan {
  planName: string;
  planDescription: string;
  status: string;
  pricePerVisit: number;
  annualPrice: number;
  billingCycle: string;
  nextBillingDate: string;
  nextCleanDate: string;
  visitsRemaining: number;
  paymentMethod: string;
  features: string[];
  paymentProvider?: string;
  requiresPaymentSetup?: boolean;
}

interface ApiUpcomingBooking {
  id: string;
  date: string;
  timeSlot: string;
  staffName?: string | null;
  propertyAddress?: string;
}

interface ApiReportSummary {
  id: string;
  completedAt: string;
  serviceType: string;
  panelCount: number;
  staffName?: string | null;
  thumbnailUrl?: string | null;
}

interface ApiPayment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

export interface PropertyPlanDetailsApi {
  property: PropertySummary;
  plan: ApiSubscriptionPlan | null;
  recentPayments: ApiPayment[];
  upcomingBookings: ApiUpcomingBooking[];
  recentReports: ApiReportSummary[];
}

function frequencyLabel(billingCycle: string, cleansPerYear: number): string {
  const cycle = (billingCycle ?? '').toLowerCase();
  if (cycle.includes('month') && !cycle.includes('3') && !cycle.includes('6')) return 'Monthly';
  if (cycle.includes('quarter') || cleansPerYear === 4) return 'Every 3 months';
  if (cycle.includes('bi-annual') || cycle.includes('biannual') || cleansPerYear === 2) return 'Every 6 months';
  if (cycle.includes('annual') || cleansPerYear === 1) return 'Annually';
  if (cycle.includes('month') || cleansPerYear === 12) return 'Monthly';
  return billingCycle || `${cleansPerYear} cleans per year`;
}

/** Map the backend property-plan payload into the rich PropertyPlanDetails the UI renders. */
export function mapPropertyPlanDetails(dto: PropertyPlanDetailsApi): PropertyPlanDetails {
  const property = dto.property;
  const recentReports: CleaningReportSummary[] = (dto.recentReports ?? []).map((r) => ({
    id: r.id,
    completedAt: r.completedAt,
    serviceType: r.serviceType,
    panelCount: r.panelCount,
    staffName: r.staffName ?? undefined,
    thumbnailUrl: r.thumbnailUrl ?? undefined,
  }));

  const plan = dto.plan;
  if (!plan || property.subscriptionStatus === 'setup_required') {
    return { property, plan: null, nextCleaning: null, billing: null, usage: null, recentReports };
  }

  const cleansPerYear =
    plan.pricePerVisit > 0
      ? Math.max(1, Math.round(plan.annualPrice / plan.pricePerVisit))
      : plan.visitsRemaining || 4;
  const cleansCompleted = Math.max(0, cleansPerYear - plan.visitsRemaining);
  const upcoming = dto.upcomingBookings?.[0] ?? null;
  const lastPayment = dto.recentPayments?.[0] ?? null;
  const address = `${property.address}, ${property.city}, ${property.postcode}`;

  return {
    property,
    plan: {
      name: plan.planName,
      description: plan.planDescription,
      status: (plan.status as SubscriptionStatus) ?? 'active',
      planSince: '',
      pricePerVisit: plan.pricePerVisit,
      frequencyLabel: frequencyLabel(plan.billingCycle, cleansPerYear),
      cleansPerYear,
      visitsRemaining: plan.visitsRemaining,
      annualValue: plan.annualPrice,
      features: plan.features ?? [],
      heroImageUrl: property.imageUrl ?? '',
    },
    nextCleaning:
      upcoming || property.nextCleanDate
        ? {
            date: upcoming?.date ?? property.nextCleanDate!,
            timeSlot: upcoming?.timeSlot ?? property.nextCleanTimeSlot ?? '',
            staffName: upcoming?.staffName ?? null,
            address,
          }
        : null,
    billing: {
      mode: plan.paymentProvider === 'paystack' ? 'Paystack subscription' : 'Subscription billing',
      planPrice: plan.pricePerVisit,
      nextInvoiceDate: plan.nextBillingDate,
      paymentMethod: plan.paymentMethod,
      lastPaymentDate: lastPayment?.date ?? '',
      lastPaymentStatus: (lastPayment?.status as PaymentStatus) ?? 'paid',
    },
    usage: {
      cleansCompleted,
      cleansTotal: cleansPerYear,
      reportsAvailable: recentReports.length,
      nextBillingAmount: plan.pricePerVisit,
      renewDate: plan.nextBillingDate,
    },
    recentReports,
  };
}
