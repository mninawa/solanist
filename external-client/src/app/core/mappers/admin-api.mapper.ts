import {
  AdminBooking,
  AdminCustomer,
  AdminCustomerDetail,
  AdminDashboard,
  AdminInboxStats,
  AdminInvite,
  AdminLead,
  AdminPortalSettings,
  AdminScheduleSlot,
  AdminStaffMember,
  AdminSubscriptionPlan,
  AdminSubscriptionRow,
  AdminSubscriptionStats,
  AdminReportDetail,
  AdminReportListItem,
  AdminReportStats,
} from '../models/admin.models';
import { CleaningReport } from '../models/client.models';
import { ServicePlan } from '../models/invite.models';
import { mapStaffJob, mapStaffJobSummary, StaffJobDtoApi } from './staff-api.mapper';

export interface AdminLeadDtoApi {
  id: string;
  source: string;
  status: string;
  pipelineStage: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  city: string;
  postcode?: string;
  province?: string;
  panelCount: number;
  estimatedPanelsRange?: string;
  roofType: string;
  accessNotes?: string;
  preferredServiceTime?: string;
  propertyType?: string;
  notes: string;
  requestSnippet: string;
  createdAt: string;
  urgency: string;
  leadScore: number;
  serviceType: string;
  tags: { label: string; tone: string }[];
  bestTimeToContact?: string;
  preferredContact?: string;
  quoteRef?: string;
  inviteCode?: string;
  inviteLink?: string;
  recommendedPlan?: string;
  activities: {
    id: string;
    type: string;
    title: string;
    description?: string;
    timestamp: string;
  }[];
  checklist: { label: string; done: boolean; date?: string }[];
  nearbyLeads: { name: string; location: string; score: number }[];
  quoteSummary?: {
    ref: string;
    planName: string;
    price: number;
    priceLabel: string;
    status: string;
    firstVisit?: string;
  };
  conversationNotes?: string;
}

export interface AdminDashboardDtoApi {
  adminName: string;
  stats: {
    newLeadsToday: number;
    newLeadsTrend: string;
    quotesSent: number;
    quotesTrend: string;
    jobsScheduled: number;
    jobsTrend: string;
    activeSubscriptions: number;
    subscriptionsTrend: string;
    revenueMtd: number;
    revenueTrend: string;
  };
  funnel: { label: string; count: number; stage?: string }[];
  conversionRate: number;
  avgTimeToWin: number;
  hotspots: { area: string; leads: number }[];
  upcomingJobs: {
    id: string;
    dateLabel: string;
    time: string;
    service: string;
    customerName: string;
    location: string;
    status: string;
  }[];
  barkRequests: {
    id: string;
    customerName: string;
    location: string;
    minutesAgo: number;
    urgency: string;
    statusLabel?: string;
  }[];
  aiSummary: string[];
  revenuePaid: number;
  revenuePending: number;
  avgDealSize: number;
  openLeads: number;
  todayJobs: StaffJobDtoApi[];
  revenueTrendPoints: { label: string; amount: number }[];
}

export interface AdminBookingDtoApi {
  id: string;
  bookingRef: string;
  customerName: string;
  propertyAddress: string;
  date: string;
  timeSlot: string;
  status: string;
  staffName?: string;
  staffId?: string;
  planName?: string;
  panelCount?: number;
}

export interface AdminInviteDtoApi {
  id: string;
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
  sentAt: string;
  sentBy: string;
}

function mapLead(dto: AdminLeadDtoApi): AdminLead {
  return {
    id: dto.id,
    source: dto.source as AdminLead['source'],
    status: dto.status as AdminLead['status'],
    pipelineStage: dto.pipelineStage as AdminLead['pipelineStage'],
    customerName: dto.customerName,
    customerEmail: dto.customerEmail,
    customerPhone: dto.customerPhone,
    propertyAddress: dto.propertyAddress,
    city: dto.city,
    postcode: dto.postcode,
    province: dto.province,
    panelCount: dto.panelCount,
    estimatedPanelsRange: dto.estimatedPanelsRange,
    roofType: dto.roofType,
    accessNotes: dto.accessNotes,
    preferredServiceTime: dto.preferredServiceTime,
    propertyType: dto.propertyType,
    notes: dto.notes,
    requestSnippet: dto.requestSnippet,
    createdAt: dto.createdAt,
    urgency: dto.urgency as AdminLead['urgency'],
    leadScore: dto.leadScore,
    serviceType: dto.serviceType,
    tags: (dto.tags ?? []).map((t) => ({ label: t.label, tone: t.tone as AdminLead['tags'][0]['tone'] })),
    bestTimeToContact: dto.bestTimeToContact,
    preferredContact: dto.preferredContact,
    quoteRef: dto.quoteRef,
    inviteCode: dto.inviteCode,
    inviteLink: dto.inviteLink,
    recommendedPlan: dto.recommendedPlan,
    activities: (dto.activities ?? []).map((a) => ({
      id: a.id,
      type: a.type as AdminLead['activities'][0]['type'],
      title: a.title,
      description: a.description,
      timestamp: a.timestamp,
    })),
    checklist: (dto.checklist ?? []).map((c) => ({ ...c })),
    nearbyLeads: (dto.nearbyLeads ?? []).map((n) => ({ ...n })),
    quoteSummary: dto.quoteSummary
      ? {
          ref: dto.quoteSummary.ref,
          planName: dto.quoteSummary.planName,
          price: dto.quoteSummary.price,
          priceLabel: dto.quoteSummary.priceLabel,
          status: dto.quoteSummary.status as 'draft' | 'sent' | 'accepted',
          firstVisit: dto.quoteSummary.firstVisit,
        }
      : undefined,
    conversationNotes: dto.conversationNotes,
  };
}

export function mapAdminDashboard(dto: AdminDashboardDtoApi): AdminDashboard {
  return {
    adminName: dto.adminName,
    stats: { ...dto.stats },
    funnel: dto.funnel.map((f) => ({
      label: f.label,
      count: f.count,
      stage: (f.stage ?? funnelLabelToStage(f.label)) as AdminDashboard['funnel'][0]['stage'],
    })),
    conversionRate: dto.conversionRate,
    avgTimeToWin: dto.avgTimeToWin,
    hotspots: dto.hotspots.map((h) => ({ area: h.area, leads: h.leads })),
    upcomingJobs: dto.upcomingJobs.map((j) => ({
      id: j.id,
      dateLabel: j.dateLabel,
      time: j.time,
      service: j.service,
      customerName: j.customerName,
      location: j.location,
      status: j.status as AdminDashboard['upcomingJobs'][0]['status'],
    })),
    barkRequests: dto.barkRequests.map((b) => ({
      id: b.id,
      customerName: b.customerName,
      location: b.location,
      minutesAgo: b.minutesAgo,
      urgency: b.urgency as AdminDashboard['barkRequests'][0]['urgency'],
      statusLabel: b.statusLabel,
    })),
    aiSummary: [...dto.aiSummary],
    revenuePaid: dto.revenuePaid,
    revenuePending: dto.revenuePending,
    avgDealSize: dto.avgDealSize,
    openLeads: dto.openLeads,
    todayJobs: dto.todayJobs.map((j) => mapStaffJobSummary(mapStaffJob(j))),
    revenueTrendPoints: (dto.revenueTrendPoints ?? []).map((p) => ({
      label: p.label,
      amount: p.amount,
    })),
  };
}

export function mapAdminBooking(dto: AdminBookingDtoApi): AdminBooking {
  return {
    id: dto.id,
    bookingRef: dto.bookingRef,
    customerName: dto.customerName,
    propertyAddress: dto.propertyAddress,
    date: dto.date,
    timeSlot: dto.timeSlot,
    status: dto.status as AdminBooking['status'],
    staffName: dto.staffName,
    staffId: dto.staffId,
    planName: dto.planName,
    panelCount: dto.panelCount,
  };
}

export function mapAdminInvite(dto: AdminInviteDtoApi): AdminInvite {
  return {
    id: dto.id,
    code: dto.code,
    customerName: dto.customerName,
    customerEmail: dto.customerEmail,
    customerPhone: dto.customerPhone,
    quote: { ...dto.quote },
    property: { ...dto.property },
    plans: (dto.plans ?? []).map((p) => ({ ...p, features: [...(p.features ?? [])] })),
    expiresAt: dto.expiresAt,
    status: dto.status as AdminInvite['status'],
    sentAt: dto.sentAt,
    sentBy: dto.sentBy,
  };
}

export function mapAdminLead(dto: AdminLeadDtoApi): AdminLead {
  return mapLead(dto);
}

export function mapAdminReport(dto: {
  id: string;
  completedAt: string;
  serviceType: string;
  panelCount: number;
  staffName: string;
  propertyAddress: string;
  beforePhotos: string[];
  afterPhotos: string[];
  checklistSummary: string[];
  staffNotes: string;
  propertyId?: string;
  bookingId?: string;
  planName?: string;
  systemSizeKw?: number;
  roofType?: string;
  accessNotes?: string;
  propertyImageUrl?: string;
  beforeKwhReading?: number;
  afterKwhReading?: number;
  kwhGain?: number;
  status?: string;
}): CleaningReport {
  return {
    id: dto.id,
    completedAt: dto.completedAt,
    serviceType: dto.serviceType,
    panelCount: dto.panelCount,
    staffName: dto.staffName,
    propertyAddress: dto.propertyAddress,
    beforePhotos: [...dto.beforePhotos],
    afterPhotos: [...dto.afterPhotos],
    checklistSummary: [...dto.checklistSummary],
    staffNotes: dto.staffNotes,
    propertyId: dto.propertyId,
    bookingId: dto.bookingId,
    planName: dto.planName,
    systemSizeKw: dto.systemSizeKw,
    roofType: dto.roofType,
    accessNotes: dto.accessNotes,
    propertyImageUrl: dto.propertyImageUrl,
    beforeKwhReading: dto.beforeKwhReading,
    afterKwhReading: dto.afterKwhReading,
    kwhGain: dto.kwhGain,
    status: dto.status as 'completed' | undefined,
  };
}

export function mapAdminCustomer(dto: {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyCount: number;
  planName?: string;
  status: string;
  primaryAddress: string;
}): AdminCustomer {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    propertyCount: dto.propertyCount,
    planName: dto.planName,
    status: dto.status as AdminCustomer['status'],
    primaryAddress: dto.primaryAddress,
  };
}

interface AdminCustomerDetailDtoApi {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  preferredContact: string;
  emailReminders: boolean;
  whatsAppReminders: boolean;
  billingMode: string;
  properties: {
    id: string;
    address: string;
    city: string;
    postcode: string;
    panelCount: number;
    roofType: string;
    systemSizeKw?: number;
    isPrimary: boolean;
    planName?: string;
    nextCleanDate?: string;
    imageUrl?: string;
  }[];
  subscription?: {
    planName: string;
    status: string;
    pricePerVisit: number;
    annualPrice: number;
    billingCycle: string;
    nextBillingDate: string;
    visitsRemaining: number;
    paymentMethod: string;
    features: string[];
  } | null;
  bookings: AdminBookingDtoApi[];
}

export function mapAdminCustomerDetail(dto: AdminCustomerDetailDtoApi): AdminCustomerDetail {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    status: dto.status as AdminCustomerDetail['status'],
    preferredContact: dto.preferredContact,
    emailReminders: dto.emailReminders,
    whatsAppReminders: dto.whatsAppReminders,
    billingMode: dto.billingMode,
    properties: dto.properties.map((p) => ({ ...p })),
    subscription: dto.subscription
      ? { ...dto.subscription, features: [...dto.subscription.features] }
      : null,
    bookings: dto.bookings.map(mapAdminBooking),
  };
}

export function mapAdminStaff(dto: {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  jobsToday: number;
  completedToday: number;
  email?: string;
  accountRole?: string;
}): AdminStaffMember {
  return {
    id: dto.id,
    fullName: dto.fullName,
    phone: dto.phone,
    role: dto.role,
    status: dto.status as AdminStaffMember['status'],
    jobsToday: dto.jobsToday,
    completedToday: dto.completedToday,
    email: dto.email ?? '',
    accountRole: (dto.accountRole as AdminStaffMember['accountRole']) ?? 'staff',
  };
}

export function mapAdminSubscriptionRow(dto: {
  id: string;
  customerName: string;
  location: string;
  planType: string;
  nextCleanDate: string;
  nextCleanRelative: string;
  paymentStatus: string;
  planStatus: string;
}): AdminSubscriptionRow {
  return {
    id: dto.id,
    customerName: dto.customerName,
    location: dto.location,
    planType: dto.planType as AdminSubscriptionRow['planType'],
    nextCleanDate: dto.nextCleanDate,
    nextCleanRelative: dto.nextCleanRelative,
    paymentStatus: dto.paymentStatus as AdminSubscriptionRow['paymentStatus'],
    planStatus: dto.planStatus as AdminSubscriptionRow['planStatus'],
  };
}

export function mapAdminSubscriptionPlan(dto: {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
  description?: string;
  visitsPerYear?: number;
  annualPrice?: number;
  active?: boolean;
  paystackPlanCode?: string | null;
  paystackInterval?: string;
  paystackLinked?: boolean;
}): AdminSubscriptionPlan {
  return {
    id: dto.id,
    name: dto.name,
    price: dto.price,
    interval: dto.interval,
    features: [...dto.features],
    popular: dto.popular,
    description: dto.description,
    visitsPerYear: dto.visitsPerYear,
    annualPrice: dto.annualPrice,
    active: dto.active ?? true,
    paystackPlanCode: dto.paystackPlanCode ?? null,
    paystackInterval: dto.paystackInterval ?? 'quarterly',
    paystackLinked: dto.paystackLinked ?? false,
  };
}

export function mapAdminScheduleSlot(dto: {
  area: string;
  slots: { time: string; initials: string; status: string }[];
}): AdminScheduleSlot {
  return {
    area: dto.area,
    slots: dto.slots.map((s) => ({
      time: s.time,
      initials: s.initials,
      status: s.status as AdminScheduleSlot['slots'][0]['status'],
    })),
  };
}

export function mapAdminInboxStats(dto: AdminInboxStats): AdminInboxStats {
  return { ...dto };
}

export function mapAdminSubscriptionStats(dto: AdminSubscriptionStats): AdminSubscriptionStats {
  return { ...dto };
}

export interface AdminPortalSettingsDtoApi {
  environment: string;
  databaseName: string;
  appBaseUrl: string;
  passwordResetDemoLinks: boolean;
  mongoConnected: boolean;
  integrations: {
    key: string;
    label: string;
    status: string;
    detail: string;
  }[];
  counts: {
    leads: number;
    customers: number;
    staffMembers: number;
    activeSubscriptions: number;
  };
}

export function mapAdminPortalSettings(dto: AdminPortalSettingsDtoApi): AdminPortalSettings {
  return {
    environment: dto.environment,
    databaseName: dto.databaseName,
    appBaseUrl: dto.appBaseUrl,
    passwordResetDemoLinks: dto.passwordResetDemoLinks,
    mongoConnected: dto.mongoConnected,
    integrations: dto.integrations.map((i) => ({
      key: i.key,
      label: i.label,
      status: i.status as AdminPortalSettings['integrations'][0]['status'],
      detail: i.detail,
    })),
    counts: { ...dto.counts },
  };
}

function funnelLabelToStage(label: string): string {
  const map: Record<string, string> = {
    New: 'new',
    Contacted: 'contacted',
    Interested: 'interested',
    'Quote Sent': 'quote_sent',
    Quoted: 'quote_sent',
    'Invite Sent': 'invite_sent',
    'Signed Up': 'signed_up',
    Won: 'signed_up',
    Subscribed: 'signed_up',
  };
  return map[label] ?? 'new';
}

export function mapAdminReportPerformance(dto: {
  beforeKwh?: number | null;
  afterKwh?: number | null;
  kwhGain?: number | null;
  gainPercent?: number | null;
  gainPerPanel?: number | null;
}): AdminReportListItem['performance'] {
  return {
    beforeKwh: dto.beforeKwh ?? null,
    afterKwh: dto.afterKwh ?? null,
    kwhGain: dto.kwhGain ?? null,
    gainPercent: dto.gainPercent ?? null,
    gainPerPanel: dto.gainPerPanel ?? null,
  };
}

export function mapAdminReportListItem(dto: {
  id: string;
  completedAt: string;
  customerName: string;
  customerId: string;
  propertyAddress: string;
  city?: string | null;
  panelCount: number;
  systemSizeKw?: number | null;
  staffName: string;
  performance: Parameters<typeof mapAdminReportPerformance>[0];
  photoCount: number;
  hasStaffNotes: boolean;
  status: string;
  thumbnailUrl?: string | null;
}): AdminReportListItem {
  return {
    id: dto.id,
    completedAt: dto.completedAt,
    customerName: dto.customerName,
    customerId: dto.customerId,
    propertyAddress: dto.propertyAddress,
    city: dto.city ?? null,
    panelCount: dto.panelCount,
    systemSizeKw: dto.systemSizeKw ?? null,
    staffName: dto.staffName,
    performance: mapAdminReportPerformance(dto.performance),
    photoCount: dto.photoCount,
    hasStaffNotes: dto.hasStaffNotes,
    status: dto.status,
    thumbnailUrl: dto.thumbnailUrl ?? null,
  };
}

export function mapAdminReportStats(dto: {
  totalReports: number;
  reportsThisMonth: number;
  averageKwhGain?: number | null;
  reportsWithPerformanceData: number;
}): AdminReportStats {
  return {
    totalReports: dto.totalReports,
    reportsThisMonth: dto.reportsThisMonth,
    averageKwhGain: dto.averageKwhGain ?? null,
    reportsWithPerformanceData: dto.reportsWithPerformanceData,
  };
}

export function mapAdminReportDetail(dto: {
  documentType: string;
  entities: {
    reportId: string;
    customerId: string;
    customerName?: string | null;
    customerEmail?: string | null;
    propertyId?: string | null;
    bookingId?: string | null;
    staffName?: string | null;
  };
  property: {
    addressLine: string;
    city?: string | null;
    postcode?: string | null;
    fullAddress: string;
    panelCount: number;
    systemSizeKw?: number | null;
    roofType?: string | null;
    accessNotes?: string | null;
  };
  service: {
    completedAt: string;
    serviceType: string;
    planName?: string | null;
    status: string;
    checklistCompleted: string[];
    staffNotes: string;
  };
  performance: Parameters<typeof mapAdminReportPerformance>[0];
  media: {
    beforePhotos: string[];
    afterPhotos: string[];
    propertyImageUrl?: string | null;
    beforePhotoCount: number;
    afterPhotoCount: number;
  };
  narrativeText: string;
}): AdminReportDetail {
  return {
    documentType: dto.documentType,
    entities: {
      reportId: dto.entities.reportId,
      customerId: dto.entities.customerId,
      customerName: dto.entities.customerName ?? null,
      customerEmail: dto.entities.customerEmail ?? null,
      propertyId: dto.entities.propertyId ?? null,
      bookingId: dto.entities.bookingId ?? null,
      staffName: dto.entities.staffName ?? null,
    },
    property: {
      addressLine: dto.property.addressLine,
      city: dto.property.city ?? null,
      postcode: dto.property.postcode ?? null,
      fullAddress: dto.property.fullAddress,
      panelCount: dto.property.panelCount,
      systemSizeKw: dto.property.systemSizeKw ?? null,
      roofType: dto.property.roofType ?? null,
      accessNotes: dto.property.accessNotes ?? null,
    },
    service: {
      completedAt: dto.service.completedAt,
      serviceType: dto.service.serviceType,
      planName: dto.service.planName ?? null,
      status: dto.service.status,
      checklistCompleted: [...dto.service.checklistCompleted],
      staffNotes: dto.service.staffNotes,
    },
    performance: mapAdminReportPerformance(dto.performance),
    media: {
      beforePhotos: [...dto.media.beforePhotos],
      afterPhotos: [...dto.media.afterPhotos],
      propertyImageUrl: dto.media.propertyImageUrl ?? null,
      beforePhotoCount: dto.media.beforePhotoCount,
      afterPhotoCount: dto.media.afterPhotoCount,
    },
    narrativeText: dto.narrativeText,
  };
}
