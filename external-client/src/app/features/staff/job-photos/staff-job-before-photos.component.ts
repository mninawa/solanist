import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StaffJobWorkspaceService } from '../job-workspace/staff-job-workspace.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { StaffService } from '../../../core/services/staff.service';
import { MIN_BEFORE_PHOTOS } from '../../../core/models/staff.models';
import { isValidKwhReading } from '../../../core/utils/staff-workflow.util';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-before-photos',
  standalone: true,
  imports: [FormsModule, AppIconComponent],
  templateUrl: './staff-job-before-photos.component.html',
  styleUrl: './staff-job-before-photos.component.scss',
})
export class StaffJobBeforePhotosComponent implements OnInit {
  readonly ws = inject(StaffJobWorkspaceService);
  private readonly staffService = inject(StaffService);
  private readonly uploadService = inject(FileUploadService);

  uploading = signal(false);
  kwhReading = signal<number | null>(null);
  minPhotos = MIN_BEFORE_PHOTOS;
  private uploadTimes = signal<string[]>([]);

  photos = computed(() => this.ws.job()?.beforePhotos ?? []);

  requiredSlots = computed(
    () => this.ws.job()?.photoSlots.filter((s) => s.type === 'before') ?? [],
  );

  ngOnInit(): void {
    const job = this.ws.job();
    if (job?.beforeKwhReading != null) {
      this.kwhReading.set(job.beforeKwhReading);
    }
    const count = this.photos().length;
    this.uploadTimes.set(this.photos().map((_, i) => this.defaultTime(i)));
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
    this.staffService.updateKwhReading(this.ws.jobId(), 'before', reading).subscribe({
      next: (j) => {
        if (j) this.ws.job.set(j);
      },
    });
  }

  slotLabel(index: number): string {
    return this.requiredSlots()[index]?.label ?? 'Photo';
  }

  photoTime(index: number): string {
    return this.uploadTimes()[index] ?? 'Today';
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
        this.staffService.addPhotos(jobId, 'before', urls).subscribe({
          next: (j) => {
            if (j) {
              this.ws.job.set(j);
              const times = [...this.uploadTimes()];
              urls.forEach(() =>
                times.push(
                  new Date().toLocaleTimeString('en-ZA', { hour: 'numeric', minute: '2-digit' }),
                ),
              );
              this.uploadTimes.set(times);
            }
            this.uploading.set(false);
          },
        });
      },
    });
  }

  remove(index: number): void {
    const jobId = this.ws.jobId();
    this.staffService.removePhoto(jobId, 'before', index).subscribe({
      next: (j) => {
        if (j) {
          this.ws.job.set(j);
          const times = [...this.uploadTimes()];
          times.splice(index, 1);
          this.uploadTimes.set(times);
        }
      },
    });
  }

  private defaultTime(index: number): string {
    const offsets = ['10:04 AM', '10:05 AM', '10:06 AM'];
    return offsets[index] ?? '10:07 AM';
  }
}
