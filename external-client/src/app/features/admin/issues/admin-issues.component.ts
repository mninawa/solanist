import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { StaffJob } from '../../../core/models/staff.models';
import { JOB_ISSUE_LABELS, JobIssue } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-issues',
  standalone: true,
  imports: [LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-issues.component.html',
})
export class AdminIssuesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  issues = signal<StaffJob[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.adminService.getIssues().subscribe({
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
