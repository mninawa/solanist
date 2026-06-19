import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { StaffJobWorkspaceService } from '../job-workspace/staff-job-workspace.service';
import { StaffService } from '../../../core/services/staff.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-check-in',
  standalone: true,
  imports: [DatePipe, AppIconComponent],
  templateUrl: './staff-job-check-in.component.html',
  styleUrl: './staff-job-check-in.component.scss',
})
export class StaffJobCheckInComponent {
  readonly ws = inject(StaffJobWorkspaceService);
  private readonly staffService = inject(StaffService);

  checkingIn = signal(false);

  checkIn(): void {
    const id = this.ws.jobId();
    this.checkingIn.set(true);
    this.staffService.checkIn(id).subscribe({
      next: (j) => {
        if (j) this.ws.job.set(j);
        this.checkingIn.set(false);
      },
    });
  }
}
