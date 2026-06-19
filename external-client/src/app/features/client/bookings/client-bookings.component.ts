import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { Booking, PropertySummary } from '../../../core/models/client.models';
import { BOOKING_EXPECT_SIDEBAR } from '../../../core/content/client-content';
import { APP_CONFIG } from '../../../core/config/app-config';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientBookCleanComponent } from '../book-clean/client-book-clean.component';
import { ClientBookingRescheduleComponent } from './client-booking-reschedule.component';

type BookingTab = 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-client-bookings',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    LoadingStateComponent,
    EmptyStateComponent,
    AppIconComponent,
    ClientBookCleanComponent,
    ClientBookingRescheduleComponent,
  ],
  templateUrl: './client-bookings.component.html',
  styleUrl: './client-bookings.component.scss',
})
export class ClientBookingsComponent implements OnInit {
  private readonly clientService = inject(ClientService);

  readonly config = APP_CONFIG;
  readonly expectItems = BOOKING_EXPECT_SIDEBAR;

  allBookings = signal<Booking[]>([]);
  properties = signal<PropertySummary[]>([]);
  visitsRemaining = signal(3);
  loading = signal(true);
  activeTab = signal<BookingTab>('upcoming');
  bookCleanOpen = signal(false);
  rescheduleBookingId = signal<string | null>(null);

  filteredBookings = computed(() => {
    const tab = this.activeTab();
    return this.allBookings().filter((b) => {
      if (tab === 'upcoming') return b.status === 'upcoming';
      if (tab === 'past') return b.status === 'completed';
      return b.status === 'cancelled';
    });
  });

  nextBooking = computed(() => {
    const upcoming = this.allBookings()
      .filter((b) => b.status === 'upcoming')
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  });

  pendingCount = computed(
    () => this.allBookings().filter((b) => b.status === 'upcoming' && b.confirmationStatus === 'scheduled').length,
  );

  ngOnInit(): void {
    this.clientService.getBookings().subscribe({
      next: (data) => {
        this.allBookings.set(data);
        this.loading.set(false);
      },
    });
    this.clientService.getProperties().subscribe({
      next: (props) => this.properties.set(props),
    });
    this.clientService.getSubscription().subscribe({
      next: (sub) => this.visitsRemaining.set(sub.visitsRemaining),
    });
  }

  setTab(tab: BookingTab): void {
    this.activeTab.set(tab);
  }

  openBookClean(): void {
    this.bookCleanOpen.set(true);
  }

  closeBookClean(): void {
    this.bookCleanOpen.set(false);
  }

  openReschedule(bookingId: string): void {
    this.rescheduleBookingId.set(bookingId);
  }

  closeReschedule(): void {
    this.rescheduleBookingId.set(null);
  }

  onBookingCreated(booking: Booking): void {
    this.allBookings.update((list) => [booking, ...list]);
    this.activeTab.set('upcoming');
  }

  onBookingRescheduled(booking: Booking): void {
    this.allBookings.update((list) => list.map((b) => (b.id === booking.id ? booking : b)));
    this.closeReschedule();
  }

  statusLabel(booking: Booking): string {
    if (booking.confirmationStatus === 'confirmed') return 'Confirmed';
    return 'Scheduled';
  }

  statusClass(booking: Booking): string {
    return booking.confirmationStatus === 'confirmed' ? 'status-confirmed' : 'status-scheduled';
  }
}
