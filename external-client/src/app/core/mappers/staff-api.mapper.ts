import {
  ChecklistItem,
  JobIssue,
  JobPhotoSlot,
  StaffDashboard,
  StaffJob,
  StaffJobSummary,
  StaffProfile,
  StaffNotification,
} from '../models/staff.models';
import {
  deriveOperationalStatus,
  shortAccess,
} from '../utils/staff-workflow.util';

export interface StaffNotificationDtoApi {
  id: string;
  title: string;
  body: string;
  type: string;
  bookingRef: string | null;
  read: boolean;
  createdAt: string;
}

export function mapStaffNotification(dto: StaffNotificationDtoApi): StaffNotification {
  return {
    id: dto.id,
    title: dto.title,
    body: dto.body,
    type: dto.type,
    bookingRef: dto.bookingRef ?? null,
    read: dto.read,
    createdAt: dto.createdAt,
  };
}

export interface StaffJobDtoApi {
  id: string;
  bookingId: string;
  propertyId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  postcode: string;
  serviceType: string;
  planType: string;
  scheduledTime: string;
  scheduledDate: string;
  status: string;
  routeOrder: number;
  panelCount: number;
  systemSizeKw: number;
  roofType: string;
  accessShort: string;
  accessNotes: string;
  heroImageUrl: string;
  instructions: string;
  checklist: ChecklistItem[];
  photoSlots: JobPhotoSlot[];
  beforePhotos: string[];
  afterPhotos: string[];
  beforeKwhReading: number | null;
  afterKwhReading: number | null;
  checkedInAt: string | null;
  checkInLatitude: number | null;
  checkInLongitude: number | null;
  checkInNote: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  onTheWay: boolean;
  arrived: boolean;
  issue: JobIssue | null;
}

export interface StaffDashboardDtoApi {
  staffName: string;
  todayDate: string;
  jobs: StaffJobDtoApi[];
  completedCount: number;
  totalCount: number;
}

export interface StaffProfileDtoApi {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  staffId: string | null;
}

export function mapStaffProfile(dto: StaffProfileDtoApi): StaffProfile {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phone: dto.phone,
    role: dto.role,
    staffId: dto.staffId,
  };
}

export function mapStaffJob(dto: StaffJobDtoApi): StaffJob {
  const job: StaffJob = {
    id: dto.id,
    bookingId: dto.bookingId,
    propertyId: dto.propertyId,
    customerId: dto.customerId,
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    customerEmail: dto.customerEmail,
    address: dto.address,
    city: dto.city,
    postcode: dto.postcode,
    serviceType: dto.serviceType,
    planType: dto.planType,
    scheduledTime: dto.scheduledTime,
    scheduledDate: dto.scheduledDate,
    status: dto.status,
    operationalStatus: 'assigned',
    routeOrder: dto.routeOrder,
    panelCount: dto.panelCount,
    systemSizeKw: dto.systemSizeKw,
    roofType: dto.roofType,
    accessShort: dto.accessShort || shortAccess(dto.accessNotes),
    heroImageUrl: dto.heroImageUrl,
    accessNotes: dto.accessNotes,
    instructions: dto.instructions,
    checklist: dto.checklist.map((c) => ({ ...c })),
    photoSlots: dto.photoSlots.map((s) => ({ ...s })),
    beforePhotos: [...dto.beforePhotos],
    afterPhotos: [...dto.afterPhotos],
    beforeKwhReading: dto.beforeKwhReading,
    afterKwhReading: dto.afterKwhReading,
    checkedInAt: dto.checkedInAt,
    checkInLatitude: dto.checkInLatitude,
    checkInLongitude: dto.checkInLongitude,
    checkInNote: dto.checkInNote,
    completedAt: dto.completedAt,
    completionNotes: dto.completionNotes,
    onTheWay: dto.onTheWay,
    arrived: dto.arrived,
    issue: dto.issue ? { ...dto.issue } : null,
  };
  return { ...job, operationalStatus: deriveOperationalStatus(job) };
}

export function mapStaffJobSummary(job: StaffJob): StaffJobSummary {
  return {
    id: job.id,
    bookingId: job.bookingId,
    customerName: job.customerName,
    customerPhone: job.customerPhone,
    address: job.address,
    city: job.city,
    postcode: job.postcode,
    serviceType: job.serviceType,
    planType: job.planType,
    scheduledTime: job.scheduledTime,
    scheduledDate: job.scheduledDate,
    operationalStatus: job.operationalStatus,
    routeOrder: job.routeOrder,
    panelCount: job.panelCount,
    systemSizeKw: job.systemSizeKw,
    roofType: job.roofType,
    accessShort: job.accessShort,
    heroImageUrl: job.heroImageUrl,
  };
}

export function mapStaffDashboard(dto: StaffDashboardDtoApi): StaffDashboard {
  const jobs = dto.jobs.map((j) => mapStaffJobSummary(mapStaffJob(j)));
  const completedCount = dto.completedCount;
  const nextJob =
    jobs.find(
      (j) => j.operationalStatus !== 'completed' && j.operationalStatus !== 'cancelled',
    ) ?? null;

  return {
    staffName: dto.staffName,
    todayDate: dto.todayDate,
    jobs,
    completedCount,
    totalCount: dto.totalCount,
    remainingCount: dto.totalCount - completedCount,
    nextJob,
  };
}
