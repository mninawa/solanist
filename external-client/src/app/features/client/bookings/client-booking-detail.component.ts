import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { Booking } from '../../../core/models/client.models';
import { BOOKING_INCLUDES } from '../../../core/content/client-content';
import { APP_CONFIG } from '../../../core/config/app-config';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientBookingRescheduleComponent } from './client-booking-reschedule.component';

@Component({
  selector: 'app-client-booking-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    LoadingStateComponent,
    AppIconComponent,
    ClientBookingRescheduleComponent,
  ],
  templateUrl: './client-booking-detail.component.html',
  styleUrl: './client-booking-detail.component.scss',
})
export class ClientBookingDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);

  readonly config = APP_CONFIG;
  readonly includes = BOOKING_INCLUDES;

  booking = signal<Booking | null>(null);
  loading = signal(true);
  rescheduleOpen = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.clientService.getBooking(id).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.loading.set(false);
      },
    });
  }

  openReschedule(): void {
    this.rescheduleOpen.set(true);
  }

  closeReschedule(): void {
    this.rescheduleOpen.set(false);
  }

  onRescheduled(updated: Booking): void {
    this.booking.set(updated);
    this.closeReschedule();
  }

  propertyName(b: Booking): string {
    return b.propertyAddress.split(',')[0]?.trim() ?? b.propertyAddress;
  }

  propertyCity(b: Booking): string {
    const parts = b.propertyAddress.split(',');
    return parts.slice(1).join(',').trim();
  }
}
