import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { CreatePropertyRequest, PropertySummary } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
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
  ],
  templateUrl: './client-properties.component.html',
  styleUrl: './client-properties.component.scss',
})
export class ClientPropertiesComponent implements OnInit {
  private readonly clientService = inject(ClientService);

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

  readonly roofTypes = ROOF_TYPES;
  readonly minPanels = APP_CONFIG.minPanelCount;
  readonly maxPanels = APP_CONFIG.maxPanelCount;

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
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
    this.formImage.set(null);
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

  saveProperty(): void {
    if (!this.form.address.trim() || !this.form.city.trim() || !this.form.postcode.trim()) {
      this.formError.set('Please fill in address, city, and postcode.');
      return;
    }
    this.form.panelCount = clampPanelCount(this.form.panelCount);
    this.saving.set(true);
    this.formError.set(null);
    this.clientService.addProperty(this.form).subscribe({
      next: (property) => {
        const photo = this.formImage();
        if (photo) {
          this.clientService.updatePropertyImage(property.id, photo).subscribe({
            next: (withPhoto) => {
              this.properties.update((list) => [...list, withPhoto]);
              this.saving.set(false);
              this.closeForm();
            },
            error: () => {
              this.properties.update((list) => [...list, property]);
              this.saving.set(false);
              this.closeForm();
            },
          });
          return;
        }
        this.properties.update((list) => [...list, property]);
        this.saving.set(false);
        this.closeForm();
      },
      error: () => {
        this.formError.set('Could not save property. Please try again.');
        this.saving.set(false);
      },
    });
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
