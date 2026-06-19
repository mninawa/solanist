import { InviteData } from './invite.models';
import { StaffJobSummary } from './staff.models';

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'converted' | 'lost' | 'interested' | 'quote_sent';
export type LeadSource = 'bark' | 'bark_email' | 'referral' | 'website' | 'whatsapp' | 'other';
export type LeadUrgency = 'normal' | 'urgent';
export interface AdminLeadFilters {
  status?: LeadStatus | '';
  urgency?: LeadUrgency | '';
}

export type LeadPipelineStage =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'quote_sent'
  | 'invite_sent'
  | 'signed_up';

export interface CreateLeadRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  city: string;
  postcode?: string;
  requestSnippet: string;
  notes?: string;
  source?: LeadSource;
  urgency?: LeadUrgency;
  panelCount?: number;
  roofType?: string;
  province?: string;
  serviceType?: string;
}

export interface AdminLeadTag {
  label: string;
  tone: 'teal' | 'gold' | 'red' | 'purple' | 'blue';
}

export interface AdminLeadActivity {
  id: string;
  type: 'created' | 'call' | 'whatsapp' | 'note' | 'quote' | 'invite' | 'follow_up';
  title: string;
  description?: string;
  timestamp: string;
}

export interface AdminLeadChecklistItem {
  label: string;
  done: boolean;
  date?: string;
}

export interface AdminLeadQuoteSummary {
  ref: string;
  planName: string;
  price: number;
  priceLabel: string;
  status: 'draft' | 'sent' | 'accepted';
  firstVisit?: string;
}

export interface AdminNearbyLead {
  name: string;
  location: string;
  score: number;
}

export interface AdminLead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  pipelineStage: LeadPipelineStage;
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
  urgency: LeadUrgency;
  leadScore: number;
  serviceType: string;
  tags: AdminLeadTag[];
  bestTimeToContact?: string;
  preferredContact?: string;
  quoteRef?: string;
  inviteCode?: string;
  inviteLink?: string;
  recommendedPlan?: string;
  activities: AdminLeadActivity[];
  checklist: AdminLeadChecklistItem[];
  nearbyLeads: AdminNearbyLead[];
  quoteSummary?: AdminLeadQuoteSummary;
  conversationNotes?: string;
}

export interface UpdateLeadContactPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  propertyAddress: string;
  city: string;
  bestTimeToContact?: string;
  preferredContact?: string;
}

export interface AdminStaffMember {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: 'active' | 'off_duty';
  jobsToday: number;
  completedToday: number;
  email: string;
  accountRole: 'staff' | 'admin';
}

export interface UpsertStaffRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'staff' | 'admin';
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyCount: number;
  planName?: string;
  status: 'active' | 'prospect';
  primaryAddress: string;
}

export interface AdminCustomerProperty {
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
}

export interface AdminCustomerSubscription {
  planName: string;
  status: string;
  pricePerVisit: number;
  annualPrice: number;
  billingCycle: string;
  nextBillingDate: string;
  visitsRemaining: number;
  paymentMethod: string;
  features: string[];
}

export interface AdminCustomerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'prospect';
  preferredContact: string;
  emailReminders: boolean;
  whatsAppReminders: boolean;
  billingMode: string;
  properties: AdminCustomerProperty[];
  subscription?: AdminCustomerSubscription | null;
  bookings: AdminBooking[];
}

export interface AdminBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  propertyAddress: string;
  date: string;
  timeSlot: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  staffName?: string;
  staffId?: string;
  planName?: string;
  panelCount?: number;
}

export interface AdminSearchHit {
  id: string;
  type: 'lead' | 'customer';
  title: string;
  subtitle: string;
}

export interface AdminSearchResult {
  query: string;
  hits: AdminSearchHit[];
}

export interface AdminInboxStats {
  newLeadsToday: number;
  newLeadsTrend: string;
  emailLeadsCaptured: number;
  emailLeadsTrend: string;
  urgentLeads: number;
  invitesSent: number;
  invitesTrend: string;
  quotesSent: number;
  quotesTrend: string;
  jobsBooked: number;
  jobsBookedTrend: string;
  topLeadScore: number;
  topLeadName?: string;
  hotspots: AdminHotspot[];
  suggestedSteps: string[];
  lastSyncAt: string;
  emailConnected: boolean;
}

export interface AdminFunnelStage {
  label: string;
  count: number;
  stage: LeadPipelineStage;
}

export interface AdminHotspot {
  area: string;
  leads: number;
}

export interface AdminBarkRequest {
  id: string;
  customerName: string;
  location: string;
  minutesAgo: number;
  urgency: LeadUrgency;
  statusLabel?: string;
}

export interface AdminUpcomingJob {
  id: string;
  dateLabel: string;
  time: string;
  service: string;
  customerName: string;
  location: string;
  status: 'scheduled' | 'completed' | 'pending';
}

export interface AdminRevenueTrendPoint {
  label: string;
  amount: number;
}

export interface AdminDashboard {
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
  funnel: AdminFunnelStage[];
  conversionRate: number;
  avgTimeToWin: number;
  hotspots: AdminHotspot[];
  upcomingJobs: AdminUpcomingJob[];
  barkRequests: AdminBarkRequest[];
  aiSummary: string[];
  revenuePaid: number;
  revenuePending: number;
  avgDealSize: number;
  openLeads: number;
  todayJobs: StaffJobSummary[];
  revenueTrendPoints: AdminRevenueTrendPoint[];
}

export interface AdminInvite extends InviteData {
  id: string;
  sentAt: string;
  sentBy: string;
}

export interface AdminSubscriptionPlan {
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
}

export interface UpsertServicePlanRequest {
  name: string;
  description?: string;
  pricePerVisit: number;
  visitsPerYear: number;
  features: string[];
  popular: boolean;
  active: boolean;
  paystackPlanCode?: string | null;
  paystackInterval: string;
}

export interface SyncPaystackPlanResult {
  plan: AdminSubscriptionPlan;
  message?: string | null;
}

export interface AdminSubscriptionRow {
  id: string;
  customerName: string;
  location: string;
  planType: 'Basic' | 'Plus' | 'Premium';
  nextCleanDate: string;
  nextCleanRelative: string;
  paymentStatus: 'paid' | 'due_soon' | 'overdue';
  planStatus: 'active' | 'paused';
}

export interface AdminSubscriptionStats {
  activePlans: number;
  activePlansTrend: string;
  dueThisWeek: number;
  monthlyRecurringRevenue: number;
  mrrTrend: string;
  renewalRate: number;
  renewalTrend: string;
}

export interface AdminScheduleSlot {
  area: string;
  slots: { time: string; initials: string; status: 'completed' | 'scheduled' | 'pending' | 'overdue' }[];
}

export type AdminIntegrationStatus = 'connected' | 'demo' | 'not_configured';

export interface AdminIntegrationSetting {
  key: string;
  label: string;
  status: AdminIntegrationStatus;
  detail: string;
}

export interface AdminPortalCounts {
  leads: number;
  customers: number;
  staffMembers: number;
  activeSubscriptions: number;
}

export interface AdminPortalSettings {
  environment: string;
  databaseName: string;
  appBaseUrl: string;
  passwordResetDemoLinks: boolean;
  mongoConnected: boolean;
  integrations: AdminIntegrationSetting[];
  counts: AdminPortalCounts;
}

export interface AdminReportPerformance {
  beforeKwh: number | null;
  afterKwh: number | null;
  kwhGain: number | null;
  gainPercent: number | null;
  gainPerPanel: number | null;
}

export interface AdminReportListItem {
  id: string;
  completedAt: string;
  customerName: string;
  customerId: string;
  propertyAddress: string;
  city: string | null;
  panelCount: number;
  systemSizeKw: number | null;
  staffName: string;
  performance: AdminReportPerformance;
  photoCount: number;
  hasStaffNotes: boolean;
  status: string;
  thumbnailUrl: string | null;
}

export interface AdminReportStats {
  totalReports: number;
  reportsThisMonth: number;
  averageKwhGain: number | null;
  reportsWithPerformanceData: number;
}

export interface AdminReportEntityRefs {
  reportId: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  propertyId: string | null;
  bookingId: string | null;
  staffName: string | null;
}

export interface AdminReportPropertyContext {
  addressLine: string;
  city: string | null;
  postcode: string | null;
  fullAddress: string;
  panelCount: number;
  systemSizeKw: number | null;
  roofType: string | null;
  accessNotes: string | null;
}

export interface AdminReportServiceContext {
  completedAt: string;
  serviceType: string;
  planName: string | null;
  status: string;
  checklistCompleted: string[];
  staffNotes: string;
}

export interface AdminReportMedia {
  beforePhotos: string[];
  afterPhotos: string[];
  propertyImageUrl: string | null;
  beforePhotoCount: number;
  afterPhotoCount: number;
}

export interface AdminReportDetail {
  documentType: string;
  entities: AdminReportEntityRefs;
  property: AdminReportPropertyContext;
  service: AdminReportServiceContext;
  performance: AdminReportPerformance;
  media: AdminReportMedia;
  narrativeText: string;
}
