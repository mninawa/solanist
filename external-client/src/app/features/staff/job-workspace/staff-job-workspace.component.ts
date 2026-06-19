import { Component, OnInit, inject, computed, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { StaffJobWorkspaceService } from './staff-job-workspace.service';
import { WORKFLOW_STEPS, isStepComplete, nextRouteLabel, formatBookingId, workflowRouteFromPath } from '../../../core/utils/staff-workflow-steps.util';
import { mapsUrl, whatsAppUrl } from '../../../core/utils/staff-workflow.util';
import { JOB_ISSUE_LABELS, JobIssueType } from '../../../core/models/staff.models';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-staff-job-workspace',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    DatePipe,
    FormsModule,
    AppIconComponent,
    LoadingStateComponent,
  ],
  providers: [StaffJobWorkspaceService],
  templateUrl: './staff-job-workspace.component.html',
  styleUrl: './staff-job-workspace.component.scss',
})
export class StaffJobWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly ws = inject(StaffJobWorkspaceService);

  readonly workflowSteps = WORKFLOW_STEPS;
  readonly issueOptions = Object.entries(JOB_ISSUE_LABELS) as [JobIssueType, string][];

  nextLabel = computed(() => nextRouteLabel(this.ws.workflowRoute()));

  ngOnInit(): void {
    const jobId = this.route.snapshot.paramMap.get('id') ?? '';
    const childPath = this.route.snapshot.firstChild?.url[0]?.path ?? '';
    this.ws.load(jobId, workflowRouteFromPath(childPath));

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const path = this.route.snapshot.firstChild?.url[0]?.path ?? '';
        this.ws.workflowRoute.set(workflowRouteFromPath(path));
        this.ws.refreshJob();
      });
  }

  stepState(stepId: typeof WORKFLOW_STEPS[number]['id']): 'done' | 'active' | 'pending' {
    const j = this.ws.job();
    if (!j) return 'pending';
    if (stepId === this.ws.activeStep()) return 'active';
    if (isStepComplete(j, stepId)) return 'done';
    return 'pending';
  }

  formatBookingId(id: string): string {
    return formatBookingId(id);
  }

  mapsLink(job: NonNullable<ReturnType<typeof this.ws.job>>): string {
    return mapsUrl(job);
  }

  whatsAppLink(phone: string): string {
    return whatsAppUrl(phone);
  }

  technicianName(): string {
    return this.ws.dashboard()?.staffName ?? 'Technician';
  }

  staffFirstName(): string {
    const d = this.ws.dashboard();
    return d?.staffName.split(' ')[0] ?? 'James';
  }

  remainingJobs(): number {
    return this.ws.dashboard()?.remainingCount ?? 0;
  }
}
