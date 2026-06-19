import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { StaffDashboard, StaffJobSummary, StaffOperationalStatus } from '../../../core/models/staff.models';
import { OPERATIONAL_STATUS_LABELS } from '../../../core/models/staff.models';
import { mapsUrl, whatsAppUrl } from '../../../core/utils/staff-workflow.util';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss',
})
export class StaffDashboardComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  dashboard = signal<StaffDashboard | null>(null);
  loading = signal(true);
  sortByTime = signal(true);

  sortedJobs = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    const jobs = [...d.jobs];
    if (this.sortByTime()) {
      return jobs.sort((a, b) => a.routeOrder - b.routeOrder);
    }
    return jobs.sort((a, b) => a.address.localeCompare(b.address));
  });

  activeJobs = computed(() =>
    this.sortedJobs().filter((j) => j.operationalStatus !== 'completed'),
  );

  completedJobs = computed(() =>
    this.sortedJobs().filter((j) => j.operationalStatus === 'completed'),
  );

  ngOnInit(): void {
    this.staffService.getDashboard().subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.loading.set(false);
      },
    });
  }

  toggleSort(): void {
    this.sortByTime.update((v) => !v);
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

  mapsLink(job: { address: string; city: string; postcode: string }): string {
    return mapsUrl(job);
  }

  whatsAppLink(phone: string): string {
    return whatsAppUrl(phone);
  }

  jobTimeStart(job: { scheduledTime: string }): string {
    return job.scheduledTime.split('–')[0]?.trim() ?? job.scheduledTime;
  }
}
