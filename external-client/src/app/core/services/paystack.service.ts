import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

interface ApiResponse<T> {
  data: T;
  message?: string | null;
}

export interface PaystackConfig {
  enabled: boolean;
  publicKey: string | null;
}

export interface PaystackInitializeResult {
  accessCode: string;
  reference: string;
  publicKey: string;
  planCode?: string | null;
}

export interface PaystackVerifyResult {
  success: boolean;
  paymentMethod?: string | null;
  subscriptionStatus?: string | null;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup(options: Record<string, unknown>): { openIframe(): void };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class PaystackService {
  private readonly http = inject(HttpClient);
  private scriptLoaded = false;

  getConfig(): Observable<PaystackConfig> {
    return this.http
      .get<ApiResponse<PaystackConfig>>(`${APP_CONFIG.apiBaseUrl}/client/paystack/config`)
      .pipe(map((r) => r.data));
  }

  initialize(propertyId?: string, planName?: string): Observable<PaystackInitializeResult> {
    return this.http
      .post<ApiResponse<PaystackInitializeResult>>(`${APP_CONFIG.apiBaseUrl}/client/paystack/initialize`, {
        propertyId: propertyId ?? null,
        planName: planName ?? null,
      })
      .pipe(map((r) => r.data));
  }

  verify(reference: string): Observable<PaystackVerifyResult> {
    return this.http
      .post<ApiResponse<PaystackVerifyResult>>(`${APP_CONFIG.apiBaseUrl}/client/paystack/verify`, { reference })
      .pipe(map((r) => r.data));
  }

  cancelSubscription(): Observable<{ success: boolean; message?: string | null }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message?: string | null }>>(
        `${APP_CONFIG.apiBaseUrl}/client/paystack/cancel`,
        {},
      )
      .pipe(map((r) => r.data));
  }

  checkout(propertyId?: string, planName?: string): Observable<PaystackVerifyResult> {
    return this.initialize(propertyId, planName).pipe(
      switchMap((init) =>
        this.loadScript().pipe(
          switchMap(() => this.openPopup(init)),
          switchMap((reference) => this.verify(reference)),
        ),
      ),
      catchError((err) => {
        if (err?.status === 503) {
          return throwError(() => new Error('Paystack is not configured yet.'));
        }
        return throwError(() => err);
      }),
    );
  }

  private loadScript(): Observable<void> {
    if (this.scriptLoaded && window.PaystackPop) return of(undefined);
    return from(
      new Promise<void>((resolve, reject) => {
        if (window.PaystackPop) {
          this.scriptLoaded = true;
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => {
          this.scriptLoaded = true;
          resolve();
        };
        script.onerror = () => reject(new Error('Could not load Paystack.'));
        document.body.appendChild(script);
      }),
    );
  }

  private openPopup(init: PaystackInitializeResult): Observable<string> {
    return new Observable<string>((subscriber) => {
      const handler = window.PaystackPop?.setup({
        key: init.publicKey,
        access_code: init.accessCode,
        onClose: () => subscriber.error(new Error('Payment cancelled.')),
        callback: (response: { reference?: string }) => {
          const reference = response.reference ?? init.reference;
          subscriber.next(reference);
          subscriber.complete();
        },
      });

      if (!handler) {
        subscriber.error(new Error('Paystack popup unavailable.'));
        return;
      }

      handler.openIframe();
    });
  }
}
