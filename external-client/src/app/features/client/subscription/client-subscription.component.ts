import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { PaystackService } from '../../../core/services/paystack.service';
import { Booking, Payment, PropertySummary, SubscriptionPortfolio, BillingMode } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientBookingRescheduleComponent } from '../bookings/client-booking-reschedule.component';
import { fallbackPropertyImage } from '../../../core/util/property-image';

@Component({
  selector: 'app-client-subscription',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    LoadingStateComponent,
    AppIconComponent,
    ClientBookingRescheduleComponent,
  ],
  templateUrl: './client-subscription.component.html',
  styleUrl: './client-subscription.component.scss',
})
export class ClientSubscriptionComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly paystack = inject(PaystackService);

  properties = signal<PropertySummary[]>([]);
  portfolio = signal<SubscriptionPortfolio | null>(null);
  payments = signal<Payment[]>([]);
  loading = signal(true);
  rescheduleBookingId = signal<string | null>(null);
  paystackEnabled = signal(false);
  checkoutLoading = signal<string | null>(null);
  checkoutError = signal<string | null>(null);
  private readonly imageErrors = signal<Set<string>>(new Set());

  activeProperties = computed(() =>
    this.properties().filter((p) => p.subscriptionStatus === 'active'),
  );

  setupRequiredProperties = computed(() =>
    this.properties().filter((p) => p.subscriptionStatus === 'setup_required'),
  );

  nextClean = computed(() => {
    const withDates = this.activeProperties()
      .filter((p) => p.nextCleanDate)
      .sort((a, b) => (a.nextCleanDate ?? '').localeCompare(b.nextCleanDate ?? ''));
    return withDates[0] ?? null;
  });

  invoiceDotClass = ['dot-blue', 'dot-green', 'dot-orange'];

  ngOnInit(): void {
    this.paystack.getConfig().subscribe({
      next: (cfg) => this.paystackEnabled.set(cfg.enabled),
    });

    this.clientService.getSubscriptionPortfolio().subscribe({
      next: ({ properties, portfolio, payments }) => {
        this.properties.set(properties);
        this.portfolio.set(portfolio);
        this.payments.set(payments);
        this.loading.set(false);
      },
    });
  }

  setBillingMode(mode: BillingMode): void {
    this.clientService.setBillingMode(mode).subscribe({
      next: (updated) => {
        this.portfolio.update((p) => (p ? { ...p, billingMode: updated } : p));
      },
    });
  }

  openReschedule(propertyId: string): void {
    this.clientService.getUpcomingBookingForPropertyId(propertyId).subscribe({
      next: (booking) => {
        if (booking) this.rescheduleBookingId.set(booking.id);
      },
    });
  }

  closeReschedule(): void {
    this.rescheduleBookingId.set(null);
  }

  displayImage(prop: PropertySummary): string {
    if (prop.imageUrl && !this.imageErrors().has(prop.id)) return prop.imageUrl;
    return fallbackPropertyImage(prop.id);
  }

  onImageError(id: string): void {
    this.imageErrors.update((set) => new Set(set).add(id));
  }

  cityLabel(prop: PropertySummary): string {
    if (prop.city === 'Sandton') return 'Sandton, Johannesburg';
    if (prop.city === 'Meyerton') return 'Meyerton, Gauteng';
    return prop.city;
  }

  visitsUsed(prop: PropertySummary): number {
    if (!prop.visitsPerYear || prop.visitsRemaining === undefined) return 0;
    return prop.visitsPerYear - prop.visitsRemaining;
  }

  visitsPercent(prop: PropertySummary): number {
    if (!prop.visitsPerYear) return 0;
    return Math.round((this.visitsUsed(prop) / prop.visitsPerYear) * 100);
  }

  startPaystackCheckout(propertyId?: string, planName?: string): void {
    this.checkoutError.set(null);
    this.checkoutLoading.set(propertyId ?? 'all');
    this.paystack.checkout(propertyId, planName).subscribe({
      next: () => {
        this.checkoutLoading.set(null);
        this.reloadPortfolio();
      },
      error: (err: Error) => {
        this.checkoutLoading.set(null);
        this.checkoutError.set(err.message ?? 'Payment could not be completed.');
      },
    });
  }

  private reloadPortfolio(): void {
    this.clientService.getSubscriptionPortfolio().subscribe({
      next: ({ properties, portfolio, payments }) => {
        this.properties.set(properties);
        this.portfolio.set(portfolio);
        this.payments.set(payments);
      },
    });
  }
}
