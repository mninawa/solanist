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
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Booking, PropertySummary } from '../../../core/models/client.models';
import {
  BOOKING_INCLUDES,
  BOOKING_TIME_WINDOWS,
} from '../../../core/content/client-content';
import {
  buildBookingCalendarMonth,
  firstAvailableBookingDate,
} from '../../../core/utils/booking-calendar.util';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

interface CalendarDay {
  day: number | null;
  dateKey: string | null;
  available: boolean;
}

@Component({
  selector: 'app-client-book-clean',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    AppIconComponent,
    LoadingStateComponent,
  ],
  templateUrl: './client-book-clean.component.html',
  styleUrl: './client-book-clean.component.scss',
})
export class ClientBookCleanComponent {
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly drawerBody = viewChild<ElementRef>('drawerBody');

  readonly open = input(false);
  /** When provided, the drawer pre-selects this property and skips the property step. */
  readonly initialPropertyId = input<string | null>(null);
  readonly closed = output<void>();
  readonly bookingCreated = output<Booking>();

  readonly config = APP_CONFIG;
  readonly timeWindows = BOOKING_TIME_WINDOWS;
  readonly bookingIncludes = BOOKING_INCLUDES;
  readonly stepLabels = ['Property', 'Service', 'Date', 'Confirm'];
  extraCleanPrice = signal(499);

  properties = signal<PropertySummary[]>([]);
  loading = signal(false);
  step = signal(1);
  completed = signal(false);
  submitting = signal(false);
  submitError = signal<string | null>(null);

  selectedPropertyId = signal<string | null>(null);
  cleaningType = signal<'subscription' | 'extra'>('subscription');
  selectedDate = signal('');
  selectedTimeWindow = signal('midday');
  specialInstructions = '';

  showExistingModal = signal(false);
  existingBooking = signal<Booking | null>(null);
  createdBooking = signal<Booking | null>(null);

  selectedProperty = computed(
    () => this.properties().find((p) => p.id === this.selectedPropertyId()) ?? null,
  );

  selectedTimeLabel = computed(() => {
    const slot = this.timeWindows.find((w) => w.id === this.selectedTimeWindow());
    return slot ? `${slot.label} (${slot.time})` : '';
  });

  calendarMonth = computed(() => buildBookingCalendarMonth(0, 3));

  calendarDays = computed(() => this.calendarMonth().days);

  constructor() {
    effect(() => {
      if (this.open()) {
        document.body.style.overflow = 'hidden';
        this.loadProperties();
      } else {
        document.body.style.overflow = '';
        this.reset();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open() && !this.showExistingModal()) {
      this.close();
    }
  }

  loadProperties(): void {
    this.loading.set(true);
    this.clientService.getProperties().subscribe({
      next: (properties) => {
        this.properties.set(properties);
        const initial = this.initialPropertyId();
        const preselected = initial
          ? (properties.find((p) => p.id === initial) ?? null)
          : null;
        const primary = preselected ?? properties.find((p) => p.isPrimary) ?? properties[0];
        if (primary) this.selectedPropertyId.set(primary.id);
        this.loading.set(false);
        // Skip the property-picker step when the caller pre-selected one
        if (preselected) this.continueFromProperty();
      },
    });
    this.clientService.getSubscription().subscribe({
      next: (sub) => this.extraCleanPrice.set(sub.pricePerVisit),
    });
  }

  /** True when the drawer was opened pre-locked to a specific property. */
  readonly isLockedToProperty = computed(() => !!this.initialPropertyId());

  reset(): void {
    this.step.set(1);
    this.completed.set(false);
    this.submitting.set(false);
    this.submitError.set(null);
    this.cleaningType.set('subscription');
    this.selectedDate.set('');
    this.selectedTimeWindow.set('midday');
    this.specialInstructions = '';
    this.showExistingModal.set(false);
    this.existingBooking.set(null);
    this.createdBooking.set(null);
  }

  close(): void {
    this.closed.emit();
  }

  selectProperty(id: string): void {
    this.selectedPropertyId.set(id);
  }

  continueFromProperty(): void {
    const id = this.selectedPropertyId();
    if (!id) return;
    this.clientService.getUpcomingBookingForProperty(id).subscribe({
      next: (booking) => {
        if (booking) {
          this.existingBooking.set(booking);
          this.showExistingModal.set(true);
        } else {
          this.goToStep(2);
        }
      },
    });
  }

  proceedDespiteExisting(): void {
    this.showExistingModal.set(false);
    this.goToStep(2);
  }

  closeExistingModal(): void {
    this.showExistingModal.set(false);
  }

  goToStep(n: number): void {
    this.step.set(n);
    this.drawerBody()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }

  back(): void {
    if (this.completed()) {
      this.close();
      return;
    }
    const current = this.step();
    // When locked to a property, don't allow going back to the property picker.
    const minStep = this.isLockedToProperty() ? 2 : 1;
    if (current > minStep) this.goToStep(current - 1);
    else this.close();
  }

  continueFromService(): void {
    const prop = this.selectedProperty();
    if (!prop) return;
    if (prop.subscriptionStatus !== 'active') {
      this.cleaningType.set('extra');
    }
    this.goToStep(3);
    if (!this.selectedDate()) {
      this.selectedDate.set(firstAvailableBookingDate(3));
    }
  }

  continueFromDate(): void {
    if (!this.selectedDate() || !this.selectedTimeWindow()) return;
    this.goToStep(4);
  }

  confirmBooking(): void {
    const prop = this.selectedProperty();
    if (!prop || !this.selectedDate()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.clientService
      .submitBookingRequest({
        propertyId: prop.id,
        date: this.selectedDate(),
        timeSlot: this.selectedTimeLabel(),
        cleaningType: this.cleaningType(),
        specialInstructions: this.specialInstructions,
      })
      .subscribe({
        next: (booking) => {
          this.createdBooking.set(booking);
          this.completed.set(true);
          this.submitting.set(false);
          this.bookingCreated.emit(booking);
          this.drawerBody()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: () => {
          this.submitError.set('Could not submit your booking. Please try again.');
          this.submitting.set(false);
        },
      });
  }

  rescheduleExisting(): void {
    const existing = this.existingBooking();
    if (!existing) return;
    this.close();
    this.router.navigate(['/client/bookings', existing.id]);
  }

  selectCalendarDay(cell: CalendarDay): void {
    if (!cell.available || !cell.dateKey) return;
    this.selectedDate.set(cell.dateKey);
  }

  formatPanelCount(count: number): string {
    return count >= 1000 ? count.toLocaleString('en-ZA') : String(count);
  }

  planBadgeClass(variant?: string): string {
    if (variant === 'purple') return 'badge-plan-purple';
    if (variant === 'blue') return 'badge-plan-blue';
    return 'badge-plan-neutral';
  }
}
