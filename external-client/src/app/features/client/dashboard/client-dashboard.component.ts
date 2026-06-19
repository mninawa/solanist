import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import {
  Booking,
  ClientDashboard,
  CleaningReportSummary,
  PropertySummary,
} from '../../../core/models/client.models';
import { daysUntilDate } from '../../../core/utils/booking-calendar.util';
import { APP_CONFIG } from '../../../core/config/app-config';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientBookingRescheduleComponent } from '../bookings/client-booking-reschedule.component';

const EXPECT_CHECKLIST = [
  'Technician arrives within your time window',
  'Visual inspection before cleaning begins',
  'Before & after photos taken',
  'Cleaning report sent after completion',
];

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    UpperCasePipe,
    LoadingStateComponent,
    AppIconComponent,
    ClientBookingRescheduleComponent,
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss',
})
export class ClientDashboardComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  readonly config = APP_CONFIG;
  readonly expectChecklist = EXPECT_CHECKLIST;

  dashboard = signal<ClientDashboard | null>(null);
  properties = signal<PropertySummary[]>([]);
  bookings = signal<Booking[]>([]);
  recentReports = signal<CleaningReportSummary[]>([]);
  loading = signal(true);
  selectedPropertyId = signal<string | null>(null);
  rescheduleBookingId = signal<string | null>(null);
  imageErrors = signal<Set<string>>(new Set());

  selectedProperty = computed(() => {
    const id = this.selectedPropertyId();
    return this.properties().find((p) => p.id === id) ?? this.properties()[0] ?? null;
  });

  upcomingBooking = computed(() => {
    const prop = this.selectedProperty();
    if (!prop) return null;
    return (
      this.bookings()
        .filter((b) => b.status === 'upcoming' && b.propertyId === prop.id)
        .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
    );
  });

  visitsUsed = computed(() => {
    const prop = this.selectedProperty();
    if (!prop?.visitsPerYear || prop.visitsRemaining === undefined) return 0;
    return prop.visitsPerYear - prop.visitsRemaining;
  });

  ngOnInit(): void {
    this.clientService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
    });
    this.clientService.getProperties().subscribe({
      next: (props) => {
        this.properties.set(props);
        const primary = props.find((p) => p.isPrimary) ?? props[0];
        if (primary) this.selectedPropertyId.set(primary.id);
      },
    });
    this.clientService.getBookings().subscribe({
      next: (bookings) => this.bookings.set(bookings),
    });
    this.clientService.getReports().subscribe({
      next: (reports) => this.recentReports.set(reports.slice(0, 3)),
    });
  }

  selectProperty(id: string): void {
    this.selectedPropertyId.set(id);
  }

  openReschedule(): void {
    const booking = this.upcomingBooking();
    if (booking) this.rescheduleBookingId.set(booking.id);
  }

  closeReschedule(): void {
    this.rescheduleBookingId.set(null);
  }

  onRescheduled(booking: Booking): void {
    this.bookings.update((list) => list.map((b) => (b.id === booking.id ? booking : b)));
    this.closeReschedule();
  }

  formatPanelCount(count: number): string {
    return count >= 1000 ? count.toLocaleString('en-ZA') : String(count);
  }

  daysUntil(date: string): number {
    return daysUntilDate(date);
  }

  onImageError(id: string): void {
    this.imageErrors.update((set) => new Set(set).add(id));
  }

  hasImageError(id: string): boolean {
    return this.imageErrors().has(id);
  }
}
