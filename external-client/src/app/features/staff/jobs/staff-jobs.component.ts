import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StaffService } from '../../../core/services/staff.service';
import { StaffJobSummary } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-jobs',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingStateComponent, StatusChipComponent],
  templateUrl: './staff-jobs.component.html',
  styleUrl: './staff-jobs.component.scss',
})
export class StaffJobsComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  jobs = signal<StaffJobSummary[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.staffService.getJobs().subscribe({
      next: (j) => {
        this.jobs.set(j);
        this.loading.set(false);
      },
    });
  }
}
