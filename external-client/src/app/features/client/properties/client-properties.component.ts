import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { ClientService } from '../../../core/services/client.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PaystackService } from '../../../core/services/paystack.service';
import { CreatePropertyRequest, PropertySummary } from '../../../core/models/client.models';
import { ServicePlan } from '../../../core/models/invite.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { PlanCardComponent } from '../../../shared/components/plan-card/plan-card.component';
import { ClientAssignPlanDrawerComponent } from '../assign-plan/client-assign-plan-drawer.component';
import { fallbackPropertyImage, readAndResizeImage } from '../../../core/util/property-image';

import { APP_CONFIG, clampPanelCount } from '../../../core/config/app-config';
const ROOF_TYPES = ['Tile Roof', 'Metal Roof', 'Flat Roof', 'Thatch (special access)'] as const;

@Component({
  selector: 'app-client-properties',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    DecimalPipe,
    DatePipe,
    CurrencyPipe,
    LoadingStateComponent,
    AppIconComponent,
    PlanCardComponent,
    ClientAssignPlanDrawerComponent,
  ],
  templateUrl: './client-properties.component.html',
  styleUrl: './client-properties.component.scss',
})
export class ClientPropertiesComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly auth = inject(AuthService);
  private readonly paystack = inject(PaystackService);

  properties = signal<PropertySummary[]>([]);
  loading = signal(true);
  showForm = signal(false);
  saving = signal(false);
  formError = signal<string | null>(null);
  deleteError = signal<string | null>(null);
  confirmingDeleteId = signal<string | null>(null);
  deleting = signal(false);
  private readonly imageErrors = signal<Set<string>>(new Set());
  uploadingId = signal<string | null>(null);
  uploadError = signal<string | null>(null);
  formImage = signal<string | null>(null);
  assignPlanProperty = signal<PropertySummary | null>(null);
  editingDateId = signal<string | null>(null);
  draftDate = signal<string>('');
  savingDateId = signal<string | null>(null);
  dateError = signal<string | null>(null);

  readonly today = new Date().toISOString().slice(0, 10);

  readonly roofTypes = ROOF_TYPES;
  readonly minPanels = APP_CONFIG.minPanelCount;
  readonly maxPanels = APP_CONFIG.maxPanelCount;
  readonly addStepLabels = ['Property', 'First clean', 'Plan'];

  formStep = signal(1);
  firstCleanDate = signal('');
  createdProperty = signal<PropertySummary | null>(null);
  plans = signal<ServicePlan[]>([]);
  plansLoading = signal(false);
  selectedPlanId = signal<string | null>(null);
  paystackEnabled = signal(false);
  subscribing = signal(false);
  subscribePending = signal(false);
  subscribeError = signal<string | null>(null);

  selectedPlan = computed(
    () => this.plans().find((p) => p.id === this.selectedPlanId()) ?? null,
  );

  form: CreatePropertyRequest = this.emptyForm();

  activeCount = computed(
    () => this.properties().filter((p) => p.subscriptionStatus === 'active').length,
  );

  subscriptionCount = computed(
    () => this.properties().filter((p) => p.subscriptionStatus === 'active' && p.planName).length,
  );

  subscriptionPercent = computed(() => {
    const total = this.properties().length;
    if (!total) return 0;
    return Math.round((this.subscriptionCount() / total) * 100);
  });

  monthlyBillingTotal = computed(() =>
    this.properties().reduce((sum, p) => sum + (p.monthlyBilling ?? 0), 0),
  );

  nextClean = computed(() => {
    const withDates = this.properties()
      .filter((p) => p.nextCleanDate)
      .sort((a, b) => (a.nextCleanDate! < b.nextCleanDate! ? -1 : 1));
    return withDates[0] ?? null;
  });

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.clientService.getProperties().subscribe({
      next: (p) => {
        this.properties.set(p);
        this.loading.set(false);
      },
    });
  }

  openForm(): void {
    this.form = this.emptyForm();
    this.formError.set(null);
    this.formImage.set(null);
    this.formStep.set(1);
    this.firstCleanDate.set('');
    this.createdProperty.set(null);
    this.selectedPlanId.set(null);
    this.subscribing.set(false);
    this.subscribePending.set(false);
    this.subscribeError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
    this.formImage.set(null);
    this.formStep.set(1);
    this.createdProperty.set(null);
  }

  continueToCleanDate(): void {
    if (!this.form.address.trim() || !this.form.city.trim() || !this.form.postcode.trim()) {
      this.formError.set('Please fill in address, city, and postcode.');
      return;
    }
    this.formError.set(null);
    this.formStep.set(2);
  }

  backToInfo(): void {
    this.formError.set(null);
    this.formStep.set(1);
  }

  /** Commits the property (with photo + first-clean date) then advances to plan selection. */
  continueToPlan(): void {
    if (this.createdProperty()) {
      this.formStep.set(3);
      return;
    }
    this.form.panelCount = clampPanelCount(this.form.panelCount);
    this.saving.set(true);
    this.formError.set(null);

    const photo = this.formImage();
    const date = this.firstCleanDate().trim();
    this.clientService
      .addProperty(this.form)
      .pipe(
        switchMap((property) =>
          photo ? this.clientService.updatePropertyImage(property.id, photo) : of(property),
        ),
        switchMap((property) =>
          date ? this.clientService.updatePropertyNextClean(property.id, date) : of(property),
        ),
      )
      .subscribe({
        next: (property) => {
          this.createdProperty.set(property);
          this.properties.update((list) => [...list, property]);
          this.saving.set(false);
          this.loadPlans();
          this.formStep.set(3);
        },
        error: () => {
          this.formError.set('Could not save property. Please try again.');
          this.saving.set(false);
        },
      });
  }

  private loadPlans(): void {
    this.plansLoading.set(true);
    this.paystack.getConfig().subscribe({
      next: (cfg) => this.paystackEnabled.set(cfg.enabled),
    });
    this.auth.getServicePlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        const recommended = plans.find((p) => p.recommended) ?? plans[0];
        this.selectedPlanId.set(recommended?.id ?? null);
        this.plansLoading.set(false);
      },
      error: () => this.plansLoading.set(false),
    });
  }

  selectPlan(id: string): void {
    this.selectedPlanId.set(id);
  }

  subscribeToPlan(): void {
    const property = this.createdProperty();
    const plan = this.selectedPlan();
    if (!property || !plan) return;
    this.subscribing.set(true);
    this.subscribeError.set(null);
    this.paystack.checkout(property.id, plan.name).subscribe({
      next: (result) => {
        this.subscribing.set(false);
        this.subscribePending.set(!result.success);
        this.loadProperties();
        if (result.success) this.closeForm();
      },
      error: (err: Error) => {
        this.subscribing.set(false);
        this.subscribeError.set(err.message ?? 'Payment could not be completed.');
      },
    });
  }

  finishWithoutPlan(): void {
    this.loadProperties();
    this.closeForm();
  }

  /** Stable image to render for a property — falls back to a house photo when missing/broken. */
  displayImage(prop: PropertySummary): string {
    if (prop.imageUrl && !this.imageErrors().has(prop.id)) return prop.imageUrl;
    return fallbackPropertyImage(prop.id);
  }

  onImageError(id: string): void {
    this.imageErrors.update((set) => new Set(set).add(id));
  }

  async onPhotoSelected(event: Event, propertyId: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadError.set(null);
    this.uploadingId.set(propertyId);
    try {
      const dataUrl = await readAndResizeImage(file);
      this.clientService.updatePropertyImage(propertyId, dataUrl).subscribe({
        next: (updated) => {
          this.properties.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
          this.imageErrors.update((set) => {
            const next = new Set(set);
            next.delete(propertyId);
            return next;
          });
          this.uploadingId.set(null);
        },
        error: () => {
          this.uploadError.set('Could not upload that photo. Please try again.');
          this.uploadingId.set(null);
        },
      });
    } catch (err) {
      this.uploadError.set(err instanceof Error ? err.message : 'Could not read that image.');
      this.uploadingId.set(null);
    }
  }

  async onFormPhotoSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      this.formImage.set(await readAndResizeImage(file));
    } catch (err) {
      this.formError.set(err instanceof Error ? err.message : 'Could not read that image.');
    }
  }

  clearFormPhoto(): void {
    this.formImage.set(null);
  }

  setPrimary(id: string): void {
    this.clientService.setPrimaryProperty(id).subscribe({
      next: (list) => this.properties.set(list),
    });
  }

  requestDelete(id: string): void {
    this.deleteError.set(null);
    this.confirmingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(id: string): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.clientService.deleteProperty(id).subscribe({
      next: (list) => {
        this.properties.set(list);
        this.confirmingDeleteId.set(null);
        this.deleting.set(false);
      },
      error: (err: Error) => {
        this.deleteError.set(err.message ?? 'Could not delete property.');
        this.deleting.set(false);
      },
    });
  }

  canDeleteProperty(): boolean {
    return this.properties().length > 1;
  }

  formatPanelCount(count: number): string {
    return count >= 1000 ? count.toLocaleString('en-ZA') : String(count);
  }

  planBadgeClass(variant?: string): string {
    if (variant === 'purple') return 'badge-plan-purple';
    if (variant === 'blue') return 'badge-plan-blue';
    return 'badge-plan-neutral';
  }

  startEditDate(prop: PropertySummary): void {
    this.dateError.set(null);
    this.draftDate.set(prop.nextCleanDate ? prop.nextCleanDate.slice(0, 10) : '');
    this.editingDateId.set(prop.id);
  }

  cancelEditDate(): void {
    this.editingDateId.set(null);
    this.draftDate.set('');
    this.dateError.set(null);
  }

  saveDate(prop: PropertySummary): void {
    const value = this.draftDate().trim();
    if (!value) {
      this.dateError.set('Pick a date first.');
      return;
    }
    this.savingDateId.set(prop.id);
    this.dateError.set(null);
    this.clientService.updatePropertyNextClean(prop.id, value).subscribe({
      next: (updated) => {
        this.properties.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.savingDateId.set(null);
        this.editingDateId.set(null);
      },
      error: () => {
        this.dateError.set('Could not update the date. Please try again.');
        this.savingDateId.set(null);
      },
    });
  }

  clearDate(prop: PropertySummary): void {
    this.savingDateId.set(prop.id);
    this.dateError.set(null);
    this.clientService.updatePropertyNextClean(prop.id, null).subscribe({
      next: (updated) => {
        this.properties.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.savingDateId.set(null);
        this.editingDateId.set(null);
      },
      error: () => {
        this.dateError.set('Could not clear the date. Please try again.');
        this.savingDateId.set(null);
      },
    });
  }

  openAssignPlan(prop: PropertySummary): void {
    this.assignPlanProperty.set(prop);
  }

  closeAssignPlan(): void {
    this.assignPlanProperty.set(null);
  }

  onPlanAssigned(): void {
    this.loadProperties();
    this.closeAssignPlan();
  }

  needsPlanSetup(prop: PropertySummary): boolean {
    return prop.subscriptionStatus !== 'active' || !prop.planName;
  }

  private emptyForm(): CreatePropertyRequest {
    return {
      address: '',
      city: '',
      postcode: '',
      panelCount: 12,
      roofType: ROOF_TYPES[0],
      accessNotes: '',
    };
  }
}
