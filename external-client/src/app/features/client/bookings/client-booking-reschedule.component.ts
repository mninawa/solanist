import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Booking } from '../../../core/models/client.models';
import { BOOKING_TIME_WINDOWS } from '../../../core/content/client-content';
import {
  buildBookingCalendarMonth,
  firstAvailableBookingDate,
} from '../../../core/utils/booking-calendar.util';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

interface CalendarDay {
  day: number | null;
  dateKey: string | null;
  available: boolean;
  isCurrent: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-client-booking-reschedule',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, AppIconComponent, LoadingStateComponent],
  templateUrl: './client-booking-reschedule.component.html',
  styleUrl: './client-booking-reschedule.component.scss',
})
export class ClientBookingRescheduleComponent {
  private readonly clientService = inject(ClientService);
  private readonly drawerBody = viewChild<ElementRef>('drawerBody');

  readonly open = input(false);
  readonly bookingId = input<string | null>(null);
  readonly closed = output<void>();
  readonly rescheduled = output<Booking>();

  readonly timeWindows = BOOKING_TIME_WINDOWS;

  booking = signal<Booking | null>(null);
  loading = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);
  selectedDate = signal('');
  selectedTimeWindow = signal('midday');
  notes = '';

  selectedTimeLabel = computed(() => {
    const slot = this.timeWindows.find((w) => w.id === this.selectedTimeWindow());
    return slot ? `${slot.label} (${slot.time})` : '';
  });

  calendarMonth = computed(() => buildBookingCalendarMonth(0, 3));

  calendarDays = computed(() => {
    const current = this.booking()?.date ?? '';
    const selected = this.selectedDate();
    return this.calendarMonth().days.map((cell) => ({
      ...cell,
      isCurrent: cell.dateKey === current,
      isSelected: cell.dateKey === selected,
    }));
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        document.body.style.overflow = 'hidden';
        this.loadBooking();
      } else {
        document.body.style.overflow = '';
        this.reset();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  loadBooking(): void {
    const id = this.bookingId();
    if (!id) return;
    this.loading.set(true);
    this.clientService.getBooking(id).subscribe({
      next: (b) => {
        this.booking.set(b);
        this.selectedDate.set(firstAvailableBookingDate(3));
        this.selectedTimeWindow.set('midday');
        this.loading.set(false);
      },
    });
  }

  reset(): void {
    this.booking.set(null);
    this.submitting.set(false);
    this.submitError.set(null);
    this.notes = '';
  }

  close(): void {
    this.closed.emit();
  }

  selectCalendarDay(cell: CalendarDay): void {
    if (!cell.available || !cell.dateKey) return;
    this.selectedDate.set(cell.dateKey);
  }

  confirmReschedule(): void {
    const b = this.booking();
    if (!b || !this.selectedDate()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.clientService
      .rescheduleBooking({
        bookingId: b.id,
        date: this.selectedDate(),
        timeSlot: this.selectedTimeLabel(),
        notes: this.notes,
      })
      .subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.rescheduled.emit(updated);
        },
        error: () => {
          this.submitError.set('Could not reschedule. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  propertyName(b: Booking): string {
    return b.propertyAddress.split(',')[0]?.trim() ?? b.propertyAddress;
  }
}
