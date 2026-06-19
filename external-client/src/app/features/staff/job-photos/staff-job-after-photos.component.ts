import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { StaffJobWorkspaceService } from '../job-workspace/staff-job-workspace.service';
import { StaffService } from '../../../core/services/staff.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { MIN_AFTER_PHOTOS } from '../../../core/models/staff.models';
import { isValidKwhReading, kwhGain } from '../../../core/utils/staff-workflow.util';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-after-photos',
  standalone: true,
  imports: [FormsModule, DecimalPipe, AppIconComponent],
  templateUrl: './staff-job-after-photos.component.html',
  styleUrl: './staff-job-after-photos.component.scss',
})
export class StaffJobAfterPhotosComponent {
  readonly ws = inject(StaffJobWorkspaceService);
  private readonly staffService = inject(StaffService);
  private readonly uploadService = inject(FileUploadService);

  uploading = signal(false);
  kwhReading = signal<number | null>(null);
  minPhotos = MIN_AFTER_PHOTOS;

  afterPhotos = computed(() => this.ws.job()?.afterPhotos ?? []);
  beforePhotos = computed(() => this.ws.job()?.beforePhotos ?? []);
  beforeKwh = computed(() => this.ws.job()?.beforeKwhReading ?? null);

  requiredSlots = computed(
    () => this.ws.job()?.photoSlots.filter((s) => s.type === 'after') ?? [],
  );

  kwhGain = computed(() => {
    const before = this.beforeKwh();
    const after = this.kwhReading();
    return kwhGain(before, after);
  });

  constructor() {
    const job = this.ws.job();
    if (job?.afterKwhReading != null) {
      this.kwhReading.set(job.afterKwhReading);
    }
  }

  isValid(): boolean {
    return isValidKwhReading(this.kwhReading());
  }

  onKwhInput(value: string | number | null): void {
    if (value === '' || value == null) {
      this.kwhReading.set(null);
      return;
    }
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    this.kwhReading.set(Number.isFinite(num) ? num : null);
  }

  saveKwhReading(): void {
    const reading = this.kwhReading();
    this.staffService.updateKwhReading(this.ws.jobId(), 'after', reading).subscribe({
      next: (j) => {
        if (j) this.ws.job.set(j);
      },
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.upload(Array.from(input.files));
    input.value = '';
  }

  upload(files: File[]): void {
    const jobId = this.ws.jobId();
    this.uploading.set(true);
    this.uploadService.uploadBatch(files).subscribe({
      next: (urls) => {
        this.staffService.addPhotos(jobId, 'after', urls).subscribe({
          next: (j) => {
            if (j) this.ws.job.set(j);
            this.uploading.set(false);
          },
        });
      },
    });
  }

  remove(index: number): void {
    const jobId = this.ws.jobId();
    this.staffService.removePhoto(jobId, 'after', index).subscribe({
      next: (j) => {
        if (j) this.ws.job.set(j);
      },
    });
  }
}
