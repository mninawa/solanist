import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { CleaningReport } from '../../../core/models/client.models';
import { APP_CONFIG } from '../../../core/config/app-config';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientBookingRescheduleComponent } from '../bookings/client-booking-reschedule.component';

interface LightboxPhoto {
  url: string;
  type: 'before' | 'after';
  index: number;
}

@Component({
  selector: 'app-client-report-detail',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    UpperCasePipe,
    LoadingStateComponent,
    EmptyStateComponent,
    AppIconComponent,
    ClientBookingRescheduleComponent,
  ],
  templateUrl: './client-report-detail.component.html',
  styleUrl: './client-report-detail.component.scss',
})
export class ClientReportDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);

  readonly config = APP_CONFIG;

  report = signal<CleaningReport | null>(null);
  loading = signal(true);
  selectedBeforeIndex = signal(0);
  selectedAfterIndex = signal(0);
  lightbox = signal<LightboxPhoto | null>(null);
  lightboxZoom = signal(1);
  rescheduleOpen = signal(false);
  shareMessage = signal<string | null>(null);

  checklistComplete = computed(() => {
    const r = this.report();
    return r ? r.checklistSummary.length : 0;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.clientService.getReport(id).subscribe({
      next: (r) => {
        this.report.set(r);
        this.loading.set(false);
      },
    });
  }

  propertyName(r: CleaningReport): string {
    return r.propertyAddress.split(',')[0]?.trim() ?? r.propertyAddress;
  }

  propertyCity(r: CleaningReport): string {
    const parts = r.propertyAddress.split(',');
    return parts.slice(1).join(',').trim();
  }

  shortAccess(r: CleaningReport): string {
    const notes = r.accessNotes ?? '';
    if (notes.toLowerCase().includes('side gate')) return 'Side gate';
    if (notes.toLowerCase().includes('front gate')) return 'Front gate';
    return notes.split('—')[0]?.trim() || notes.split('.')[0]?.trim() || '—';
  }

  selectBefore(index: number): void {
    this.selectedBeforeIndex.set(index);
  }

  selectAfter(index: number): void {
    this.selectedAfterIndex.set(index);
  }

  openLightbox(type: 'before' | 'after', index: number): void {
    const r = this.report();
    if (!r) return;
    const url = type === 'before' ? r.beforePhotos[index] : r.afterPhotos[index];
    if (!url) return;
    this.lightboxZoom.set(1);
    this.lightbox.set({ url, type, index });
  }

  closeLightbox(): void {
    this.lightbox.set(null);
    this.lightboxZoom.set(1);
  }

  zoomIn(): void {
    this.lightboxZoom.update((z) => Math.min(3, z + 0.25));
  }

  zoomOut(): void {
    this.lightboxZoom.update((z) => Math.max(1, z - 0.25));
  }

  downloadPhoto(): void {
    const lb = this.lightbox();
    if (!lb) return;
    const link = document.createElement('a');
    link.href = lb.url;
    link.download = `solanist-${lb.type}-photo-${lb.index + 1}.jpg`;
    link.target = '_blank';
    link.click();
  }

  downloadPdf(): void {
    window.print();
  }

  async shareReport(): Promise<void> {
    const r = this.report();
    if (!r) return;
    const url = window.location.href;
    const text = `${r.serviceType} — ${this.propertyName(r)}, ${r.completedAt}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: r.serviceType, text, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    this.shareMessage.set('Report link copied to clipboard');
    setTimeout(() => this.shareMessage.set(null), 3000);
  }

  openReschedule(): void {
    this.rescheduleOpen.set(true);
  }

  closeReschedule(): void {
    this.rescheduleOpen.set(false);
  }
}
