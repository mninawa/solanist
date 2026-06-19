import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { StaffService } from '../../../core/services/staff.service';
import { StaffJobSummary } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

interface ScheduleDay {
  date: string;
  isToday: boolean;
  jobs: StaffJobSummary[];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

@Component({
  selector: 'app-staff-schedule',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    LoadingStateComponent,
    StatusChipComponent,
    EmptyStateComponent,
    AppIconComponent,
  ],
  templateUrl: './staff-schedule.component.html',
  styleUrl: './staff-schedule.component.scss',
})
export class StaffScheduleComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  weekStart = signal(startOfWeek(new Date()));
  scheduleDays = signal<ScheduleDay[]>([]);
  loading = signal(true);

  weekLabel = computed(() => {
    const start = this.weekStart();
    const end = addDays(start, 6);
    const fmt = new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short' });
    const yearFmt = new Intl.DateTimeFormat('en-ZA', { month: 'short', year: 'numeric' });
    if (start.getMonth() === end.getMonth()) {
      return `${fmt.format(start)} – ${end.getDate()}, ${yearFmt.format(end)}`;
    }
    return `${fmt.format(start)} – ${fmt.format(end)}, ${end.getFullYear()}`;
  });

  isCurrentWeek = computed(() => sameDay(this.weekStart(), startOfWeek(new Date())));

  totalJobs = computed(() => this.scheduleDays().reduce((sum, day) => sum + day.jobs.length, 0));

  ngOnInit(): void {
    this.loadWeek();
  }

  prevWeek(): void {
    this.weekStart.update((d) => addDays(d, -7));
    this.loadWeek();
  }

  nextWeek(): void {
    this.weekStart.update((d) => addDays(d, 7));
    this.loadWeek();
  }

  goToThisWeek(): void {
    this.weekStart.set(startOfWeek(new Date()));
    this.loadWeek();
  }

  private loadWeek(): void {
    this.loading.set(true);
    const from = toYmd(this.weekStart());
    const to = toYmd(addDays(this.weekStart(), 6));
    const today = toYmd(new Date());

    this.staffService.getSchedule(from, to).subscribe({
      next: (jobs) => {
        const byDate = new Map<string, StaffJobSummary[]>();
        for (const job of jobs) {
          const list = byDate.get(job.scheduledDate) ?? [];
          list.push(job);
          byDate.set(job.scheduledDate, list);
        }

        const days: ScheduleDay[] = [];
        for (let i = 0; i < 7; i++) {
          const date = toYmd(addDays(this.weekStart(), i));
          const dayJobs = (byDate.get(date) ?? []).sort((a, b) =>
            a.scheduledTime.localeCompare(b.scheduledTime),
          );
          days.push({ date, isToday: date === today, jobs: dayJobs });
        }

        this.scheduleDays.set(days);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
