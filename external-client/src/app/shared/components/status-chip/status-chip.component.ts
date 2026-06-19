import { Component, Input } from '@angular/core';
import { JobStatus, BookingStatus, SubscriptionStatus } from '../../../core/models/common.models';
import { StaffOperationalStatus, OPERATIONAL_STATUS_LABELS } from '../../../core/models/staff.models';

type ChipStatus = JobStatus | BookingStatus | SubscriptionStatus | StaffOperationalStatus | 'pending' | 'accepted' | 'expired';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `<span class="chip" [class]="chipClass">{{ displayLabel }}</span>`,
  styles: `
    .chip {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: var(--radius-full);
      white-space: nowrap;
    }
    .chip-scheduled, .chip-assigned, .chip-upcoming, .chip-pending {
      background: var(--color-info-muted);
      color: var(--color-info);
    }
    .chip-in_progress, .chip-active, .chip-on_the_way, .chip-arrived, .chip-checked_in,
    .chip-cleaning_in_progress {
      background: var(--color-accent-muted);
      color: var(--color-accent);
    }
    .chip-before_photos_required, .chip-checklist_required, .chip-after_photos_required,
    .chip-ready_to_complete {
      background: var(--color-warning-muted, rgba(245, 158, 11, 0.15));
      color: var(--color-warning, #d97706);
    }
    .chip-completed, .chip-accepted {
      background: var(--color-success-muted);
      color: var(--color-success);
    }
    .chip-cancelled, .chip-expired, .chip-paused, .chip-issue_reported {
      background: rgba(239, 68, 68, 0.15);
      color: var(--color-error);
    }
  `,
})
export class StatusChipComponent {
  @Input({ required: true }) status!: ChipStatus;
  @Input() label?: string;

  get displayLabel(): string {
    if (this.label) return this.label;
    if (this.status in OPERATIONAL_STATUS_LABELS) {
      return OPERATIONAL_STATUS_LABELS[this.status as StaffOperationalStatus];
    }
    return this.status.replace(/_/g, ' ');
  }

  get chipClass(): string {
    return `chip-${this.status}`;
  }
}
