import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, of, switchMap, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';

interface ApiResponse<T> {
  data: T;
  message?: string | null;
}

function paystackErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as ApiResponse<unknown> | null;
    const apiMessage = body?.message?.trim();
    if (apiMessage) {
      if (apiMessage.startsWith('paystack_initialize_failed:')) {
        const detail = apiMessage.slice('paystack_initialize_failed:'.length).trim();
        if (/invalid key|authorization/i.test(detail))
          return 'Paystack API keys are invalid — check Render env vars for the BFF service.';
        if (/plan/i.test(detail))
          return 'Paystack plan is invalid or missing — checkout will use a one-time charge. Link a valid PLN_ code in Admin Settings.';
        return detail || 'Paystack could not start checkout.';
      }
      if (apiMessage === 'customer_not_linked')
        return 'Your account is not linked to a customer profile. Contact support.';
      if (apiMessage === 'email_required')
        return 'Your profile needs an email address before paying with Paystack.';
      if (apiMessage === 'invalid_email')
        return 'Your profile email is invalid — update it in Account settings or sign in with Google again.';
      if (apiMessage === 'paystack_not_configured')
        return 'Paystack is not configured yet.';
      return apiMessage;
    }
    if (err.status === 502)
      return 'Paystack checkout failed — check BFF logs on Render for details.';
  }
  if (err instanceof Error && err.message)
    return err.message;
  return 'Payment could not be completed.';
}

export interface PaystackConfig {
  enabled: boolean;
  publicKey: string | null;
}

export interface PaystackInitializeResult {
  accessCode: string;
  reference: string;
  publicKey: string;
  email: string;
  planCode?: string | null;
  currency?: string;
}

export interface PaystackVerifyResult {
  success: boolean;
  paymentMethod?: string | null;
  subscriptionStatus?: string | null;
}

interface PaystackTransaction {
  reference?: string;
  status?: string;
}

interface PaystackResumeOptions {
  onSuccess?: (transaction: PaystackTransaction) => void;
  onLoad?: (response: unknown) => void;
  onCancel?: () => void;
  onError?: (error: { message?: string }) => void;
}

interface PaystackPopInstance {
  resumeTransaction(accessCode: string, options?: PaystackResumeOptions): void;
}

declare global {
  interface Window {
    PaystackPop?: new () => PaystackPopInstance;
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
      catchError((err) => throwError(() => new Error(paystackErrorMessage(err)))),
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
        script.src = 'https://js.paystack.co/v2/inline.js';
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
      const PaystackPop = window.PaystackPop;
      if (!PaystackPop) {
        subscriber.error(new Error('Paystack popup unavailable.'));
        return;
      }

      const popup = new PaystackPop();
      popup.resumeTransaction(init.accessCode, {
        onSuccess: (transaction) => {
          subscriber.next(transaction?.reference ?? init.reference);
          subscriber.complete();
        },
        onCancel: () => subscriber.error(new Error('Payment cancelled.')),
        onError: (error) =>
          subscriber.error(new Error(error?.message ?? 'Paystack checkout failed.')),
      });
    });
  }
}
