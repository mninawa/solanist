import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../core/services/staff.service';
import { JobIssueType, JOB_ISSUE_LABELS } from '../../../core/models/staff.models';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-issue',
  standalone: true,
  imports: [FormsModule, RouterLink, AppIconComponent],
  templateUrl: './staff-job-issue.component.html',
  styleUrl: './staff-job-issue.component.scss',
})
export class StaffJobIssueComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly staffService = inject(StaffService);

  jobId = this.route.parent?.snapshot.paramMap.get('id') ?? '';
  issueTypes = Object.entries(JOB_ISSUE_LABELS) as [JobIssueType, string][];
  selectedType = signal<JobIssueType>('no_access');
  description = signal('');
  submitting = signal(false);
  propertyName = signal('');

  ngOnInit(): void {
    this.staffService.getJob(this.jobId).subscribe({
      next: (j) => {
        if (j) this.propertyName.set(j.address);
      },
    });
  }

  submit(): void {
    if (!this.description().trim()) return;
    this.submitting.set(true);
    this.staffService.reportIssue(this.jobId, this.selectedType(), this.description()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/staff/jobs', this.jobId]);
      },
    });
  }
}
