import { InviteData, ServicePlan } from '../models/invite.models';

export interface InviteDtoApi {
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quote: {
    basePrice: number;
    estimatedPanelCount: number;
    serviceType: string;
    quoteRef?: string;
    notes?: string;
  };
  property: {
    address: string;
    city: string;
    postcode: string;
    panelCount: number;
    roofType: string;
    accessNotes?: string;
    systemSizeKw?: number;
    imageUrl?: string;
  };
  plans: ServicePlan[];
  expiresAt: string;
  status: string;
  signupBlockedReason?: string | null;
}

export function mapInvite(dto: InviteDtoApi): InviteData {
  return {
    code: dto.code,
    customerName: dto.customerName,
    customerEmail: dto.customerEmail,
    customerPhone: dto.customerPhone,
    quote: { ...dto.quote },
    property: { ...dto.property },
    plans: dto.plans.map((p) => ({ ...p, features: [...p.features] })),
    expiresAt: dto.expiresAt,
    status: dto.status as InviteData['status'],
    signupBlockedReason: dto.signupBlockedReason ?? null,
  };
}
