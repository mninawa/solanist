import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { StaffJob } from '../../../core/models/staff.models';
import { JobIssue, JobIssueType, JOB_ISSUE_LABELS } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-issues',
  standalone: true,
  imports: [RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './staff-issues.component.html',
  styleUrl: './staff-issues.component.scss',
})
export class StaffIssuesComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  issues = signal<StaffJob[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.staffService.getJobsWithIssues().subscribe({
      next: (jobs) => {
        this.issues.set(jobs);
        this.loading.set(false);
      },
    });
  }

  issueLabel(issue: JobIssue): string {
    return JOB_ISSUE_LABELS[issue.issueType];
  }
}
