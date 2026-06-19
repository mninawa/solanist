import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { StaffDashboard, StaffJob, JobIssueType } from '../../../core/models/staff.models';
import { MIN_AFTER_PHOTOS, MIN_BEFORE_PHOTOS } from '../../../core/models/staff.models';
import {
  deriveOperationalStatus,
  isChecklistComplete,
  isValidKwhReading,
  validateJobCompletion,
} from '../../../core/utils/staff-workflow.util';
import {
  activeStepId,
  isStepComplete,
  nextRoutePath,
  WorkflowRoute,
} from '../../../core/utils/staff-workflow-steps.util';

@Injectable()
export class StaffJobWorkspaceService {
  private readonly staffService = inject(StaffService);
  private readonly router = inject(Router);

  jobId = signal('');
  job = signal<StaffJob | null>(null);
  dashboard = signal<StaffDashboard | null>(null);
  loading = signal(true);
  workflowRoute = signal<WorkflowRoute>('');
  checklistDraft = signal<StaffJob['checklist']>([]);
  jobNotes = signal('');
  issueType = signal<JobIssueType | 'none'>('none');
  issueDetails = signal('');
  issueFollowUp = signal(false);
  proceeding = signal(false);

  activeStep = computed(() => activeStepId(this.workflowRoute()));

  isWorkflowView = computed(() => {
    const r = this.workflowRoute();
    return r !== '' && r !== 'issue';
  });

  canProceed = computed(() => {
    const j = this.job();
    const route = this.workflowRoute();
    if (!j) return false;
    switch (route) {
      case 'check-in':
        return !!j.checkedInAt;
      case 'before-photos':
        return j.beforePhotos.length >= MIN_BEFORE_PHOTOS && isValidKwhReading(j.beforeKwhReading);
      case 'checklist':
        return isChecklistComplete(this.checklistDraft());
      case 'after-photos':
        return j.afterPhotos.length >= MIN_AFTER_PHOTOS && isValidKwhReading(j.afterKwhReading);
      case 'complete':
        const withNotes = { ...j, completionNotes: this.jobNotes() };
        return validateJobCompletion(withNotes).canComplete;
      default:
        return false;
    }
  });

  load(jobId: string, route: WorkflowRoute): void {
    this.jobId.set(jobId);
    this.workflowRoute.set(route);
    this.loading.set(true);
    this.staffService.getDashboard().subscribe({
      next: (d) => this.dashboard.set(d),
    });
    this.staffService.getJob(jobId).subscribe({
      next: (j) => {
        if (j) {
          this.job.set(j);
          this.checklistDraft.set(j.checklist.map((c) => ({ ...c })));
          this.jobNotes.set(j.completionNotes ?? j.checkInNote ?? '');
        }
        this.loading.set(false);
      },
    });
  }

  refreshJob(): void {
    const id = this.jobId();
    if (!id) return;
    this.staffService.getJob(id).subscribe({
      next: (j) => {
        if (j) {
          this.job.set(j);
          this.checklistDraft.set(j.checklist.map((c) => ({ ...c })));
        }
      },
    });
  }

  setChecklistDraft(items: StaffJob['checklist']): void {
    this.checklistDraft.set(items);
  }

  saveAndExit(): void {
    const id = this.jobId();
    const notes = this.jobNotes().trim();
    if (notes) {
      this.staffService.updateNotes(id, notes).subscribe();
    }
    const route = this.workflowRoute();
    if (route === 'checklist') {
      this.staffService.updateChecklist(id, this.checklistDraft()).subscribe({
        next: () => this.router.navigate(['/staff/dashboard']),
      });
      return;
    }
    this.router.navigate(['/staff/dashboard']);
  }

  proceed(): void {
    const id = this.jobId();
    const route = this.workflowRoute();
    if (!this.canProceed()) return;
    this.proceeding.set(true);

    const navigateNext = () => {
      const path = nextRoutePath(id, route);
      this.proceeding.set(false);
      if (path) this.router.navigateByUrl(path);
      else if (route === 'complete') this.completeJob();
    };

    const notes = this.jobNotes().trim();
    if (notes) {
      this.staffService.updateNotes(id, notes).subscribe();
    }

    if (route === 'checklist') {
      this.staffService.updateChecklist(id, this.checklistDraft()).subscribe({
        next: (j) => {
          if (j) this.job.set(j);
          navigateNext();
        },
      });
      return;
    }

    if (route === 'complete') {
      this.completeJob();
      return;
    }

    navigateNext();
  }

  completeJob(): void {
    const id = this.jobId();
    this.staffService.completeJob(id, this.jobNotes()).subscribe({
      next: (j) => {
        this.proceeding.set(false);
        if (j) this.job.set(j);
      },
    });
  }

  inProgressLabel(): string {
    const j = this.job();
    if (!j) return 'Assigned';
    const status = deriveOperationalStatus(j);
    if (status === 'completed') return 'Completed';
    if (j.checkedInAt) return 'In Progress';
    if (status === 'issue_reported') return 'Issue Reported';
    return 'Assigned';
  }
}
