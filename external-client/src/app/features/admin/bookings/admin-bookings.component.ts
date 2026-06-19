import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBooking, AdminStaffMember } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

type BookingStatus = AdminBooking['status'];

interface BookingKanbanColumn {
  status: BookingStatus;
  label: string;
  hint: string;
  accent: 'gold' | 'green' | 'red';
  icon: 'calendar' | 'check-circle' | 'pause';
}

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [DatePipe, LowerCasePipe, RouterLink, FormsModule, DragDropModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-bookings.component.html',
  styleUrl: './admin-bookings.component.scss',
})
export class AdminBookingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly columns: BookingKanbanColumn[] = [
    { status: 'upcoming', label: 'Upcoming', hint: 'Scheduled ahead', accent: 'gold', icon: 'calendar' },
    { status: 'completed', label: 'Completed', hint: 'Finished cleans', accent: 'green', icon: 'check-circle' },
    { status: 'cancelled', label: 'Cancelled', hint: 'Closed bookings', accent: 'red', icon: 'pause' },
  ];

  bookings = signal<AdminBooking[]>([]);
  staff = signal<AdminStaffMember[]>([]);
  loading = signal(true);
  assigningId = signal<string | null>(null);
  updatingId = signal<string | null>(null);

  upcomingCount = computed(() => this.bookings().filter((b) => b.status === 'upcoming').length);
  unassignedCount = computed(
    () => this.bookings().filter((b) => b.status === 'upcoming' && !b.staffId).length,
  );
  completedCount = computed(() => this.bookings().filter((b) => b.status === 'completed').length);

  ngOnInit(): void {
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

  columnBookings(status: BookingStatus): AdminBooking[] {
    const items = this.bookings().filter((b) => b.status === status);
    if (status !== 'upcoming') return items;

    return [...items].sort((a, b) => {
      const aUnassigned = a.staffId ? 1 : 0;
      const bUnassigned = b.staffId ? 1 : 0;
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned;
      return a.date.localeCompare(b.date);
    });
  }

  columnCount(status: BookingStatus): number {
    return this.columnBookings(status).length;
  }

  customerInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  isUnassigned(booking: AdminBooking): boolean {
    return booking.status === 'upcoming' && !booking.staffId;
  }

  assignStaff(booking: AdminBooking, staffId: string): void {
    if (!staffId) return;
    const member = this.staff().find((s) => s.id === staffId);
    if (!member) return;
    this.assigningId.set(booking.id);
    this.adminService.assignStaff(booking.id, member.id, member.fullName).subscribe({
      next: (updated) => {
        this.assigningId.set(null);
        if (!updated) return;
        this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
      },
      error: () => this.assigningId.set(null),
    });
  }

  dropBooking(event: CdkDragDrop<AdminBooking[]>, targetStatus: BookingStatus): void {
    const booking = event.item.data as AdminBooking;
    if (!booking?.id) return;

    const sourceStatus = booking.status;
    if (sourceStatus === targetStatus) return;

    this.updatingId.set(booking.id);
    this.bookings.update((list) =>
      list.map((b) => (b.id === booking.id ? { ...b, status: targetStatus } : b)),
    );

    this.adminService.updateBookingStatus(booking.id, targetStatus).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        if (updated) {
          this.bookings.update((list) => list.map((b) => (b.id === updated.id ? updated : b)));
        }
      },
      error: () => {
        this.updatingId.set(null);
        this.bookings.update((list) =>
          list.map((b) => (b.id === booking.id ? { ...b, status: sourceStatus } : b)),
        );
      },
    });
  }
}
