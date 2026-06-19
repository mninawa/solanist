export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  pricePerVisit: number;
  visitsPerYear: number;
  annualPrice: number;
  features: string[];
  recommended?: boolean;
}

export interface PropertyDetails {
  address: string;
  city: string;
  postcode: string;
  panelCount: number;
  roofType: string;
  accessNotes?: string;
  systemSizeKw?: number;
  imageUrl?: string;
}

export interface InviteQuote {
  basePrice: number;
  estimatedPanelCount: number;
  serviceType: string;
  quoteRef?: string;
  notes?: string;
}

export interface InviteData {
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quote: InviteQuote;
  property: PropertyDetails;
  plans: ServicePlan[];
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired';
  signupBlockedReason?: string | null;
}

export interface InviteFlowState {
  inviteCode: string;
  currentStep: number;
  selectedPlanId: string | null;
  preferredServiceDate: string | null;
  preferredTimeSlot: string | null;
  propertyConfirmed: boolean;
  panelCount: number | null;
  roofType: string | null;
  accessNotes: string | null;
}

export type OnboardingStep = 1 | 2 | 3 | 4;
