import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, delay, map, of, throwError } from 'rxjs';
import {
  Booking,
  CleaningReport,
  ClientDashboard,
  ClientProfile,
  UpdateClientProfileRequest,
  ChangePasswordRequest,
  ChangePasswordResult,
  CreatePropertyRequest,
  CreateBookingRequest,
  Payment,
  PropertySummary,
  PropertyPlanDetails,
  RescheduleBookingRequest,
  Subscription,
  SubscriptionPortfolio,
  BillingMode,
} from '../models/client.models';
import {
  MOCK_BOOKINGS,
  MOCK_CUSTOMER,
  MOCK_DASHBOARD,
  MOCK_PAYMENTS,
  MOCK_PROPERTIES,
  MOCK_REPORTS,
  MOCK_SUBSCRIPTION,
  enrichCleaningReport,
  MOCK_SUBSCRIPTION_PORTFOLIO,
  buildPropertyPlanDetails,
} from '../data/mock-data';
import { APP_CONFIG, clampPanelCount } from '../config/app-config';
import { ApiClientService } from '../http/api-client.service';
import { PropertyPlanDetailsApi, mapPropertyPlanDetails } from '../mappers/client-plan.mapper';
import { enrichReportFromApi } from '../util/report-enrich';

const REPORT_KEY = 'solanist_report_available';
const PROPERTIES_KEY = 'solanist_properties_v2';
const MOCK_PROPERTY_BY_ID = new Map(MOCK_PROPERTIES.map((p) => [p.id, p]));
const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly api = inject(ApiClientService);
  private readonly useApi = !APP_CONFIG.mockMode;

  private reportAvailable = this.loadReportFlag();
  private properties = this.loadProperties();
  private bookings = MOCK_BOOKINGS.map((b) => ({ ...b }));
  private billingMode: BillingMode = MOCK_SUBSCRIPTION_PORTFOLIO.billingMode;

  getDashboard(): Observable<ClientDashboard> {
    if (this.useApi) return this.api.get<ClientDashboard>('/client/dashboard');
    return of(structuredClone(MOCK_DASHBOARD)).pipe(delay(300));
  }

  getBookings(): Observable<Booking[]> {
    if (this.useApi) return this.api.get<Booking[]>('/client/bookings');
    return of(this.bookings.map((b) => ({ ...b }))).pipe(delay(300));
  }

  getBooking(id: string): Observable<Booking | null> {
    if (this.useApi) return this.api.get<Booking | null>(`/client/bookings/${id}`);
    const booking = this.bookings.find((b) => b.id === id) ?? null;
    return of(booking ? { ...booking } : null).pipe(delay(200));
  }

  rescheduleBooking(request: RescheduleBookingRequest): Observable<Booking> {
    if (this.useApi) {
      return this.api.patch<Booking>('/client/bookings/reschedule', request);
    }
    const index = this.bookings.findIndex((b) => b.id === request.bookingId);
    if (index === -1) {
      return throwError(() => new Error('Booking not found.'));
    }
    const updated: Booking = {
      ...this.bookings[index],
      date: request.date,
      timeSlot: request.timeSlot,
      confirmationStatus: 'scheduled',
    };
    this.bookings = this.bookings.map((b, i) => (i === index ? updated : b));
    return of({ ...updated }).pipe(delay(400));
  }

  getUpcomingBookingForProperty(propertyId: string): Observable<Booking | null> {
    if (this.useApi) {
      return this.api.get<Booking | null>(`/client/properties/${propertyId}/bookings/upcoming`);
    }
    const property = this.properties.find((p) => p.id === propertyId);
    if (!property) return of(null).pipe(delay(100));
    const booking =
      this.bookings.find(
        (b) => b.status === 'upcoming' && b.propertyAddress.startsWith(property.address),
      ) ?? null;
    return of(booking ? { ...booking } : null).pipe(delay(100));
  }

  submitBookingRequest(request: CreateBookingRequest): Observable<Booking> {
    if (this.useApi) return this.api.post<Booking>('/client/bookings', request);
    const property = this.properties.find((p) => p.id === request.propertyId);
    if (!property) {
      return throwError(() => new Error('Property not found.'));
    }
    const booking: Booking = {
      id: `booking-${crypto.randomUUID().slice(0, 8)}`,
      propertyId: property.id,
      date: request.date,
      timeSlot: request.timeSlot,
      status: 'upcoming',
      serviceType: 'Solar Panel Cleaning',
      propertyAddress: `${property.address}, ${property.city}`,
      propertyPostcode: property.postcode,
      planName: property.planName,
      panelCount: property.panelCount,
      systemSizeKw: property.systemSizeKw,
      roofType: property.roofType,
      accessNotes: property.accessNotes,
      specialInstructions: request.specialInstructions,
      confirmationStatus: 'scheduled',
      billingNote: request.cleaningType === 'subscription' ? 'subscription' : 'once_off',
    };
    this.bookings = [booking, ...this.bookings];
    return of({ ...booking }).pipe(delay(400));
  }

  getReports(): Observable<CleaningReport[]> {
    if (this.useApi) return this.api.get<CleaningReport[]>('/client/reports');
    return of([...MOCK_REPORTS]).pipe(delay(300));
  }

  getReport(id: string): Observable<CleaningReport | null> {
    if (this.useApi) {
      return forkJoin({
        report: this.api.get<CleaningReport | null>(`/client/reports/${id}`),
        properties: this.getProperties(),
        bookings: this.getBookings(),
      }).pipe(
        map(({ report, properties, bookings }) =>
          report ? enrichReportFromApi(report, properties, bookings) : null,
        ),
      );
    }
    const report = MOCK_REPORTS.find((r) => r.id === id) ?? null;
    if (!report) return of(null).pipe(delay(300));
    return of(enrichCleaningReport(report, this.properties, this.bookings)).pipe(delay(300));
  }

  getSubscription(): Observable<Subscription> {
    if (this.useApi) return this.api.get<Subscription>('/client/subscription');
    return of({ ...MOCK_SUBSCRIPTION }).pipe(delay(300));
  }

  getSubscriptionPortfolio(): Observable<{
    properties: PropertySummary[];
    portfolio: SubscriptionPortfolio;
    payments: Payment[];
  }> {
    if (this.useApi) {
      return this.api.get<{
        properties: PropertySummary[];
        portfolio: SubscriptionPortfolio;
        payments: Payment[];
      }>('/client/subscription/portfolio');
    }
    const activeProperties = this.properties.filter((p) => p.subscriptionStatus === 'active');
    const invoicePreview = activeProperties.map((p) => ({
      propertyId: p.id,
      propertyName: p.address,
      planName: p.planName ?? 'Solar Care Plan',
      amount: p.pricePerClean ?? 0,
    }));
    const portfolio: SubscriptionPortfolio = {
      billingMode: this.billingMode,
      paymentMethod: MOCK_SUBSCRIPTION_PORTFOLIO.paymentMethod,
      nextBillingDate: MOCK_SUBSCRIPTION_PORTFOLIO.nextBillingDate,
      upcomingBillingTotal: invoicePreview.reduce((sum, item) => sum + item.amount, 0),
      invoicePreview,
    };
    return of({
      properties: this.properties.map((p) => ({ ...p })),
      portfolio,
      payments: [...MOCK_PAYMENTS],
    }).pipe(delay(300));
  }

  setBillingMode(mode: BillingMode): Observable<BillingMode> {
    if (this.useApi) {
      return this.api.patch<string>('/client/subscription/billing-mode', { billingMode: mode }).pipe(
        map(() => mode),
      );
    }
    this.billingMode = mode;
    return of(mode).pipe(delay(100));
  }

  getUpcomingBookingForPropertyId(propertyId: string): Observable<Booking | null> {
    return this.getUpcomingBookingForProperty(propertyId);
  }

  getPayments(): Observable<Payment[]> {
    if (this.useApi) return this.api.get<Payment[]>('/client/payments');
    return of([...MOCK_PAYMENTS]).pipe(delay(300));
  }

  getProperties(): Observable<PropertySummary[]> {
    if (this.useApi) return this.api.get<PropertySummary[]>('/client/properties');
    return of(this.properties.map((p) => ({ ...p }))).pipe(delay(300));
  }

  getPropertyPlan(propertyId: string): Observable<PropertyPlanDetails | null> {
    if (this.useApi) {
      return this.api
        .get<PropertyPlanDetailsApi | null>(`/client/properties/${propertyId}/plan`)
        .pipe(map((dto) => (dto ? mapPropertyPlanDetails(dto) : null)));
    }
    const property = this.properties.find((p) => p.id === propertyId);
    if (!property) return of(null).pipe(delay(300));
    return of(buildPropertyPlanDetails({ ...property })).pipe(delay(300));
  }

  addProperty(request: CreatePropertyRequest): Observable<PropertySummary> {
    if (this.useApi) return this.api.post<PropertySummary>('/client/properties', request);
    const property: PropertySummary = {
      id: `prop-${crypto.randomUUID().slice(0, 8)}`,
      address: request.address.trim(),
      city: request.city.trim(),
      postcode: request.postcode.trim(),
      panelCount: clampPanelCount(request.panelCount),
      roofType: request.roofType,
      accessNotes: request.accessNotes?.trim() || '',
      systemSizeKw: request.systemSizeKw ?? this.estimateSystemSizeKw(request.panelCount),
      imageUrl: DEFAULT_PROPERTY_IMAGE,
      isPrimary: this.properties.length === 0,
      subscriptionStatus: 'setup_required',
      nextCleanDate: null,
      monthlyBilling: 0,
    };
    this.properties = [...this.properties, property];
    this.persistProperties();
    return of({ ...property }).pipe(delay(300));
  }

  updatePropertyImage(id: string, imageUrl: string): Observable<PropertySummary> {
    if (this.useApi) {
      return this.api.patch<PropertySummary>(`/client/properties/${id}/image`, { imageUrl });
    }
    this.properties = this.properties.map((p) => (p.id === id ? { ...p, imageUrl } : p));
    this.persistProperties();
    const updated = this.properties.find((p) => p.id === id);
    if (!updated) return throwError(() => new Error('Property not found.'));
    return of({ ...updated }).pipe(delay(300));
  }

  updatePropertyNextClean(id: string, date: string | null): Observable<PropertySummary> {
    if (this.useApi) {
      return this.api.patch<PropertySummary>(`/client/properties/${id}/next-clean`, { date });
    }
    this.properties = this.properties.map((p) =>
      p.id === id ? { ...p, nextCleanDate: date } : p,
    );
    this.persistProperties();
    const updated = this.properties.find((p) => p.id === id);
    if (!updated) return throwError(() => new Error('Property not found.'));
    return of({ ...updated }).pipe(delay(200));
  }

  setPrimaryProperty(id: string): Observable<PropertySummary[]> {
    if (this.useApi) {
      return this.api.patch<PropertySummary[]>(`/client/properties/${id}/primary`, {});
    }
    this.properties = this.properties.map((p) => ({ ...p, isPrimary: p.id === id }));
    this.persistProperties();
    return of(this.properties.map((p) => ({ ...p }))).pipe(delay(300));
  }

  deleteProperty(id: string): Observable<PropertySummary[]> {
    if (this.useApi) return this.api.delete<PropertySummary[]>(`/client/properties/${id}`);
    if (this.properties.length <= 1) {
      return throwError(() => new Error('You must keep at least one property on your account.'));
    }
    const removed = this.properties.find((p) => p.id === id);
    this.properties = this.properties.filter((p) => p.id !== id);
    if (removed?.isPrimary) {
      this.properties = this.properties.map((p, index) => ({
        ...p,
        isPrimary: index === 0,
      }));
    }
    this.persistProperties();
    return of(this.properties.map((p) => ({ ...p }))).pipe(delay(300));
  }

  getProfile(): Observable<ClientProfile> {
    if (this.useApi) return this.api.get<ClientProfile>('/client/profile');
    return of({
      firstName: MOCK_CUSTOMER.firstName,
      lastName: MOCK_CUSTOMER.lastName,
      email: MOCK_CUSTOMER.email,
      phone: MOCK_CUSTOMER.phone,
      preferredContact: 'whatsapp' as const,
      emailReminders: true,
      whatsAppReminders: true,
    }).pipe(delay(300));
  }

  updateProfile(request: UpdateClientProfileRequest): Observable<ClientProfile> {
    if (this.useApi) return this.api.patch<ClientProfile>('/client/profile', request);
    return of({
      ...request,
      email: MOCK_CUSTOMER.email,
    }).pipe(delay(400));
  }

  changePassword(request: ChangePasswordRequest): Observable<ChangePasswordResult> {
    if (this.useApi) {
      return this.api.post<ChangePasswordResult>('/client/profile/change-password', request);
    }
    if (request.newPassword.length < 8) {
      return throwError(() => ({ error: { message: 'password_too_short' } }));
    }
    if (request.newPassword !== request.confirmPassword) {
      return throwError(() => ({ error: { message: 'password_mismatch' } }));
    }
    return of({ success: true }).pipe(delay(400));
  }

  publishReport(): void {
    this.reportAvailable = true;
    localStorage.setItem(REPORT_KEY, 'true');
  }

  publishReportFromJob(job: {
    id: string;
    bookingId: string;
    propertyId: string;
    address: string;
    city: string;
    postcode: string;
    panelCount: number;
    systemSizeKw: number;
    roofType: string;
    accessNotes: string;
    planType: string;
    beforePhotos: string[];
    afterPhotos: string[];
    beforeKwhReading: number | null;
    afterKwhReading: number | null;
    completionNotes: string | null;
    checklist: { label: string; completed: boolean }[];
    completedAt: string | null;
    heroImageUrl: string;
  }): void {
    if (this.useApi) return;

    this.reportAvailable = true;
    localStorage.setItem(REPORT_KEY, 'true');
    const completedAt = job.completedAt ?? new Date().toISOString();
    const gain =
      job.beforeKwhReading != null &&
      job.afterKwhReading != null &&
      job.afterKwhReading >= job.beforeKwhReading
        ? job.afterKwhReading - job.beforeKwhReading
        : null;
    const report: CleaningReport = {
      id: `report-job-${job.id}`,
      bookingId: job.bookingId,
      completedAt: completedAt.split('T')[0],
      serviceType: 'Solar Panel Cleaning Report',
      panelCount: job.panelCount,
      staffName: 'James M.',
      propertyId: job.propertyId,
      propertyAddress: `${job.address}, ${job.city}, ${job.postcode}`,
      status: 'completed',
      planName: job.planType,
      systemSizeKw: job.systemSizeKw,
      roofType: job.roofType,
      accessNotes: job.accessNotes,
      propertyImageUrl: job.heroImageUrl,
      beforePhotos: [...job.beforePhotos],
      afterPhotos: [...job.afterPhotos],
      beforeKwhReading: job.beforeKwhReading,
      afterKwhReading: job.afterKwhReading,
      kwhGain: gain,
      checklistSummary: job.checklist.filter((c) => c.completed).map((c) => c.label),
      staffNotes: job.completionNotes ?? '',
    };
    const existing = MOCK_REPORTS.findIndex((r) => r.id === report.id);
    if (existing >= 0) MOCK_REPORTS[existing] = report;
    else MOCK_REPORTS.unshift(report);
  }

  private loadReportFlag(): boolean {
    return localStorage.getItem(REPORT_KEY) === 'true';
  }

  private loadProperties(): PropertySummary[] {
    if (this.useApi) return [];
    try {
      const raw = localStorage.getItem(PROPERTIES_KEY);
      if (raw) return (JSON.parse(raw) as PropertySummary[]).map((p) => this.normalizeProperty(p));
    } catch {
      // fall through to defaults
    }
    return MOCK_PROPERTIES.map((p) => ({ ...p }));
  }

  private normalizeProperty(property: PropertySummary): PropertySummary {
    const defaults = MOCK_PROPERTY_BY_ID.get(property.id);
    return {
      ...(defaults ?? {}),
      ...property,
      subscriptionStatus: property.subscriptionStatus ?? defaults?.subscriptionStatus ?? 'setup_required',
      planName: property.planName ?? defaults?.planName,
      planVariant: property.planVariant ?? defaults?.planVariant,
      planFrequency: property.planFrequency ?? defaults?.planFrequency,
      nextCleanDate: property.nextCleanDate ?? defaults?.nextCleanDate ?? null,
      monthlyBilling: property.monthlyBilling ?? defaults?.monthlyBilling ?? 0,
      imageUrl: defaults?.imageUrl ?? property.imageUrl ?? DEFAULT_PROPERTY_IMAGE,
    };
  }

  private persistProperties(): void {
    localStorage.setItem(PROPERTIES_KEY, JSON.stringify(this.properties));
  }

  private estimateSystemSizeKw(panelCount: number): number {
    return Math.round(clampPanelCount(panelCount) * 0.433 * 10) / 10;
  }
}
