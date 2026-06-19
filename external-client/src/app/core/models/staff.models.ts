export type StaffOperationalStatus =
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'checked_in'
  | 'before_photos_required'
  | 'cleaning_in_progress'
  | 'checklist_required'
  | 'after_photos_required'
  | 'ready_to_complete'
  | 'completed'
  | 'issue_reported'
  | 'cancelled';

export type JobIssueType =
  | 'unsafe_roof'
  | 'no_access'
  | 'damaged_panel'
  | 'customer_unavailable'
  | 'weather'
  | 'security_access'
  | 'other';

export interface JobPhotoSlot {
  id: string;
  label: string;
  type: 'before' | 'after';
  required: boolean;
  photoUrl: string | null;
}

export interface JobIssue {
  issueType: JobIssueType;
  description: string;
  reportedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export interface StaffJobSummary {
  id: string;
  bookingId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  postcode: string;
  serviceType: string;
  planType: string;
  scheduledTime: string;
  scheduledDate: string;
  operationalStatus: StaffOperationalStatus;
  routeOrder: number;
  panelCount: number;
  systemSizeKw: number;
  roofType: string;
  accessShort: string;
  heroImageUrl: string;
}

export interface StaffJob extends StaffJobSummary {
  status: string;
  propertyId: string;
  customerId: string;
  customerPhone: string;
  customerEmail: string;
  instructions: string;
  accessNotes: string;
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

export interface StaffDashboard {
  staffName: string;
  todayDate: string;
  jobs: StaffJobSummary[];
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  nextJob: StaffJobSummary | null;
}

export interface StaffMember {
  id: string;
  fullName: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface StaffProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  staffId: string | null;
}

export type StaffMessageType = 'customer' | 'operations';

export interface StaffMessage {
  id: string;
  type: StaffMessageType;
  from: string;
  preview: string;
  time: string;
  unread: boolean;
  jobId?: string;
  phone?: string;
}

export interface StaffNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  bookingRef: string | null;
  read: boolean;
  createdAt: string;
}

export interface StaffCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  primaryAddress: string;
  propertyCount: number;
}

export interface JobCompletionValidation {
  checkIn: boolean;
  beforePhotos: boolean;
  beforeKwh: boolean;
  checklist: boolean;
  afterPhotos: boolean;
  afterKwh: boolean;
  notes: boolean;
  canComplete: boolean;
}

export const MIN_BEFORE_PHOTOS = 3;
export const MIN_AFTER_PHOTOS = 3;

export const JOB_ISSUE_LABELS: Record<JobIssueType, string> = {
  unsafe_roof: 'Unsafe roof access',
  no_access: 'Locked gate / no access',
  damaged_panel: 'Damaged panel visible',
  customer_unavailable: 'Customer not available',
  weather: 'Weather issue',
  security_access: 'Dog / security access issue',
  other: 'Other',
};

export const NOTE_QUICK_CHIPS = [
  'Moderate dust build-up',
  'Heavy dust build-up',
  'Bird droppings removed',
  'No visible damage',
  'Access was easy',
  'Customer not home',
  'Weather was clear',
] as const;

export const OPERATIONAL_STATUS_LABELS: Record<StaffOperationalStatus, string> = {
  assigned: 'Assigned',
  on_the_way: 'On the way',
  arrived: 'Arrived',
  checked_in: 'Checked in',
  before_photos_required: 'Before photos required',
  cleaning_in_progress: 'Cleaning in progress',
  checklist_required: 'Checklist required',
  after_photos_required: 'After photos required',
  ready_to_complete: 'Ready to complete',
  completed: 'Completed',
  issue_reported: 'Issue reported',
  cancelled: 'Cancelled',
};
