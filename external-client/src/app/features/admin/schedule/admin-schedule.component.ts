import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBooking, AdminScheduleSlot, AdminStaffMember } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [DatePipe, FormsModule, LoadingStateComponent, RouterLink, AppIconComponent],
  templateUrl: './admin-schedule.component.html',
  styleUrl: './admin-schedule.component.scss',
})
export class AdminScheduleComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  schedule = signal<AdminScheduleSlot[]>([]);
  bookings = signal<AdminBooking[]>([]);
  staff = signal<AdminStaffMember[]>([]);
  loading = signal(true);

  todayLabel = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  todayJobCount = computed(() =>
    this.schedule().reduce((sum, area) => sum + area.slots.length, 0),
  );

  unassignedCount = computed(
    () => this.bookings().filter((b) => b.status === 'upcoming' && !b.staffId).length,
  );

  onDutyCount = computed(() => this.staff().filter((s) => s.status === 'active').length);

  ngOnInit(): void {
    this.adminService.getScheduleSlots().subscribe({
      next: (s) => this.schedule.set(s),
    });
    this.adminService.getBookings().subscribe({
      next: (b) => {
        this.bookings.set(b);
        this.loading.set(false);
      },
    });
    this.adminService.getStaff().subscribe({
      next: (s) => this.staff.set(s),
    });
  }

  assignStaff(booking: AdminBooking, staffId: string): void {
    if (!staffId) return;
    const member = this.staff().find((s) => s.id === staffId);
    if (!member) return;
    this.adminService.assignStaff(booking.id, member.id, member.fullName).subscribe({
      next: (updated) => {
        if (!updated) return;
        this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
      },
    });
  }

  slotClass(status: string): string {
    return status;
  }

  bookingStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'pill-paid';
      case 'cancelled':
        return 'pill-overdue';
      case 'in_progress':
        return 'pill-due_soon';
      default:
        return 'pill-scheduled';
    }
  }

  donePill(completed: number): string {
    return completed > 0 ? 'pill-active' : 'pill-paused';
  }
}
