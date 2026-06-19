import { Injectable } from '@angular/core';
import { Observable, delay, forkJoin, map, of, switchMap } from 'rxjs';
import {
  ChecklistItem,
  JobIssueType,
  StaffDashboard,
  StaffJob,
  StaffJobSummary,
  StaffCustomerSummary,
  StaffProfile,
  StaffMessage,
  StaffNotification,
} from '../models/staff.models';
import { createStaffMockJobs, MOCK_STAFF_MEMBER } from '../data/staff-mock-data';
import {
  applyOperationalStatus,
  deriveOperationalStatus,
  shortAccess,
  validateJobCompletion,
} from '../utils/staff-workflow.util';
import { ClientService } from './client.service';
import { APP_CONFIG } from '../config/app-config';
import { ApiClientService } from '../http/api-client.service';
import {
  mapStaffDashboard,
  mapStaffJob,
  mapStaffJobSummary,
  mapStaffNotification,
  mapStaffProfile,
  StaffDashboardDtoApi,
  StaffJobDtoApi,
  StaffNotificationDtoApi,
  StaffProfileDtoApi,
} from '../mappers/staff-api.mapper';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private jobs: StaffJob[] = createStaffMockJobs();
  private readonly useApi = !APP_CONFIG.mockMode;

  constructor(
    private readonly clientService: ClientService,
    private readonly api: ApiClientService,
  ) {}

  getDashboard(): Observable<StaffDashboard> {
    if (this.useApi) {
      return this.api.get<StaffDashboardDtoApi>('/staff/dashboard').pipe(map(mapStaffDashboard));
    }

    const today = '2026-06-16';
    const jobs = this.getTodaySummaries(today);
    const completedCount = jobs.filter((j) => j.operationalStatus === 'completed').length;
    const nextJob =
      jobs.find((j) => j.operationalStatus !== 'completed' && j.operationalStatus !== 'cancelled') ??
      null;

    return of({
      staffName: MOCK_STAFF_MEMBER.fullName,
      todayDate: today,
      jobs,
      completedCount,
      totalCount: jobs.length,
      remainingCount: jobs.length - completedCount,
      nextJob,
    }).pipe(delay(300));
  }

  getProfile(): Observable<StaffProfile | null> {
    if (this.useApi) {
      return this.api
        .get<StaffProfileDtoApi | null>('/staff/profile')
        .pipe(map((dto) => (dto ? mapStaffProfile(dto) : null)));
    }

    return of({
      id: MOCK_STAFF_MEMBER.id,
      email: 'james.staff@solanist.co.za',
      firstName: 'James',
      lastName: 'Mitchell',
      phone: MOCK_STAFF_MEMBER.phone,
      role: 'staff',
      staffId: MOCK_STAFF_MEMBER.id,
    }).pipe(delay(200));
  }

  getNotifications(): Observable<StaffNotification[]> {
    if (this.useApi) {
      return this.api.get<StaffNotificationDtoApi[]>('/staff/notifications').pipe(
        map((dtos) => dtos.map(mapStaffNotification)),
      );
    }
    return of([] as StaffNotification[]).pipe(delay(150));
  }

  markNotificationsRead(): Observable<number> {
    if (this.useApi) {
      return this.api.post<number>('/staff/notifications/read', {});
    }
    return of(0).pipe(delay(100));
  }

  getJobs(): Observable<StaffJobSummary[]> {
    if (this.useApi) {
      return this.api.get<StaffJobDtoApi[]>('/staff/jobs').pipe(
        map((jobs) => jobs.map((j) => mapStaffJobSummary(mapStaffJob(j)))),
      );
    }
    return of(this.jobs.map((j) => this.toSummary(j))).pipe(delay(300));
  }

  getSchedule(from?: string, to?: string): Observable<StaffJobSummary[]> {
    if (this.useApi) {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const qs = params.toString();
      const path = qs ? `/staff/schedule?${qs}` : '/staff/schedule';
      return this.api.get<{ from: string; to: string; jobs: StaffJobDtoApi[] }>(path).pipe(
        map((schedule) => schedule.jobs.map((j) => mapStaffJobSummary(mapStaffJob(j)))),
      );
    }
    return this.getJobs().pipe(
      map((jobs) =>
        jobs.filter((job) => {
          if (!from && !to) return true;
          if (from && job.scheduledDate < from) return false;
          if (to && job.scheduledDate > to) return false;
          return true;
        }),
      ),
      delay(300),
    );
  }

  getTodayJobs(): Observable<StaffJobSummary[]> {
    if (this.useApi) return this.getDashboard().pipe(map((d) => d.jobs));
    return of(this.getTodaySummaries('2026-06-16')).pipe(delay(300));
  }

  applyAdminOperationalStatus(
    jobId: string,
    operationalStatus: import('../models/staff.models').StaffOperationalStatus,
  ): Observable<StaffJobSummary | null> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return of(null).pipe(delay(200));
    const updated = applyOperationalStatus(this.cloneJob(job), operationalStatus);
    const idx = this.jobs.findIndex((j) => j.id === jobId);
    this.jobs[idx] = updated;
    return of(this.toSummary(updated)).pipe(delay(300));
  }

  getCompletedJobs(): Observable<StaffJobSummary[]> {
    if (this.useApi) {
      return this.getJobs().pipe(
        map((jobs) => jobs.filter((j) => j.operationalStatus === 'completed')),
      );
    }
    return of(this.jobs.filter((j) => j.completedAt).map((j) => this.toSummary(j))).pipe(delay(300));
  }

  getJobsWithIssues(): Observable<StaffJob[]> {
    if (this.useApi) {
      return this.api.get<StaffJobDtoApi[]>('/staff/jobs').pipe(
        map((jobs) =>
          jobs.filter((j) => j.issue).map((j) => mapStaffJob(j)),
        ),
      );
    }
    return of(this.jobs.filter((j) => j.issue).map((j) => this.cloneJob(j))).pipe(delay(300));
  }

  getMessages(): Observable<StaffMessage[]> {
    if (this.useApi) {
      return forkJoin({
        dashboard: this.getDashboard(),
        jobs: this.api.get<StaffJobDtoApi[]>('/staff/jobs').pipe(
          map((dtos) => dtos.map((dto) => mapStaffJob(dto))),
        ),
      }).pipe(map(({ dashboard, jobs }) => this.buildMessages(dashboard, jobs)));
    }

    const dashboard = this.buildMockDashboard();
    return of(this.buildMessages(dashboard, this.jobs.map((j) => this.cloneJob(j)))).pipe(delay(300));
  }

  getCustomers(): Observable<StaffCustomerSummary[]> {
    if (this.useApi) {
      return this.api.get<StaffJobDtoApi[]>('/staff/jobs').pipe(
        map((jobs) => {
          const byCustomer = new Map<string, StaffCustomerSummary>();
          for (const dto of jobs) {
            const job = mapStaffJob(dto);
            const existing = byCustomer.get(job.customerId);
            if (existing) {
              existing.propertyCount += 1;
            } else {
              byCustomer.set(job.customerId, {
                id: job.customerId,
                name: job.customerName,
                phone: job.customerPhone,
                email: job.customerEmail,
                primaryAddress: `${job.address}, ${job.city}`,
                propertyCount: 1,
              });
            }
          }
          return [...byCustomer.values()];
        }),
      );
    }

    const byCustomer = new Map<string, StaffCustomerSummary>();
    for (const job of this.jobs) {
      const existing = byCustomer.get(job.customerId);
      if (existing) {
        existing.propertyCount += 1;
      } else {
        byCustomer.set(job.customerId, {
          id: job.customerId,
          name: job.customerName,
          phone: job.customerPhone,
          email: job.customerEmail,
          primaryAddress: `${job.address}, ${job.city}`,
          propertyCount: 1,
        });
      }
    }
    return of([...byCustomer.values()]).pipe(delay(300));
  }

  getJob(id: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .get<StaffJobDtoApi | null>(`/staff/jobs/${id}`)
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.jobs.find((j) => j.id === id);
    if (!job) return of(null).pipe(delay(300));
    return of(this.cloneJob(job)).pipe(delay(300));
  }

  setOnTheWay(id: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .patch<StaffJobDtoApi | null>(`/staff/jobs/${id}`, { onTheWay: true, arrived: false })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job || job.completedAt) return of(null).pipe(delay(200));
    job.onTheWay = true;
    job.arrived = false;
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  setArrived(id: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .patch<StaffJobDtoApi | null>(`/staff/jobs/${id}`, { arrived: true })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job || job.completedAt) return of(null).pipe(delay(200));
    job.arrived = true;
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  checkIn(id: string, note?: string, latitude?: number, longitude?: number): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .post<StaffJobDtoApi | null>(`/staff/jobs/${id}/check-in`, {
          note,
          latitude,
          longitude,
        })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job || job.completedAt) return of(null).pipe(delay(200));
    job.checkedInAt = new Date().toISOString();
    job.checkInNote = note?.trim() || null;
    job.onTheWay = true;
    job.arrived = true;
    job.checkInLatitude = latitude ?? -26.1076;
    job.checkInLongitude = longitude ?? 28.0567;
    return of(this.cloneJob(job)).pipe(delay(400));
  }

  addPhotos(id: string, type: 'before' | 'after', photos: string[]): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .post<StaffJobDtoApi | null>(`/staff/jobs/${id}/photos`, { type, photos })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    if (type === 'before') {
      job.beforePhotos = [...job.beforePhotos, ...photos];
      const slots = job.photoSlots.filter((s) => s.type === 'before' && !s.photoUrl);
      photos.forEach((url, i) => {
        if (slots[i]) slots[i].photoUrl = url;
      });
    } else {
      job.afterPhotos = [...job.afterPhotos, ...photos];
      const slots = job.photoSlots.filter((s) => s.type === 'after' && !s.photoUrl);
      photos.forEach((url, i) => {
        if (slots[i]) slots[i].photoUrl = url;
      });
    }
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  removePhoto(id: string, type: 'before' | 'after', index: number): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.getJob(id).pipe(
        switchMap((job) => {
          if (!job) return of(null);
          const beforePhotos =
            type === 'before' ? job.beforePhotos.filter((_, i) => i !== index) : job.beforePhotos;
          const afterPhotos =
            type === 'after' ? job.afterPhotos.filter((_, i) => i !== index) : job.afterPhotos;
          return this.api
            .patch<StaffJobDtoApi | null>(`/staff/jobs/${id}`, { beforePhotos, afterPhotos })
            .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
        }),
      );
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    if (type === 'before') {
      job.beforePhotos = job.beforePhotos.filter((_, i) => i !== index);
    } else {
      job.afterPhotos = job.afterPhotos.filter((_, i) => i !== index);
    }
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  updateChecklist(id: string, checklist: ChecklistItem[]): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .put<StaffJobDtoApi | null>(`/staff/jobs/${id}/checklist`, { checklist })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    job.checklist = checklist.map((c) => ({ ...c }));
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  updateNotes(id: string, notes: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .patch<StaffJobDtoApi | null>(`/staff/jobs/${id}`, { completionNotes: notes })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    job.completionNotes = notes;
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  updateKwhReading(
    id: string,
    type: 'before' | 'after',
    reading: number | null,
  ): Observable<StaffJob | null> {
    if (this.useApi) {
      const value =
        reading != null && Number.isFinite(reading) && reading > 0 ? reading : null;
      const body =
        type === 'before' ? { beforeKwhReading: value } : { afterKwhReading: value };
      return this.api
        .patch<StaffJobDtoApi | null>(`/staff/jobs/${id}`, body)
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    const value =
      reading != null && Number.isFinite(reading) && reading > 0 ? reading : null;
    if (type === 'before') job.beforeKwhReading = value;
    else job.afterKwhReading = value;
    return of(this.cloneJob(job)).pipe(delay(200));
  }

  reportIssue(id: string, issueType: JobIssueType, description: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.api
        .post<StaffJobDtoApi | null>(`/staff/jobs/${id}/issue`, {
          issueType,
          description,
        })
        .pipe(map((dto) => (dto ? mapStaffJob(dto) : null)));
    }
    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    job.issue = {
      issueType,
      description,
      reportedAt: new Date().toISOString(),
    };
    return of(this.cloneJob(job)).pipe(delay(300));
  }

  completeJob(id: string, notes: string): Observable<StaffJob | null> {
    if (this.useApi) {
      return this.getJob(id).pipe(
        switchMap((job) => {
          if (!job) return of(null);
          job.completionNotes = notes;
          if (!validateJobCompletion(job).canComplete) return of(null);
          return this.api
            .post<StaffJobDtoApi | null>(`/staff/jobs/${id}/complete`, {
              notes,
              report: this.buildReportPayload(job, notes),
            })
            .pipe(switchMap(() => this.getJob(id)));
        }),
      );
    }

    const job = this.findJob(id);
    if (!job) return of(null).pipe(delay(200));
    job.completionNotes = notes;
    const validation = validateJobCompletion(job);
    if (!validation.canComplete) return of(null).pipe(delay(200));

    job.completedAt = new Date().toISOString();
    this.clientService.publishReportFromJob(job);
    return of(this.cloneJob(job)).pipe(delay(400));
  }

  private buildReportPayload(job: StaffJob, notes: string) {
    return {
      jobId: job.id,
      customerId: job.customerId,
      propertyId: job.propertyId,
      bookingId: job.bookingId,
      address: job.address,
      city: job.city,
      postcode: job.postcode,
      panelCount: job.panelCount,
      systemSizeKw: job.systemSizeKw,
      roofType: job.roofType,
      accessNotes: job.accessNotes,
      planName: job.planType,
      propertyImageUrl: job.heroImageUrl,
      beforePhotos: job.beforePhotos,
      afterPhotos: job.afterPhotos,
      beforeKwhReading: job.beforeKwhReading,
      afterKwhReading: job.afterKwhReading,
      checklistSummary: job.checklist.filter((c) => c.completed).map((c) => c.label),
      staffNotes: notes,
    };
  }

  private findJob(id: string): StaffJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  private getTodaySummaries(today: string): StaffJobSummary[] {
    return this.jobs
      .filter((j) => j.scheduledDate === today)
      .sort((a, b) => a.routeOrder - b.routeOrder)
      .map((j) => this.toSummary(j));
  }

  private toSummary(job: StaffJob): StaffJobSummary {
    return mapStaffJobSummary(job);
  }

  private buildMockDashboard(): StaffDashboard {
    const today = '2026-06-16';
    const jobs = this.getTodaySummaries(today);
    const completedCount = jobs.filter((j) => j.operationalStatus === 'completed').length;
    const nextJob =
      jobs.find((j) => j.operationalStatus !== 'completed' && j.operationalStatus !== 'cancelled') ??
      null;
    return {
      staffName: MOCK_STAFF_MEMBER.fullName,
      todayDate: today,
      jobs,
      completedCount,
      totalCount: jobs.length,
      remainingCount: jobs.length - completedCount,
      nextJob,
    };
  }

  private buildMessages(dashboard: StaffDashboard, jobs: StaffJob[]): StaffMessage[] {
    const messages: StaffMessage[] = [];
    const today = dashboard.todayDate;

    const activeToday = jobs
      .filter(
        (j) =>
          j.scheduledDate === today &&
          !j.completedAt &&
          j.operationalStatus !== 'cancelled',
      )
      .sort((a, b) => a.routeOrder - b.routeOrder);

    if (dashboard.remainingCount > 0) {
      messages.push({
        id: 'ops-route',
        type: 'operations',
        from: 'Operations',
        preview: `${dashboard.remainingCount} job${dashboard.remainingCount === 1 ? '' : 's'} remaining on today's route.`,
        time: 'Today',
        unread: dashboard.completedCount === 0,
      });
    }

    if (dashboard.nextJob) {
      const next = jobs.find((j) => j.id === dashboard.nextJob!.id);
      if (next) {
        messages.push({
          id: `ops-next-${next.id}`,
          type: 'operations',
          from: 'Operations',
          preview: `Next up: ${next.address} at ${next.scheduledTime.split('–')[0]?.trim() ?? next.scheduledTime}.`,
          time: 'Today',
          unread: true,
        });
      }
    }

    for (const job of activeToday) {
      if (job.instructions?.trim()) {
        messages.push({
          id: `job-${job.id}-instructions`,
          type: 'customer',
          from: job.customerName,
          preview: job.instructions.trim(),
          time: job.scheduledTime.split('–')[0]?.trim() ?? job.scheduledTime,
          unread: job.id === dashboard.nextJob?.id,
          jobId: job.id,
          phone: job.customerPhone,
        });
      } else if (job.accessNotes?.trim()) {
        messages.push({
          id: `job-${job.id}-access`,
          type: 'customer',
          from: job.customerName,
          preview: job.accessNotes.trim(),
          time: job.scheduledTime.split('–')[0]?.trim() ?? job.scheduledTime,
          unread: job.id === dashboard.nextJob?.id,
          jobId: job.id,
          phone: job.customerPhone,
        });
      }
    }

    const seen = new Set<string>();
    return messages.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  private cloneJob(job: StaffJob): StaffJob {
    const cloned = {
      ...job,
      checklist: job.checklist.map((c) => ({ ...c })),
      photoSlots: job.photoSlots.map((s) => ({ ...s })),
      beforePhotos: [...job.beforePhotos],
      afterPhotos: [...job.afterPhotos],
      issue: job.issue ? { ...job.issue } : null,
      operationalStatus: deriveOperationalStatus(job),
    };
    return cloned;
  }
}
