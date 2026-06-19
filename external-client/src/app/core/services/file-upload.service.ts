import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, delay, map, of, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

interface UploadFilesResult {
  urls: string[];
}

interface ApiResponse<T> {
  data: T;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class FileUploadService {
  private readonly http = inject(HttpClient);

  uploadBatch(files: File[]): Observable<string[]> {
    if (APP_CONFIG.mockMode || files.length === 0) {
      return this.uploadMockBatch(files);
    }

    const form = new FormData();
    for (const file of files) {
      form.append('files', file, file.name);
    }

    return this.http
      .post<ApiResponse<UploadFilesResult>>(`${APP_CONFIG.apiBaseUrl}/uploads/photos`, form)
      .pipe(
        map((response) => response.data.urls),
        catchError((err) => {
          if (err?.status === 503) {
            return this.uploadMockBatch(files);
          }
          return throwError(() => err);
        }),
      );
  }

  uploadMock(file: File): Observable<string> {
    const url = URL.createObjectURL(file);
    return of(url).pipe(delay(600));
  }

  uploadMockBatch(files: File[]): Observable<string[]> {
    const urls = files.map((f) => URL.createObjectURL(f));
    return of(urls).pipe(delay(800));
  }
}
