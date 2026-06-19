import { BookingConfirmationStatus, BookingStatus, PaymentStatus, SubscriptionStatus } from './common.models';
import { PropertyDetails } from './invite.models';

export interface ClientDashboard {
  customerName: string;
  customerFullName: string;
  greeting: string;
  currentPlan: {
    name: string;
    pricePerVisit: number;
    visitsPerYear: number;
    nextBillingDate: string;
  };
  nextService: {
    date: string;
    timeSlot: string;
    daysUntil: number;
    status: BookingConfirmationStatus;
  } | null;
  property: PropertyDetails;
  systemSizeKw: number;
  latestReport: CleaningReportSummary | null;
  subscription: {
    status: SubscriptionStatus;
    planName: string;
    annualPrice: number;
    visitsRemaining: number;
  };
  valueProps: string[];
  systemStatus: string;
}

export interface PropertySummary extends PropertyDetails {
  id: string;
  isPrimary: boolean;
  subscriptionStatus: PropertySubscriptionStatus;
  planName?: string;
  planVariant?: PropertyPlanVariant;
  planFrequency?: string;
  nextCleanDate?: string | null;
  nextCleanTimeSlot?: string;
  pricePerClean?: number;
  visitsPerYear?: number;
  visitsRemaining?: number;
  monthlyBilling?: number;
}

export type BillingMode = 'combined' | 'split';

export interface InvoicePreviewItem {
  propertyId: string;
  propertyName: string;
  planName: string;
  amount: number;
}

export interface SubscriptionPortfolio {
  billingMode: BillingMode;
  paymentMethod: string;
  nextBillingDate: string;
  upcomingBillingTotal: number;
  invoicePreview: InvoicePreviewItem[];
}

export type PropertySubscriptionStatus = 'active' | 'setup_required' | 'paused';
export type PropertyPlanVariant = 'purple' | 'blue' | 'neutral';

export interface CreatePropertyRequest {
  address: string;
  city: string;
  postcode: string;
  panelCount: number;
  roofType: string;
  accessNotes?: string;
  systemSizeKw?: number;
}

export interface CreateBookingRequest {
  propertyId: string;
  date: string;
  timeSlot: string;
  cleaningType: 'subscription' | 'extra';
  specialInstructions?: string;
}

export interface Booking {
  id: string;
  bookingRef?: string;
  propertyId?: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  serviceType: string;
  propertyAddress: string;
  propertyPostcode?: string;
  planName?: string;
  staffName?: string;
  confirmationStatus?: BookingConfirmationStatus;
  bookedOn?: string;
  serviceDuration?: string;
  panelCount?: number;
  systemSizeKw?: number;
  roofType?: string;
  accessNotes?: string;
  specialInstructions?: string;
  billingNote?: 'subscription' | 'once_off';
  isNextBooking?: boolean;
}

export interface RescheduleBookingRequest {
  bookingId: string;
  date: string;
  timeSlot: string;
  notes?: string;
}

export interface CleaningReportSummary {
  id: string;
  completedAt: string;
  serviceType: string;
  panelCount: number;
  staffName?: string;
  thumbnailUrl?: string;
  rating?: number;
}

export interface ReportNextClean {
  date: string;
  timeSlot: string;
  planName: string;
  bookingId: string;
}

export interface CleaningReport extends CleaningReportSummary {
  propertyId?: string;
  bookingId?: string;
  beforePhotos: string[];
  afterPhotos: string[];
  checklistSummary: string[];
  staffNotes: string;
  propertyAddress: string;
  status?: 'completed';
  planName?: string;
  systemSizeKw?: number;
  roofType?: string;
  accessNotes?: string;
  propertyImageUrl?: string;
  photosTakenAt?: string;
  beforeKwhReading?: number | null;
  afterKwhReading?: number | null;
  kwhGain?: number | null;
  nextClean?: ReportNextClean | null;
}

export interface Subscription {
  planName: string;
  planDescription: string;
  status: SubscriptionStatus;
  pricePerVisit: number;
  annualPrice: number;
  billingCycle: string;
  nextBillingDate: string;
  nextCleanDate: string;
  visitsRemaining: number;
  paymentMethod: string;
  features: string[];
  paymentProvider?: 'paystack' | 'manual';
  requiresPaymentSetup?: boolean;
}

export interface Payment {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  invoiceType?: 'combined' | 'single';
}

export interface ClientProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredContact: 'whatsapp' | 'email' | 'phone';
  emailReminders: boolean;
  whatsAppReminders: boolean;
}

export interface UpdateClientProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  preferredContact: 'whatsapp' | 'email' | 'phone';
  emailReminders: boolean;
  whatsAppReminders: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string | null;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResult {
  success: boolean;
  errorCode?: string | null;
}

export interface PropertyPlanDetails {
  property: PropertySummary;
  plan: {
    name: string;
    description: string;
    status: SubscriptionStatus;
    planSince: string;
    pricePerVisit: number;
    frequencyLabel: string;
    cleansPerYear: number;
    visitsRemaining: number;
    annualValue: number;
    features: string[];
    heroImageUrl: string;
  } | null;
  nextCleaning: {
    date: string;
    timeSlot: string;
    staffName: string | null;
    address: string;
  } | null;
  billing: {
    mode: string;
    planPrice: number;
    nextInvoiceDate: string;
    paymentMethod: string;
    lastPaymentDate: string;
    lastPaymentStatus: PaymentStatus;
  } | null;
  usage: {
    cleansCompleted: number;
    cleansTotal: number;
    reportsAvailable: number;
    nextBillingAmount: number;
    renewDate: string;
  } | null;
  recentReports: CleaningReportSummary[];
}
