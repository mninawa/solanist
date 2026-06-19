import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { PaystackService } from '../../../core/services/paystack.service';
import { Booking, PropertyDetail, PropertySummary } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientAssignPlanDrawerComponent } from '../assign-plan/client-assign-plan-drawer.component';
import { fallbackPropertyImage } from '../../../core/util/property-image';

type DetailTab = 'overview' | 'cleanings' | 'invoices';
type PlanAction = null | 'cancel';

@Component({
  selector: 'app-client-property-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
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
  private readonly paystack = inject(PaystackService);
  private readonly route = inject(ActivatedRoute);

  detail = signal<PropertyDetail | null>(null);
  loading = signal(true);
  imageError = signal(false);
  activeTab = signal<DetailTab>('overview');
  assignDrawerOpen = signal(false);

  // Inline plan-management state
  paystackEnabled = signal(false);
  editingDate = signal(false);
  draftDate = signal('');
  savingDate = signal(false);
  dateError = signal<string | null>(null);
  planAction = signal<PlanAction>(null);
  busy = signal(false);
  message = signal<string | null>(null);
  messageKind = signal<'info' | 'success' | 'error'>('info');

  readonly today = new Date().toISOString().slice(0, 10);

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
    this.paystack.getConfig().subscribe({
      next: (cfg) => this.paystackEnabled.set(cfg.enabled),
    });
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
    this.flash('success', 'Plan updated.');
  }

  /* ----- Inline plan management ----- */

  startEditDate(): void {
    const prop = this.property();
    if (!prop) return;
    this.dateError.set(null);
    this.draftDate.set(prop.nextCleanDate ? prop.nextCleanDate.slice(0, 10) : '');
    this.editingDate.set(true);
  }

  cancelEditDate(): void {
    this.editingDate.set(false);
    this.draftDate.set('');
    this.dateError.set(null);
  }

  saveDate(): void {
    const prop = this.property();
    if (!prop) return;
    const value = this.draftDate().trim();
    if (!value) {
      this.dateError.set('Pick a date first.');
      return;
    }
    this.savingDate.set(true);
    this.dateError.set(null);
    this.clientService.updatePropertyNextClean(prop.id, value).subscribe({
      next: (updated) => {
        this.applyPropertyUpdate(updated);
        this.savingDate.set(false);
        this.editingDate.set(false);
        this.flash('success', 'Next clean date updated.');
      },
      error: () => {
        this.savingDate.set(false);
        this.dateError.set('Could not update the date. Please try again.');
      },
    });
  }

  clearDate(): void {
    const prop = this.property();
    if (!prop) return;
    this.savingDate.set(true);
    this.dateError.set(null);
    this.clientService.updatePropertyNextClean(prop.id, null).subscribe({
      next: (updated) => {
        this.applyPropertyUpdate(updated);
        this.savingDate.set(false);
        this.editingDate.set(false);
        this.flash('success', 'Next clean date cleared.');
      },
      error: () => {
        this.savingDate.set(false);
        this.dateError.set('Could not clear the date. Please try again.');
      },
    });
  }

  changePlan(): void {
    this.openAssignDrawer();
  }

  updatePaymentMethod(): void {
    const prop = this.property();
    if (!prop) return;
    this.busy.set(true);
    this.message.set(null);
    this.paystack.checkout(prop.id, prop.planName).subscribe({
      next: (result) => {
        this.busy.set(false);
        if (result.success) {
          this.flash('success', 'Payment method updated via Paystack.');
          this.load(prop.id);
        } else {
          this.flash('info', result.detail ?? 'Payment confirmation pending.');
        }
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.flash('error', err.message ?? 'Paystack checkout failed.');
      },
    });
  }

  requestCancel(): void {
    this.planAction.set('cancel');
    this.message.set(null);
  }

  dismissCancel(): void {
    this.planAction.set(null);
  }

  confirmCancel(): void {
    const prop = this.property();
    if (!prop) return;
    this.busy.set(true);
    this.message.set(null);
    this.paystack.cancelSubscription().subscribe({
      next: (result) => {
        this.busy.set(false);
        this.planAction.set(null);
        this.flash(
          result.success ? 'success' : 'error',
          result.message ?? (result.success ? 'Subscription cancelled.' : 'Could not cancel subscription.'),
        );
        if (result.success) this.load(prop.id);
      },
      error: (err: Error) => {
        this.busy.set(false);
        this.planAction.set(null);
        this.flash('error', err.message ?? 'Could not cancel subscription.');
      },
    });
  }

  private applyPropertyUpdate(updated: PropertySummary): void {
    this.detail.update((current) => (current ? { ...current, property: updated } : current));
  }

  private flash(kind: 'info' | 'success' | 'error', text: string): void {
    this.messageKind.set(kind);
    this.message.set(text);
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
