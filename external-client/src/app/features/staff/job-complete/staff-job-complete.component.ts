import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { StaffJobWorkspaceService } from '../job-workspace/staff-job-workspace.service';
import { StaffJob } from '../../../core/models/staff.models';
import { isChecklistComplete, kwhGain } from '../../../core/utils/staff-workflow.util';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-complete',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe, AppIconComponent],
  templateUrl: './staff-job-complete.component.html',
  styleUrl: './staff-job-complete.component.scss',
})
export class StaffJobCompleteComponent {
  readonly ws = inject(StaffJobWorkspaceService);

  checklistLabel = computed(() => {
    const j = this.ws.job();
    if (!j) return '—';
    const done = j.checklist.filter((c) => c.completed).length;
    return `${done}/${j.checklist.length}`;
  });

  duration = computed(() => {
    const j = this.ws.job();
    if (!j?.checkedInAt || !j.completedAt) return null;
    const mins = Math.round(
      (new Date(j.completedAt).getTime() - new Date(j.checkedInAt).getTime()) / 60000,
    );
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  });

  workflowSteps = computed(() => {
    const j = this.ws.job();
    if (!j) return [];
    const formatTime = (iso: string | null) =>
      iso
        ? new Date(iso).toLocaleString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : null;

    return [
      { label: 'Check In', done: !!j.checkedInAt, time: formatTime(j.checkedInAt) },
      { label: 'Before Photos', done: j.beforePhotos.length >= 3, time: j.beforePhotos.length ? 'Completed' : null },
      { label: 'Before kWh', done: j.beforeKwhReading != null, time: j.beforeKwhReading != null ? `${j.beforeKwhReading} kWh` : null },
      { label: 'Checklist', done: isChecklistComplete(j.checklist), time: isChecklistComplete(j.checklist) ? 'Completed' : null },
      { label: 'After Photos', done: j.afterPhotos.length >= 3, time: j.afterPhotos.length ? 'Completed' : null },
      { label: 'After kWh', done: j.afterKwhReading != null, time: j.afterKwhReading != null ? `${j.afterKwhReading} kWh` : null },
      { label: 'Notes', done: !!this.ws.jobNotes().trim(), time: null },
    ];
  });

  formatKwh(value: number | null): string {
    return value != null ? `${value} kWh` : '—';
  }

  kwhDelta(job: StaffJob): number | null {
    return kwhGain(job.beforeKwhReading, job.afterKwhReading);
  }
}
