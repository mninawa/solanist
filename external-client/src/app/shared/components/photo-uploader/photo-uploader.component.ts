import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-photo-uploader',
  standalone: true,
  template: `
    <div class="uploader">
      <label class="upload-zone">
        <input type="file" accept="image/*" multiple (change)="onFilesSelected($event)" hidden />
        <span class="upload-icon">📷</span>
        <span class="upload-text">{{ label }}</span>
        <span class="upload-hint">Tap to add photos</span>
      </label>
      @if (photos.length) {
        <div class="photo-grid">
          @for (photo of photos; track photo; let i = $index) {
            <div class="photo-thumb">
              <img [src]="photo" alt="Uploaded photo" />
              <button type="button" class="remove-btn" (click)="removePhoto(i)">×</button>
            </div>
          }
        </div>
      }
      @if (uploading) {
        <p class="uploading">Uploading...</p>
      }
    </div>
  `,
  styles: `
    .upload-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-xl);
      border: 2px dashed var(--color-border-strong);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: border-color 0.15s ease;
    }
    .upload-zone:hover {
      border-color: var(--color-accent);
    }
    .upload-icon {
      font-size: 2rem;
    }
    .upload-text {
      font-weight: 600;
      color: var(--color-text-primary);
    }
    .upload-hint {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: var(--spacing-sm);
      margin-top: var(--spacing-md);
    }
    .photo-thumb {
      position: relative;
      aspect-ratio: 4/3;
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .photo-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .remove-btn {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: var(--radius-full);
      background: rgba(0, 0, 0, 0.7);
      color: white;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }
    .uploading {
      text-align: center;
      color: var(--color-accent);
      font-size: 0.875rem;
      margin-top: var(--spacing-sm);
    }
  `,
})
export class PhotoUploaderComponent {
  @Input() label = 'Upload photos';
  @Input() photos: string[] = [];
  @Input() uploading = false;
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() photoRemoved = new EventEmitter<number>();

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.filesSelected.emit(Array.from(input.files));
    }
  }

  removePhoto(index: number): void {
    this.photoRemoved.emit(index);
  }
}
