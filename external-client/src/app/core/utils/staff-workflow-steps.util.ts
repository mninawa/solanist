import { MIN_AFTER_PHOTOS, MIN_BEFORE_PHOTOS, StaffJob } from '../models/staff.models';
import { isChecklistComplete } from './staff-workflow.util';

export type WorkflowStepId =
  | 'assigned'
  | 'on_the_way'
  | 'checked_in'
  | 'before_photos'
  | 'checklist'
  | 'after_photos'
  | 'complete';

export interface WorkflowStep {
  id: WorkflowStepId;
  label: string;
  route: string | null;
  stepNum: number;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'assigned', label: 'Assigned', route: null, stepNum: 1 },
  { id: 'on_the_way', label: 'On The Way', route: null, stepNum: 2 },
  { id: 'checked_in', label: 'Checked In', route: 'check-in', stepNum: 3 },
  { id: 'before_photos', label: 'Before Photos', route: 'before-photos', stepNum: 4 },
  { id: 'checklist', label: 'Cleaning & Checklist', route: 'checklist', stepNum: 5 },
  { id: 'after_photos', label: 'After Photos', route: 'after-photos', stepNum: 6 },
  { id: 'complete', label: 'Review & Complete', route: 'complete', stepNum: 7 },
];

export type WorkflowRoute =
  | ''
  | 'check-in'
  | 'before-photos'
  | 'checklist'
  | 'after-photos'
  | 'complete'
  | 'issue';

export function workflowRouteFromPath(path: string): WorkflowRoute {
  const routes: WorkflowRoute[] = [
    '',
    'check-in',
    'before-photos',
    'checklist',
    'after-photos',
    'complete',
    'issue',
  ];
  return routes.includes(path as WorkflowRoute) ? (path as WorkflowRoute) : '';
}

export function activeStepId(route: WorkflowRoute): WorkflowStepId {
  switch (route) {
    case 'check-in':
      return 'checked_in';
    case 'before-photos':
      return 'before_photos';
    case 'checklist':
      return 'checklist';
    case 'after-photos':
      return 'after_photos';
    case 'complete':
      return 'complete';
    default:
      return 'assigned';
  }
}

export function isStepComplete(job: StaffJob, stepId: WorkflowStepId): boolean {
  switch (stepId) {
    case 'assigned':
      return true;
    case 'on_the_way':
      return job.onTheWay || !!job.checkedInAt;
    case 'checked_in':
      return !!job.checkedInAt;
    case 'before_photos':
      return job.beforePhotos.length >= MIN_BEFORE_PHOTOS;
    case 'checklist':
      return isChecklistComplete(job.checklist);
    case 'after_photos':
      return job.afterPhotos.length >= MIN_AFTER_PHOTOS;
    case 'complete':
      return !!job.completedAt;
    default:
      return false;
  }
}

export function nextRouteLabel(route: WorkflowRoute): string | null {
  switch (route) {
    case 'check-in':
      return 'Next: Before Photos';
    case 'before-photos':
      return 'Next: Checklist';
    case 'checklist':
      return 'Next: After Photos';
    case 'after-photos':
      return 'Next: Review & Complete';
    case 'complete':
      return 'Complete Job';
    default:
      return null;
  }
}

export function nextRoutePath(jobId: string, route: WorkflowRoute): string | null {
  switch (route) {
    case 'check-in':
      return `/staff/jobs/${jobId}/before-photos`;
    case 'before-photos':
      return `/staff/jobs/${jobId}/checklist`;
    case 'checklist':
      return `/staff/jobs/${jobId}/after-photos`;
    case 'after-photos':
      return `/staff/jobs/${jobId}/complete`;
    default:
      return null;
  }
}

export function formatBookingId(bookingId: string): string {
  if (bookingId.startsWith('BK-')) return bookingId;
  const parts = bookingId.replace('booking-', '').toUpperCase();
  return `BK-${parts}`;
}
