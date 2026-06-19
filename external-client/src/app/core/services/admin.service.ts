import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, delay, map, of } from 'rxjs';
import {
  AdminBooking,
  AdminCustomer,
  AdminCustomerDetail,
  AdminDashboard,
  AdminInboxStats,
  AdminInvite,
  AdminLead,
  AdminLeadFilters,
  AdminPortalSettings,
  AdminSearchResult,
  CreateLeadRequest,
  AdminScheduleSlot,
  AdminStaffMember,
  AdminSubscriptionPlan,
  AdminSubscriptionRow,
  AdminSubscriptionStats,
  AdminReportDetail,
  AdminReportListItem,
  AdminReportStats,
  UpsertServicePlanRequest,
  SyncPaystackPlanResult,
  LeadPipelineStage,
  LeadStatus,
  UpdateLeadContactPayload,
} from '../models/admin.models';
import { CleaningReport } from '../models/client.models';
import {
  MOCK_ADMIN,
  MOCK_ADMIN_BARK_REQUESTS,
  MOCK_ADMIN_CUSTOMERS,
  MOCK_ADMIN_FUNNEL,
  MOCK_ADMIN_HOTSPOTS,
  MOCK_ADMIN_INBOX_STATS,
  MOCK_ADMIN_INVITES,
  MOCK_ADMIN_LEADS,
  MOCK_ADMIN_STAFF,
  MOCK_ADMIN_UPCOMING_JOBS,
  MOCK_SCHEDULE_SLOTS,
  MOCK_SUBSCRIPTION_PLANS,
  MOCK_SUBSCRIPTION_ROWS,
  MOCK_SUBSCRIPTION_STATS,
  cloneLead,
} from '../data/admin-mock-data';
import { MOCK_BOOKINGS, MOCK_REPORTS } from '../data/mock-data';
import { APP_CONFIG } from '../config/app-config';
import { ApiClientService } from '../http/api-client.service';
import {
  AdminBookingDtoApi,
  AdminDashboardDtoApi,
  AdminInviteDtoApi,
  AdminLeadDtoApi,
  mapAdminBooking,
  mapAdminCustomer,
  mapAdminCustomerDetail,
  mapAdminDashboard,
  mapAdminInvite,
  mapAdminLead,
  mapAdminPortalSettings,
  mapAdminReportDetail,
  mapAdminReportListItem,
  mapAdminReportStats,
  AdminPortalSettingsDtoApi,
  mapAdminScheduleSlot,
  mapAdminStaff,
  mapAdminSubscriptionPlan,
  mapAdminSubscriptionRow,
} from '../mappers/admin-api.mapper';
import { mapStaffJob, mapStaffJobSummary, StaffJobDtoApi } from '../mappers/staff-api.mapper';
import { StaffService } from '../services/staff.service';

const BOOKING_CUSTOMERS: Record<string, string> = {
  'booking-001': 'Nicolette Botha',
  'booking-002': 'Nicolette Botha',
  'booking-003': 'David Khumalo',
  'booking-004': 'Linda Pretorius',
};

@Injectable({ providedIn: 'root' })
export class AdminService {
  private leads = MOCK_ADMIN_LEADS.map((l) => cloneLead(l));
  private invites = MOCK_ADMIN_INVITES.map((i) => ({
    ...i,
    plans: i.plans.map((p) => ({ ...p, features: [...p.features] })),
    property: { ...i.property },
    quote: { ...i.quote },
  }));
  private servicePlans: AdminSubscriptionPlan[] = MOCK_SUBSCRIPTION_PLANS.map((p) => ({
    ...p,
    features: [...p.features],
    active: true,
    paystackInterval: 'quarterly',
    paystackLinked: false,
  }));
  private bookings: AdminBooking[] = MOCK_BOOKINGS.map((b) => ({
    id: b.id,
    bookingRef: b.bookingRef ?? b.id,
    customerName: BOOKING_CUSTOMERS[b.id] ?? 'Customer',
    propertyAddress: b.propertyAddress,
    date: b.date,
    timeSlot: b.timeSlot,
    status: b.status,
    staffName: b.staffName,
    staffId: b.staffName?.includes('James') ? 'staff-001' : undefined,
    planName: b.planName,
    panelCount: b.panelCount,
  }));

  private readonly useApi = !APP_CONFIG.mockMode;
  private readonly http = inject(HttpClient);

  constructor(
    private readonly api: ApiClientService,
    private readonly staffService: StaffService,
  ) {}

  getDashboard(): Observable<AdminDashboard> {
    if (this.useApi) {
      return this.api.get<AdminDashboardDtoApi>('/admin/dashboard').pipe(map(mapAdminDashboard));
    }

    return this.staffService.getTodayJobs().pipe(
      map((jobs) => ({
      adminName: MOCK_ADMIN.firstName,
      stats: {
        newLeadsToday: MOCK_ADMIN_INBOX_STATS.newLeadsToday,
        newLeadsTrend: MOCK_ADMIN_INBOX_STATS.newLeadsTrend,
        quotesSent: MOCK_ADMIN_INBOX_STATS.quotesSent,
        quotesTrend: MOCK_ADMIN_INBOX_STATS.quotesTrend,
        jobsScheduled: MOCK_ADMIN_INBOX_STATS.jobsBooked,
        jobsTrend: MOCK_ADMIN_INBOX_STATS.jobsBookedTrend,
        activeSubscriptions: MOCK_SUBSCRIPTION_STATS.activePlans,
        subscriptionsTrend: MOCK_SUBSCRIPTION_STATS.activePlansTrend,
        revenueMtd: 236450,
        revenueTrend: '+18% vs last month',
      },
      funnel: MOCK_ADMIN_FUNNEL,
      conversionRate: 7.0,
      avgTimeToWin: 12.6,
      hotspots: MOCK_ADMIN_HOTSPOTS,
      upcomingJobs: MOCK_ADMIN_UPCOMING_JOBS,
      barkRequests: MOCK_ADMIN_BARK_REQUESTS,
      aiSummary: [
        '5 urgent leads need immediate follow-up.',
        '6 jobs scheduled today. Suggested route can save 1h 20m.',
        "You're on track! 78% of monthly revenue target achieved.",
      ],
      revenuePaid: 182300,
      revenuePending: 54150,
      avgDealSize: 28831,
      openLeads: this.leads.filter((l) => l.status !== 'converted' && l.status !== 'lost').length,
      todayJobs: jobs,
      revenueTrendPoints: [
        { label: 'Jan', amount: 180000 },
        { label: 'Feb', amount: 195000 },
        { label: 'Mar', amount: 210000 },
        { label: 'Apr', amount: 225000 },
        { label: 'May', amount: 236450 },
        { label: 'Jun', amount: 236450 },
      ],
      })),
      delay(300),
    );
  }

  getInboxStats(): Observable<AdminInboxStats> {
    if (this.useApi) {
      return this.api.get<AdminInboxStats>('/admin/inbox-stats');
    }
    return of({ ...MOCK_ADMIN_INBOX_STATS }).pipe(delay(200));
  }

  search(query: string): Observable<AdminSearchResult> {
    const q = query.trim();
    if (!q) {
      return of({ query: '', hits: [] });
    }
    if (this.useApi) {
      return this.api.get<AdminSearchResult>(`/admin/search?q=${encodeURIComponent(q)}`);
    }
    const term = q.toLowerCase();
    const leadHits = this.leads
      .filter((l) =>
        [l.customerName, l.customerEmail, l.customerPhone, l.city, l.propertyAddress, l.postcode, l.requestSnippet]
          .some((v) => v?.toLowerCase().includes(term)),
      )
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        type: 'lead' as const,
        title: l.customerName,
        subtitle: `${l.city} · ${l.status}`,
      }));
    const customerHits = MOCK_ADMIN_CUSTOMERS.filter((c) =>
      [c.name, c.email, c.phone, c.primaryAddress].some((v) => v.toLowerCase().includes(term)),
    )
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        type: 'customer' as const,
        title: c.name,
        subtitle: `${c.email} · ${c.primaryAddress}`,
      }));
    return of({ query: q, hits: [...leadHits, ...customerHits].slice(0, 10) }).pipe(delay(200));
  }

  syncBarkLead(): Observable<AdminLead> {
    if (this.useApi) {
      return this.api.post<AdminLeadDtoApi>('/admin/leads/sync-bark', {}).pipe(map(mapAdminLead));
    }
    const templates = [
      {
        customerName: 'Thandiwe Dlamini',
        city: 'Fourways',
        postcode: '2055',
        requestSnippet: 'Need solar panel cleaning before winter.',
        urgency: 'urgent' as const,
        panelCount: 20,
      },
      {
        customerName: 'Marcus van der Merwe',
        city: 'Randburg',
        postcode: '2194',
        requestSnippet: 'Panels dusty after construction next door.',
        urgency: 'normal' as const,
        panelCount: 16,
      },
    ];
    const t = templates[this.leads.length % templates.length];
    return this.createLead({
      ...t,
      customerEmail: `${t.customerName.split(' ')[0].toLowerCase()}@email.com`,
      customerPhone: '082 555 0101',
      propertyAddress: t.city,
      source: 'bark_email',
    });
  }

  getLeads(filters: AdminLeadFilters = {}): Observable<AdminLead[]> {
    if (this.useApi) {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.urgency) params.set('urgency', filters.urgency);
      const query = params.toString();
      const path = query ? `/admin/leads?${query}` : '/admin/leads';
      return this.api.get<AdminLeadDtoApi[]>(path).pipe(map((leads) => leads.map(mapAdminLead)));
    }
    let result = this.leads.map((l) => cloneLead(l));
    if (filters.status) result = result.filter((l) => l.status === filters.status);
    if (filters.urgency) result = result.filter((l) => l.urgency === filters.urgency);
    return of(result).pipe(delay(300));
  }

  getLead(id: string): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api.get<AdminLeadDtoApi | null>(`/admin/leads/${id}`).pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    return of(lead ? cloneLead(lead) : null).pipe(delay(200));
  }

  createLead(request: CreateLeadRequest): Observable<AdminLead> {
    const payload = {
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      propertyAddress: request.propertyAddress,
      city: request.city,
      postcode: request.postcode ?? '',
      requestSnippet: request.requestSnippet,
      notes: request.notes,
      source: request.source ?? 'other',
      urgency: request.urgency ?? 'normal',
      panelCount: request.panelCount ?? 16,
      roofType: request.roofType ?? 'Tile',
      province: request.province ?? 'Gauteng',
      serviceType: request.serviceType ?? 'Solar Panel Cleaning',
    };

    if (this.useApi) {
      return this.api.post<AdminLeadDtoApi>('/admin/leads', payload).pipe(map(mapAdminLead));
    }

    const now = new Date().toISOString();
    const panelCount = payload.panelCount;
    const lead: AdminLead = {
      id: `lead-${Date.now()}`,
      source: payload.source as AdminLead['source'],
      status: 'new',
      pipelineStage: 'new',
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      propertyAddress: payload.propertyAddress,
      city: payload.city,
      postcode: payload.postcode,
      province: payload.province,
      panelCount,
      estimatedPanelsRange: `${panelCount}–${panelCount + 4}`,
      roofType: payload.roofType,
      notes: payload.notes ?? payload.requestSnippet,
      requestSnippet: payload.requestSnippet,
      createdAt: now,
      urgency: payload.urgency as AdminLead['urgency'],
      leadScore: payload.urgency === 'urgent' ? 82 : 72,
      serviceType: payload.serviceType,
      tags: [{ label: 'Residential', tone: 'teal' }],
      activities: [
        {
          id: `act-${Date.now()}`,
          type: 'created',
          title: 'New lead created',
          description: payload.source,
          timestamp: now,
        },
      ],
      checklist: [],
      nearbyLeads: [],
    };
    this.leads.unshift(lead);
    return of(cloneLead(lead)).pipe(delay(300));
  }

  updateLeadStatus(id: string, status: LeadStatus): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api
        .patch<AdminLeadDtoApi | null>(`/admin/leads/${id}/status`, { status })
        .pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return of(null).pipe(delay(200));
    lead.status = status;
    return of(cloneLead(lead)).pipe(delay(200));
  }

  updateLeadContact(id: string, payload: UpdateLeadContactPayload): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api
        .patch<AdminLeadDtoApi | null>(`/admin/leads/${id}`, payload)
        .pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return of(null).pipe(delay(200));
    lead.customerName = payload.customerName;
    lead.customerEmail = payload.customerEmail;
    lead.customerPhone = payload.customerPhone;
    lead.propertyAddress = payload.propertyAddress;
    lead.city = payload.city;
    lead.bestTimeToContact = payload.bestTimeToContact;
    lead.preferredContact = payload.preferredContact;
    return of(cloneLead(lead)).pipe(delay(200));
  }

  addLeadTag(
    id: string,
    label: string,
    tone: AdminLead['tags'][0]['tone'] = 'teal',
  ): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api
        .post<AdminLeadDtoApi | null>(`/admin/leads/${id}/tags`, { label, tone })
        .pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return of(null).pipe(delay(200));
    if (!lead.tags.some((t) => t.label.toLowerCase() === label.trim().toLowerCase())) {
      lead.tags.push({ label: label.trim(), tone });
    }
    return of(cloneLead(lead)).pipe(delay(200));
  }

  addLeadNote(id: string, note: string): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api
        .post<AdminLeadDtoApi | null>(`/admin/leads/${id}/notes`, { note })
        .pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return of(null).pipe(delay(200));
    const stamp = new Date().toLocaleString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const entry = `[${stamp}] ${note.trim()}`;
    lead.conversationNotes = lead.conversationNotes ? `${lead.conversationNotes}\n\n${entry}` : entry;
    return of(cloneLead(lead)).pipe(delay(200));
  }

  updatePipelineStage(id: string, stage: LeadPipelineStage): Observable<AdminLead | null> {
    if (this.useApi) {
      return this.api
        .patch<AdminLeadDtoApi | null>(`/admin/leads/${id}/pipeline`, { pipelineStage: stage })
        .pipe(map((l) => (l ? mapAdminLead(l) : null)));
    }
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) return of(null).pipe(delay(200));
    lead.pipelineStage = stage;
    return of(cloneLead(lead)).pipe(delay(200));
  }

  sendInvite(leadId: string, expiryDays = 14): Observable<{ lead: AdminLead; invite: AdminInvite }> {
    if (this.useApi) {
      return this.api
        .post<{ lead: AdminLeadDtoApi; invite: AdminInviteDtoApi }>(`/admin/leads/${leadId}/invite`, {
          expiryDays,
        })
        .pipe(
          map((r) => ({
            lead: mapAdminLead(r.lead),
            invite: mapAdminInvite(r.invite),
          })),
        );
    }
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) return of({ lead: null as unknown as AdminLead, invite: null as unknown as AdminInvite });
    if (!lead.inviteCode) {
      lead.inviteCode = 'MOCK01';
      lead.inviteLink = `/invite/MOCK01`;
    }
    lead.pipelineStage = 'invite_sent';
    return of({
      lead: cloneLead(lead),
      invite: this.invites[0],
    }).pipe(delay(300));
  }

  getInvites(): Observable<AdminInvite[]> {
    if (this.useApi) {
      return this.api.get<AdminInviteDtoApi[]>('/admin/invites').pipe(map((invites) => invites.map(mapAdminInvite)));
    }
    return of(
      this.invites.map((i) => ({
        ...i,
        plans: i.plans.map((p) => ({ ...p, features: [...p.features] })),
      })),
    ).pipe(delay(300));
  }

  getCustomers(): Observable<AdminCustomer[]> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminCustomer>[0][]>('/admin/customers')
        .pipe(map((rows) => rows.map(mapAdminCustomer)));
    }
    return of(MOCK_ADMIN_CUSTOMERS.map((c) => ({ ...c }))).pipe(delay(300));
  }

  getCustomer(id: string): Observable<AdminCustomerDetail> {
    return this.api
      .get<Parameters<typeof mapAdminCustomerDetail>[0]>(`/admin/customers/${encodeURIComponent(id)}`)
      .pipe(map(mapAdminCustomerDetail));
  }

  getBookings(): Observable<AdminBooking[]> {
    if (this.useApi) {
      return this.api.get<AdminBookingDtoApi[]>('/admin/bookings').pipe(map((rows) => rows.map(mapAdminBooking)));
    }
    return of(this.bookings.map((b) => ({ ...b }))).pipe(delay(300));
  }

  assignStaff(bookingId: string, staffId: string, staffName: string): Observable<AdminBooking | null> {
    if (this.useApi) {
      return this.api
        .patch<AdminBookingDtoApi | null>(`/admin/bookings/${bookingId}/assign`, { staffId, staffName })
        .pipe(map((b) => (b ? mapAdminBooking(b) : null)));
    }
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return of(null).pipe(delay(200));
    booking.staffId = staffId;
    booking.staffName = staffName;
    return of({ ...booking }).pipe(delay(300));
  }

  updateBookingStatus(
    bookingId: string,
    status: AdminBooking['status'],
  ): Observable<AdminBooking | null> {
    if (this.useApi) {
      return this.api
        .patch<AdminBookingDtoApi | null>(`/admin/bookings/${bookingId}/status`, { status })
        .pipe(map((b) => (b ? mapAdminBooking(b) : null)));
    }
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return of(null).pipe(delay(200));
    booking.status = status;
    return of({ ...booking }).pipe(delay(300));
  }

  updateJobStatus(
    jobId: string,
    operationalStatus: import('../models/staff.models').StaffOperationalStatus,
  ): Observable<import('../models/staff.models').StaffJobSummary | null> {
    if (this.useApi) {
      return this.api
        .patch<StaffJobDtoApi | null>(`/admin/jobs/${jobId}/status`, { operationalStatus })
        .pipe(map((j) => (j ? mapStaffJobSummary(mapStaffJob(j)) : null)));
    }
    return this.staffService.applyAdminOperationalStatus(jobId, operationalStatus);
  }

  getStaff(): Observable<AdminStaffMember[]> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminStaff>[0][]>('/admin/staff')
        .pipe(map((rows) => rows.map(mapAdminStaff)));
    }
    return of(MOCK_ADMIN_STAFF.map((s) => ({ ...s }))).pipe(delay(300));
  }

  createStaff(request: import('../models/admin.models').UpsertStaffRequest): Observable<AdminStaffMember> {
    if (this.useApi) {
      return this.api
        .post<Parameters<typeof mapAdminStaff>[0]>('/admin/staff', request)
        .pipe(map(mapAdminStaff));
    }
    const member: AdminStaffMember = {
      id: `staff-${Date.now()}`,
      fullName: `${request.firstName} ${request.lastName}`.trim(),
      phone: request.phone ?? '',
      role: request.role === 'admin' ? 'Administrator' : 'Field Technician',
      status: 'off_duty',
      jobsToday: 0,
      completedToday: 0,
      email: request.email.trim().toLowerCase(),
      accountRole: request.role,
    };
    return of(member).pipe(delay(300));
  }

  updateStaff(
    id: string,
    request: import('../models/admin.models').UpsertStaffRequest,
  ): Observable<AdminStaffMember> {
    if (this.useApi) {
      return this.api
        .patch<Parameters<typeof mapAdminStaff>[0]>(`/admin/staff/${id}`, request)
        .pipe(map(mapAdminStaff));
    }
    const member: AdminStaffMember = {
      id,
      fullName: `${request.firstName} ${request.lastName}`.trim(),
      phone: request.phone ?? '',
      role: request.role === 'admin' ? 'Administrator' : 'Field Technician',
      status: 'off_duty',
      jobsToday: 0,
      completedToday: 0,
      email: request.email.trim().toLowerCase(),
      accountRole: request.role,
    };
    return of(member).pipe(delay(300));
  }

  deleteStaff(id: string): Observable<void> {
    if (this.useApi) {
      return this.api.delete<void>(`/admin/staff/${id}`);
    }
    return of(void 0).pipe(delay(300));
  }

  getJobs(): Observable<import('../models/staff.models').StaffJobSummary[]> {
    if (this.useApi) {
      return this.api
        .get<StaffJobDtoApi[]>('/admin/jobs')
        .pipe(map((jobs) => jobs.map((j) => mapStaffJobSummary(mapStaffJob(j)))));
    }
    return this.staffService.getTodayJobs();
  }

  getIssues(): Observable<import('../models/staff.models').StaffJob[]> {
    if (this.useApi) {
      return this.api
        .get<StaffJobDtoApi[]>('/admin/issues')
        .pipe(map((jobs) => jobs.map((j) => mapStaffJob(j))));
    }
    return this.staffService.getJobsWithIssues();
  }

  getReportStats(): Observable<AdminReportStats> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminReportStats>[0]>('/admin/reports/stats')
        .pipe(map(mapAdminReportStats));
    }
    const reports = MOCK_REPORTS;
    const withGain = reports.filter((r) => r.kwhGain != null);
    return of({
      totalReports: reports.length,
      reportsThisMonth: reports.length,
      averageKwhGain: withGain.length
        ? withGain.reduce((s, r) => s + (r.kwhGain ?? 0), 0) / withGain.length
        : null,
      reportsWithPerformanceData: withGain.length,
    }).pipe(delay(200));
  }

  getAdminReports(search?: string): Observable<AdminReportListItem[]> {
    if (this.useApi) {
      const q = search?.trim();
      const path = q ? `/admin/reports?search=${encodeURIComponent(q)}` : '/admin/reports';
      return this.api
        .get<Parameters<typeof mapAdminReportListItem>[0][]>(path)
        .pipe(map((rows) => rows.map(mapAdminReportListItem)));
    }
    let items = MOCK_REPORTS.map((r) => this.mockReportListItem(r));
    const q = search?.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.propertyAddress.toLowerCase().includes(q) ||
          r.staffName.toLowerCase().includes(q),
      );
    }
    return of(items).pipe(delay(300));
  }

  getAdminReport(id: string): Observable<AdminReportDetail | null> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminReportDetail>[0] | null>(`/admin/reports/${id}`)
        .pipe(map((dto) => (dto ? mapAdminReportDetail(dto) : null)));
    }
    const report = MOCK_REPORTS.find((r) => r.id === id);
    return of(report ? this.mockReportDetail(report) : null).pipe(delay(200));
  }

  downloadReportsExport(): Observable<Blob> {
    return this.http.get(`${this.api.baseUrl}/admin/reports/export`, {
      responseType: 'blob',
    });
  }

  private mockReportListItem(r: CleaningReport): AdminReportListItem {
    const parts = r.propertyAddress.split(',').map((p) => p.trim());
    const line = parts[0] ?? r.propertyAddress;
    const city = parts.length > 1 ? parts[1] : null;
    const before = r.beforeKwhReading ?? null;
    const gain = r.kwhGain ?? null;
    const gainPercent = before && gain ? Math.round((gain / before) * 10000) / 100 : null;
    const gainPerPanel =
      gain && r.panelCount > 0 ? Math.round((gain / r.panelCount) * 100) / 100 : null;
    return {
      id: r.id,
      completedAt: r.completedAt,
      customerName: 'Nicolette Botha',
      customerId: 'cust-001',
      propertyAddress: line,
      city,
      panelCount: r.panelCount,
      systemSizeKw: r.systemSizeKw ?? null,
      staffName: r.staffName ?? '—',
      performance: {
        beforeKwh: before,
        afterKwh: r.afterKwhReading ?? null,
        kwhGain: gain,
        gainPercent,
        gainPerPanel,
      },
      photoCount: r.beforePhotos.length + r.afterPhotos.length,
      hasStaffNotes: !!r.staffNotes?.trim(),
      status: r.status ?? 'completed',
      thumbnailUrl: r.beforePhotos[0] ?? r.propertyImageUrl ?? null,
    };
  }

  private mockReportDetail(r: CleaningReport): AdminReportDetail {
    const parts = r.propertyAddress.split(',').map((p) => p.trim());
    const line = parts[0] ?? r.propertyAddress;
    const city = parts.length > 1 ? parts[1] : null;
    const postcode = parts.length > 2 ? parts[2] : null;
    const item = this.mockReportListItem(r);
    const checklist = [...r.checklistSummary];
    const narrative =
      `Solar panel cleaning report for ${r.propertyAddress}. ` +
      `Customer: Nicolette Botha. Service completed on ${r.completedAt} by ${r.staffName}. ` +
      `System: ${r.panelCount} panels. Checklist: ${checklist.join('; ')}. Notes: ${r.staffNotes}`;
    return {
      documentType: 'solar_cleaning_report',
      entities: {
        reportId: r.id,
        customerId: 'cust-001',
        customerName: 'Nicolette Botha',
        customerEmail: 'nicolette.botha@email.com',
        propertyId: r.propertyId ?? null,
        bookingId: r.bookingId ?? null,
        staffName: r.staffName ?? null,
      },
      property: {
        addressLine: line,
        city,
        postcode,
        fullAddress: r.propertyAddress,
        panelCount: r.panelCount,
        systemSizeKw: r.systemSizeKw ?? null,
        roofType: r.roofType ?? null,
        accessNotes: r.accessNotes ?? null,
      },
      service: {
        completedAt: r.completedAt,
        serviceType: r.serviceType,
        planName: r.planName ?? null,
        status: r.status ?? 'completed',
        checklistCompleted: checklist,
        staffNotes: r.staffNotes,
      },
      performance: item.performance,
      media: {
        beforePhotos: [...r.beforePhotos],
        afterPhotos: [...r.afterPhotos],
        propertyImageUrl: r.propertyImageUrl ?? null,
        beforePhotoCount: r.beforePhotos.length,
        afterPhotoCount: r.afterPhotos.length,
      },
      narrativeText: narrative,
    };
  }

  getSubscriptionStats(): Observable<AdminSubscriptionStats> {
    if (this.useApi) {
      return this.api.get<AdminSubscriptionStats>('/admin/subscriptions/stats');
    }
    return of({ ...MOCK_SUBSCRIPTION_STATS }).pipe(delay(200));
  }

  getSubscriptions(): Observable<AdminSubscriptionRow[]> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminSubscriptionRow>[0][]>('/admin/subscriptions')
        .pipe(map((rows) => rows.map(mapAdminSubscriptionRow)));
    }
    return of(MOCK_SUBSCRIPTION_ROWS.map((r) => ({ ...r }))).pipe(delay(300));
  }

  getSubscriptionPlans(): Observable<AdminSubscriptionPlan[]> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminSubscriptionPlan>[0][]>('/admin/subscriptions/plans')
        .pipe(map((rows) => rows.map(mapAdminSubscriptionPlan)));
    }
    return of(this.servicePlans.filter((p) => p.active !== false).map((p) => ({ ...p, features: [...p.features] }))).pipe(
      delay(200),
    );
  }

  createServicePlan(request: UpsertServicePlanRequest): Observable<AdminSubscriptionPlan> {
    if (this.useApi) {
      return this.api
        .post<Parameters<typeof mapAdminSubscriptionPlan>[0]>('/admin/subscriptions/plans', request)
        .pipe(map(mapAdminSubscriptionPlan));
    }
    const id = `plan-${request.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
    const plan: AdminSubscriptionPlan = {
      id,
      name: request.name,
      price: request.pricePerVisit,
      interval: request.visitsPerYear === 1 ? 'per visit' : request.visitsPerYear === 4 ? 'per visit (quarterly)' : 'per visit',
      features: [...request.features],
      popular: request.popular,
      description: request.description,
      visitsPerYear: request.visitsPerYear,
      annualPrice: request.pricePerVisit * request.visitsPerYear,
      active: request.active,
      paystackPlanCode: request.paystackPlanCode ?? null,
      paystackInterval: request.paystackInterval,
      paystackLinked: !!request.paystackPlanCode,
    };
    this.servicePlans.push(plan);
    return of({ ...plan, features: [...plan.features] }).pipe(delay(200));
  }

  updateServicePlan(id: string, request: UpsertServicePlanRequest): Observable<AdminSubscriptionPlan> {
    if (this.useApi) {
      return this.api
        .patch<Parameters<typeof mapAdminSubscriptionPlan>[0]>(`/admin/subscriptions/plans/${id}`, request)
        .pipe(map(mapAdminSubscriptionPlan));
    }
    const index = this.servicePlans.findIndex((p) => p.id === id);
    if (index < 0) throw new Error('plan_not_found');
    const updated: AdminSubscriptionPlan = {
      id,
      name: request.name,
      price: request.pricePerVisit,
      interval: request.visitsPerYear === 1 ? 'per visit' : request.visitsPerYear === 4 ? 'per visit (quarterly)' : 'per visit',
      features: [...request.features],
      popular: request.popular,
      description: request.description,
      visitsPerYear: request.visitsPerYear,
      annualPrice: request.pricePerVisit * request.visitsPerYear,
      active: request.active,
      paystackPlanCode: request.paystackPlanCode ?? null,
      paystackInterval: request.paystackInterval,
      paystackLinked: !!request.paystackPlanCode,
    };
    this.servicePlans[index] = updated;
    return of({ ...updated, features: [...updated.features] }).pipe(delay(200));
  }

  deactivateServicePlan(id: string): Observable<void> {
    if (this.useApi) {
      return this.api.delete<void>(`/admin/subscriptions/plans/${id}`);
    }
    const plan = this.servicePlans.find((p) => p.id === id);
    if (plan) plan.active = false;
    return of(undefined).pipe(delay(200));
  }

  syncServicePlanPaystack(id: string): Observable<SyncPaystackPlanResult> {
    if (this.useApi) {
      return this.api
        .post<{ plan: Parameters<typeof mapAdminSubscriptionPlan>[0]; message?: string | null }>(
          `/admin/subscriptions/plans/${id}/paystack-sync`,
          {},
        )
        .pipe(
          map((result) => ({
            plan: mapAdminSubscriptionPlan(result.plan),
            message: result.message,
          })),
        );
    }
    const plan = this.servicePlans.find((p) => p.id === id);
    if (!plan) throw new Error('plan_not_found');
    return of({
      plan: { ...plan, features: [...plan.features] },
      message: 'Paystack sync requires MongoDB and configured API keys.',
    }).pipe(delay(200));
  }

  getPortalSettings(): Observable<AdminPortalSettings> {
    if (this.useApi) {
      return this.api
        .get<AdminPortalSettingsDtoApi>('/admin/settings')
        .pipe(map(mapAdminPortalSettings));
    }
    return of<AdminPortalSettings>({
      environment: 'Development',
      databaseName: 'solanist',
      appBaseUrl: 'http://localhost:8080',
      passwordResetDemoLinks: true,
      mongoConnected: false,
      integrations: [
        { key: 'mongo', label: 'MongoDB', status: 'demo', detail: 'Mock mode — in-memory admin data' },
        { key: 'bark', label: 'Bark webhooks', status: 'demo', detail: 'Demo secret configured' },
        { key: 'paystack', label: 'Paystack billing', status: 'not_configured', detail: 'Keys not set' },
        { key: 's3', label: 'Staff photo uploads', status: 'demo', detail: 'Mock uploads only' },
        { key: 'email', label: 'Email (Postmark)', status: 'not_configured', detail: 'Set Email__PostmarkServerToken and Email__FromAddress' },
        { key: 'whatsapp', label: 'WhatsApp (WasenderAPI)', status: 'not_configured', detail: 'Set WhatsApp__ApiKey for live invite delivery' },
      ],
      counts: { leads: this.leads.length, customers: 48, staffMembers: 3, activeSubscriptions: 142 },
    }).pipe(delay(200));
  }

  getScheduleSlots(): Observable<AdminScheduleSlot[]> {
    if (this.useApi) {
      return this.api
        .get<Parameters<typeof mapAdminScheduleSlot>[0][]>('/admin/schedule')
        .pipe(map((rows) => rows.map(mapAdminScheduleSlot)));
    }
    return of(
      MOCK_SCHEDULE_SLOTS.map((s) => ({
        area: s.area,
        slots: s.slots.map((slot) => ({ ...slot })),
      })),
    ).pipe(delay(200));
  }
}
