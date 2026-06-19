import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { AdminService } from '../../../core/services/admin.service';
import {
  StaffJob,
  StaffJobSummary,
  StaffOperationalStatus,
  OPERATIONAL_STATUS_LABELS,
  JOB_ISSUE_LABELS,
  JobIssue,
} from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

type KanbanAccent = 'gold' | 'blue' | 'purple' | 'red' | 'green';

interface JobKanbanColumn {
  id: string;
  label: string;
  hint: string;
  accent: KanbanAccent;
  icon: 'calendar' | 'schedule' | 'sun' | 'shield' | 'check-circle' | 'pause';
  statuses: StaffOperationalStatus[];
  targetStatus: StaffOperationalStatus;
}

@Component({
  selector: 'app-admin-jobs',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, NgClass, RouterLink, DragDropModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-jobs.component.html',
  styleUrl: './admin-jobs.component.scss',
})
export class AdminJobsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly columns: JobKanbanColumn[] = [
    {
      id: 'assigned',
      label: 'Assigned',
      hint: 'Waiting to start',
      accent: 'gold',
      icon: 'calendar',
      statuses: ['assigned'],
      targetStatus: 'assigned',
    },
    {
      id: 'en-route',
      label: 'En route',
      hint: 'Travelling to site',
      accent: 'blue',
      icon: 'schedule',
      statuses: ['on_the_way', 'arrived'],
      targetStatus: 'on_the_way',
    },
    {
      id: 'in-progress',
      label: 'In progress',
      hint: 'On-site workflow',
      accent: 'purple',
      icon: 'sun',
      statuses: [
        'checked_in',
        'before_photos_required',
        'cleaning_in_progress',
        'checklist_required',
        'after_photos_required',
        'ready_to_complete',
      ],
      targetStatus: 'checked_in',
    },
    {
      id: 'issues',
      label: 'Issues',
      hint: 'Needs attention',
      accent: 'red',
      icon: 'shield',
      statuses: ['issue_reported'],
      targetStatus: 'issue_reported',
    },
    {
      id: 'completed',
      label: 'Completed',
      hint: 'Finished today',
      accent: 'green',
      icon: 'check-circle',
      statuses: ['completed'],
      targetStatus: 'completed',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      hint: 'Closed jobs',
      accent: 'red',
      icon: 'pause',
      statuses: ['cancelled'],
      targetStatus: 'cancelled',
    },
  ];

  jobs = signal<StaffJobSummary[]>([]);
  issueJobs = signal<StaffJob[]>([]);
  selectedIssue = signal<StaffJob | null>(null);
  loading = signal(true);
  updatingId = signal<string | null>(null);
  issueDrawerLoading = signal(false);

  todayLabel = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  activeCount = computed(
    () =>
      this.jobs().filter(
        (j) => j.operationalStatus !== 'completed' && j.operationalStatus !== 'cancelled',
      ).length,
  );
  completedCount = computed(() => this.jobs().filter((j) => j.operationalStatus === 'completed').length);
  issueCount = computed(() => this.jobs().filter((j) => j.operationalStatus === 'issue_reported').length);

  visibleColumns = computed(() =>
    this.columns.filter(
      (col) => col.id !== 'cancelled' || this.columnJobs(col).length > 0,
    ),
  );

  ngOnInit(): void {
    this.adminService.getJobs().subscribe({
      next: (j) => {
        this.jobs.set(j.sort((a, b) => a.routeOrder - b.routeOrder));
        this.loading.set(false);
      },
    });
    this.adminService.getIssues().subscribe({
      next: (jobs) => this.issueJobs.set(jobs),
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selectedIssue()) this.closeIssueDrawer();
  }

  columnJobs(column: JobKanbanColumn): StaffJobSummary[] {
    return this.jobs()
      .filter((j) => column.statuses.includes(j.operationalStatus))
      .sort((a, b) => a.routeOrder - b.routeOrder);
  }

  statusLabel(status: StaffOperationalStatus): string {
    return OPERATIONAL_STATUS_LABELS[status] ?? status;
  }

  customerInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusAccent(status: StaffOperationalStatus): KanbanAccent {
    if (status === 'completed') return 'green';
    if (status === 'issue_reported' || status === 'cancelled') return 'red';
    if (status === 'assigned') return 'gold';
    if (status === 'on_the_way' || status === 'arrived') return 'blue';
    return 'purple';
  }

  issueLabel(issue: JobIssue): string {
    return JOB_ISSUE_LABELS[issue.issueType];
  }

  openIssueDrawer(jobId: string): void {
    const cached = this.issueJobs().find((j) => j.id === jobId);
    if (cached?.issue) {
      this.selectedIssue.set(cached);
      return;
    }

    this.issueDrawerLoading.set(true);
    this.adminService.getIssues().subscribe({
      next: (jobs) => {
        this.issueJobs.set(jobs);
        this.selectedIssue.set(jobs.find((j) => j.id === jobId) ?? null);
        this.issueDrawerLoading.set(false);
      },
      error: () => this.issueDrawerLoading.set(false),
    });
  }

  closeIssueDrawer(): void {
    this.selectedIssue.set(null);
  }

  dropJob(event: CdkDragDrop<StaffJobSummary[]>, column: JobKanbanColumn): void {
    const job = event.item.data as StaffJobSummary;
    if (!job?.id) return;

    const sourceStatus = job.operationalStatus;
    if (column.statuses.includes(sourceStatus)) return;

    const targetStatus = column.targetStatus;
    this.updatingId.set(job.id);
    this.jobs.update((list) =>
      list.map((j) => (j.id === job.id ? { ...j, operationalStatus: targetStatus } : j)),
    );

    this.adminService.updateJobStatus(job.id, targetStatus).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        if (updated) {
          this.jobs.update((list) => list.map((j) => (j.id === updated.id ? updated : j)));
          if (updated.operationalStatus === 'issue_reported') {
            this.adminService.getIssues().subscribe({
              next: (jobs) => this.issueJobs.set(jobs),
            });
          }
        }
      },
      error: () => {
        this.updatingId.set(null);
        this.jobs.update((list) =>
          list.map((j) => (j.id === job.id ? { ...j, operationalStatus: sourceStatus } : j)),
        );
      },
    });
  }
}
