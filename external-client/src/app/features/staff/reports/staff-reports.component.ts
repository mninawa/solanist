import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StaffService } from '../../../core/services/staff.service';
import { StaffJobSummary } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-reports',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingStateComponent, AppIconComponent],
  templateUrl: './staff-reports.component.html',
  styleUrl: './staff-reports.component.scss',
})
export class StaffReportsComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  reports = signal<StaffJobSummary[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.staffService.getCompletedJobs().subscribe({
      next: (jobs) => {
        this.reports.set(jobs);
        this.loading.set(false);
      },
    });
  }
}
