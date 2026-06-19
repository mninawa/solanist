import {
  ChecklistItem,
  JobCompletionValidation,
  MIN_AFTER_PHOTOS,
  MIN_BEFORE_PHOTOS,
  StaffJob,
  StaffOperationalStatus,
} from '../models/staff.models';

export function deriveOperationalStatus(job: StaffJob): StaffOperationalStatus {
  if (job.status === 'cancelled') return 'cancelled';
  if (job.issue) return 'issue_reported';
  if (job.completedAt) return 'completed';
  if (!job.checkedInAt) {
    if (job.onTheWay) return 'on_the_way';
    if (job.arrived) return 'arrived';
    return 'assigned';
  }
  if (job.beforePhotos.length < MIN_BEFORE_PHOTOS) return 'before_photos_required';

  const requiredItems = job.checklist.filter((c) => c.required);
  const checklistDone = requiredItems.every((c) => c.completed);
  const checklistStarted = job.checklist.some((c) => c.completed);

  if (!checklistDone) {
    return checklistStarted ? 'cleaning_in_progress' : 'checklist_required';
  }
  if (job.afterPhotos.length < MIN_AFTER_PHOTOS) return 'after_photos_required';
  return 'ready_to_complete';
}

export function applyOperationalStatus(
  job: StaffJob,
  targetStatus: StaffOperationalStatus,
): StaffJob {
  const updated: StaffJob = {
    ...job,
    issue: null,
    completedAt: null,
    completionNotes: null,
    checkedInAt: null,
    checkInNote: null,
    onTheWay: false,
    arrived: false,
    status: 'scheduled',
  };

  switch (targetStatus) {
    case 'on_the_way':
      updated.onTheWay = true;
      break;
    case 'arrived':
      updated.onTheWay = true;
      updated.arrived = true;
      break;
    case 'checked_in':
    case 'before_photos_required':
    case 'cleaning_in_progress':
    case 'checklist_required':
    case 'after_photos_required':
    case 'ready_to_complete':
      updated.onTheWay = true;
      updated.arrived = true;
      updated.checkedInAt = new Date().toISOString();
      updated.status = 'in_progress';
      break;
    case 'issue_reported':
      updated.issue = {
        issueType: 'other',
        description: 'Flagged from admin jobs board.',
        reportedAt: new Date().toISOString(),
      };
      break;
    case 'completed':
      updated.status = 'completed';
      updated.completedAt = new Date().toISOString();
      updated.completionNotes = 'Completed from admin jobs board.';
      updated.onTheWay = true;
      updated.arrived = true;
      break;
    case 'cancelled':
      updated.status = 'cancelled';
      break;
    default:
      break;
  }

  return { ...updated, operationalStatus: deriveOperationalStatus(updated) };
}

export function isChecklistComplete(checklist: ChecklistItem[]): boolean {
  return checklist.filter((c) => c.required).every((c) => c.completed);
}

export function isValidKwhReading(value: number | null | undefined): boolean {
  return value != null && Number.isFinite(value) && value > 0;
}

export function kwhGain(before: number | null, after: number | null): number | null {
  if (!isValidKwhReading(before) || !isValidKwhReading(after)) return null;
  const gain = after! - before!;
  return gain >= 0 ? gain : null;
}

export function validateJobCompletion(job: StaffJob): JobCompletionValidation {
  const checkIn = !!job.checkedInAt;
  const beforePhotos = job.beforePhotos.length >= MIN_BEFORE_PHOTOS;
  const beforeKwh = isValidKwhReading(job.beforeKwhReading);
  const checklist = isChecklistComplete(job.checklist);
  const afterPhotos = job.afterPhotos.length >= MIN_AFTER_PHOTOS;
  const afterKwh = isValidKwhReading(job.afterKwhReading);
  const notes = !!(job.completionNotes?.trim());
  return {
    checkIn,
    beforePhotos,
    beforeKwh,
    checklist,
    afterPhotos,
    afterKwh,
    notes,
    canComplete:
      checkIn && beforePhotos && beforeKwh && checklist && afterPhotos && afterKwh && notes,
  };
}

export function checklistProgress(checklist: ChecklistItem[]): number {
  if (!checklist.length) return 0;
  const done = checklist.filter((c) => c.completed).length;
  return Math.round((done / checklist.length) * 100);
}

export function shortAccess(accessNotes: string): string {
  const lower = accessNotes.toLowerCase();
  if (lower.includes('side gate')) return 'Side gate';
  if (lower.includes('front gate')) return 'Front gate';
  return accessNotes.split('—')[0]?.trim() || accessNotes.split('.')[0]?.trim() || accessNotes;
}

export function mapsUrl(job: Pick<StaffJob, 'address' | 'city' | 'postcode'>): string {
  const address = encodeURIComponent(`${job.address}, ${job.city}, ${job.postcode}`);
  return `https://maps.google.com/?q=${address}`;
}

export function whatsAppUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const normalized = digits.startsWith('0') ? `27${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function nextWorkflowRoute(job: StaffJob): string | null {
  const status = deriveOperationalStatus(job);
  switch (status) {
    case 'assigned':
    case 'on_the_way':
    case 'arrived':
      return `/staff/jobs/${job.id}/check-in`;
    case 'before_photos_required':
      return `/staff/jobs/${job.id}/before-photos`;
    case 'checklist_required':
    case 'cleaning_in_progress':
      return `/staff/jobs/${job.id}/checklist`;
    case 'after_photos_required':
      return `/staff/jobs/${job.id}/after-photos`;
    case 'ready_to_complete':
      return `/staff/jobs/${job.id}/complete`;
    default:
      return null;
  }
}
