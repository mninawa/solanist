import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import {
  Booking,
  ClientDashboard,
  CleaningReportSummary,
  PropertySummary,
  SubscriptionPortfolio,
} from '../../../core/models/client.models';
import { daysUntilDate } from '../../../core/utils/booking-calendar.util';
import { APP_CONFIG } from '../../../core/config/app-config';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientAssignPlanDrawerComponent } from '../assign-plan/client-assign-plan-drawer.component';
import { fallbackPropertyImage } from '../../../core/util/property-image';

type PortfolioView = 'grid' | 'list';
const VIEW_KEY = 'solanist:dashboard-view';

interface BillingLine {
  propertyId: string;
  name: string;
  planName: string;
  amount: number;
  due: string | null;
}

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
    ClientAssignPlanDrawerComponent,
  ],
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.scss',
})
export class ClientDashboardComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  readonly config = APP_CONFIG;

  dashboard = signal<ClientDashboard | null>(null);
  properties = signal<PropertySummary[]>([]);
  bookings = signal<Booking[]>([]);
  recentReports = signal<CleaningReportSummary[]>([]);
  portfolio = signal<SubscriptionPortfolio | null>(null);
  loading = signal(true);
  imageErrors = signal<Set<string>>(new Set());

  /** 'all' shows the whole portfolio, otherwise a single property id. */
  viewFilter = signal<string>('all');
  portfolioView = signal<PortfolioView>(this.readStoredView());
  assignPlanProperty = signal<PropertySummary | null>(null);

  filteredProperties = computed(() => {
    const filter = this.viewFilter();
    const all = this.properties();
    return filter === 'all' ? all : all.filter((p) => p.id === filter);
  });

  totalProperties = computed(() => this.filteredProperties().length);

  activeSubscriptions = computed(
    () =>
      this.filteredProperties().filter(
        (p) => p.subscriptionStatus === 'active' && p.planName,
      ).length,
  );

  allActive = computed(
    () => this.totalProperties() > 0 && this.activeSubscriptions() === this.totalProperties(),
  );

  nextCleanProperty = computed(() => {
    const withDates = this.filteredProperties()
      .filter((p) => p.nextCleanDate)
      .sort((a, b) => (a.nextCleanDate! < b.nextCleanDate! ? -1 : 1));
    return withDates[0] ?? null;
  });

  upcomingBookings = computed(() => {
    const filter = this.viewFilter();
    return this.bookings()
      .filter((b) => b.status === 'upcoming')
      .filter((b) => filter === 'all' || b.propertyId === filter)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  });

  billingLines = computed<BillingLine[]>(() => {
    const portfolio = this.portfolio();
    const filter = this.viewFilter();
    const props = this.properties();
    const preview = portfolio?.invoicePreview ?? [];
    return preview
      .filter((item) => filter === 'all' || item.propertyId === filter)
      .map((item) => {
        const prop = props.find((p) => p.id === item.propertyId);
        return {
          propertyId: item.propertyId,
          name: item.propertyName,
          planName: item.planName,
          amount: item.amount,
          due: prop?.nextCleanDate ?? portfolio?.nextBillingDate ?? null,
        };
      });
  });

  combinedBillingTotal = computed(() =>
    this.billingLines().reduce((sum, line) => sum + line.amount, 0),
  );

  ngOnInit(): void {
    this.clientService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.clientService.getProperties().subscribe({
      next: (props) => this.properties.set(props),
    });
    this.clientService.getBookings().subscribe({
      next: (bookings) => this.bookings.set(bookings),
    });
    this.clientService.getReports().subscribe({
      next: (reports) => this.recentReports.set(reports.slice(0, 3)),
    });
    this.clientService.getSubscriptionPortfolio().subscribe({
      next: ({ portfolio }) => this.portfolio.set(portfolio),
    });
  }

  setFilter(value: string): void {
    this.viewFilter.set(value || 'all');
  }

  setView(view: PortfolioView): void {
    this.portfolioView.set(view);
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      /* storage unavailable — keep in-memory only */
    }
  }

  openAssignPlan(prop: PropertySummary): void {
    this.assignPlanProperty.set(prop);
  }

  closeAssignPlan(): void {
    this.assignPlanProperty.set(null);
  }

  onPlanAssigned(): void {
    this.closeAssignPlan();
    this.clientService.getProperties().subscribe({
      next: (props) => this.properties.set(props),
    });
    this.clientService.getSubscriptionPortfolio().subscribe({
      next: ({ portfolio }) => this.portfolio.set(portfolio),
    });
  }

  needsPlan(prop: PropertySummary): boolean {
    return prop.subscriptionStatus !== 'active' || !prop.planName;
  }

  displayImage(prop: PropertySummary): string {
    if (prop.imageUrl && !this.imageErrors().has(prop.id)) return prop.imageUrl;
    return fallbackPropertyImage(prop.id);
  }

  onImageError(id: string): void {
    this.imageErrors.update((set) => new Set(set).add(id));
  }

  planBadgeClass(variant?: string): string {
    if (variant === 'purple') return 'badge-plan-purple';
    if (variant === 'blue') return 'badge-plan-blue';
    return 'badge-plan-neutral';
  }

  formatPanelCount(count: number): string {
    return count >= 1000 ? count.toLocaleString('en-ZA') : String(count);
  }

  daysUntil(date: string): number {
    return daysUntilDate(date);
  }

  private readStoredView(): PortfolioView {
    try {
      return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  }
}
