import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { Booking, PropertyDetail, PropertySummary } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientAssignPlanDrawerComponent } from '../assign-plan/client-assign-plan-drawer.component';
import { fallbackPropertyImage } from '../../../core/util/property-image';

type DetailTab = 'overview' | 'cleanings' | 'invoices';

@Component({
  selector: 'app-client-property-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    TitleCasePipe,
    LoadingStateComponent,
    EmptyStateComponent,
    AppIconComponent,
    ClientAssignPlanDrawerComponent,
  ],
  templateUrl: './client-property-detail.component.html',
  styleUrl: './client-property-detail.component.scss',
})
export class ClientPropertyDetailComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);

  detail = signal<PropertyDetail | null>(null);
  loading = signal(true);
  imageError = signal(false);
  activeTab = signal<DetailTab>('overview');
  assignDrawerOpen = signal(false);

  property = computed(() => this.detail()?.property ?? null);
  plan = computed(() => this.detail()?.plan ?? null);
  invoices = computed(() => this.detail()?.invoices ?? []);
  bookings = computed(() => this.detail()?.bookings ?? []);
  reports = computed(() => this.detail()?.reports ?? []);

  pastCleanings = computed(() =>
    this.bookings().filter(
      (b) => b.status === 'completed' || b.status === 'cancelled',
    ),
  );

  upcomingCleanings = computed(() =>
    this.bookings().filter((b) => b.status === 'upcoming'),
  );

  totalSpent = computed(() =>
    this.invoices()
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0),
  );

  cleaningsCompleted = computed(() => this.pastCleanings().filter((b) => b.status === 'completed').length);

  reportCount = computed(() => this.reports().length);

  needsPlan = computed(() => {
    const prop = this.property();
    if (!prop) return false;
    return prop.subscriptionStatus !== 'active' || !prop.planName;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.load(id);
    });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  imageSrc(prop: PropertySummary): string {
    if (prop.imageUrl && !this.imageError()) return prop.imageUrl;
    return fallbackPropertyImage(prop.id);
  }

  onImageError(): void {
    this.imageError.set(true);
  }

  formatPanelCount(count: number): string {
    return count >= 1000 ? count.toLocaleString('en-ZA') : String(count);
  }

  bookingStatusClass(b: Booking): string {
    return `status-pill status-${b.status}`;
  }

  openAssignDrawer(): void {
    this.assignDrawerOpen.set(true);
  }

  closeAssignDrawer(): void {
    this.assignDrawerOpen.set(false);
  }

  onPlanAssigned(): void {
    this.closeAssignDrawer();
    const prop = this.property();
    if (prop) this.load(prop.id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.imageError.set(false);
    this.clientService.getPropertyDetail(id).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
