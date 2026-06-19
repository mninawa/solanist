import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StaffService } from '../../../core/services/staff.service';
import { StaffJob, StaffOperationalStatus } from '../../../core/models/staff.models';
import {
  deriveOperationalStatus,
  mapsUrl,
  nextWorkflowRoute,
  whatsAppUrl,
} from '../../../core/utils/staff-workflow.util';
import { OPERATIONAL_STATUS_LABELS } from '../../../core/models/staff.models';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, AppIconComponent],
  templateUrl: './staff-job-detail.component.html',
  styleUrl: './staff-job-detail.component.scss',
})
export class StaffJobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly staffService = inject(StaffService);

  job = signal<StaffJob | null>(null);

  operationalStatus = computed(() => {
    const j = this.job();
    return j ? deriveOperationalStatus(j) : null;
  });

  primaryAction = computed(() => {
    const j = this.job();
    if (!j) return null;
    const status = deriveOperationalStatus(j);
    if (status === 'completed') return null;
    const route = nextWorkflowRoute(j);
    if (!route) return null;

    let label = 'Continue';
    let variant: 'primary' | 'success' = 'primary';
    if (!j.checkedInAt) {
      label = 'Check In';
      variant = 'success';
    } else if (route.includes('before-photos')) label = 'Before Photos';
    else if (route.includes('checklist')) label = 'Cleaning Checklist';
    else if (route.includes('after-photos')) label = 'After Photos';
    else if (route.includes('complete')) label = 'Review & Complete';

    return { label, route, variant };
  });

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id') ?? '';
    this.staffService.getJob(id).subscribe({
      next: (j) => this.job.set(j),
    });
  }

  statusLabel(status: StaffOperationalStatus): string {
    return OPERATIONAL_STATUS_LABELS[status]?.toUpperCase() ?? status;
  }

  statusClass(status: StaffOperationalStatus): string {
    if (status === 'completed') return 'status-completed';
    if (status === 'issue_reported') return 'status-issue';
    if (status === 'assigned') return 'status-assigned';
    return 'status-progress';
  }

  getMapsUrl(job: StaffJob): string {
    return mapsUrl(job);
  }

  getWhatsAppUrl(job: StaffJob): string {
    return whatsAppUrl(job.customerPhone);
  }
}
