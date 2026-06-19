import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, tap, catchError, throwError, delay } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthSession, AuthUser, LoginRequest, SignupRequest, GoogleSignupRequest, GoogleSelfSignupRequest, ForgotPasswordRequest, ForgotPasswordResult, ResetPasswordRequest, ResetPasswordResult, AuthConfig } from '../models/auth.models';
import { ServicePlan } from '../models/invite.models';
import { MOCK_PLANS } from '../data/mock-data';
import { UserRole } from '../models/common.models';
import { APP_CONFIG } from '../config/app-config';
import { ApiClientService } from '../http/api-client.service';

const SESSION_KEY = 'solanist_session';

interface ApiEnvelope<T> {
  data: T;
  message?: string | null;
}

export type SignupErrorCode =
  | 'email_exists'
  | 'email_mismatch'
  | 'invalid_invite'
  | 'invite_used'
  | 'expired_invite'
  | 'invalid_plan'
  | 'invalid_request'
  | 'signup_disabled'
  | 'signup_failed';

export class SignupError extends Error {
  constructor(public readonly code: SignupErrorCode) {
    super(code);
  }
}

export function signupErrorMessage(code: string): string {
  switch (code) {
    case 'email_exists':
      return 'This email is already registered. Try logging in instead.';
    case 'email_mismatch':
      return 'Use the Google account that matches the email on this invite.';
    case 'invite_used':
      return 'This invite has already been used.';
    case 'expired_invite':
      return 'This invite link has expired. Contact Solanist for a new quote.';
    case 'invalid_invite':
      return 'Invalid invite code. Check the link and try again.';
    case 'invalid_plan':
      return 'Please select a service plan before creating your account.';
    case 'invalid_request':
      return 'Please fill in all required fields.';
    case 'password_disabled':
      return 'Password sign-up is disabled. Use Google Sign-In.';
    case 'signup_disabled':
      return 'Self-service signup is currently turned off. Please use an invite link.';
    default:
      return 'Could not create account. Please try again.';
  }
}

export function googleLoginErrorMessage(code: string): string {
  switch (code) {
    case 'account_not_found':
      return 'No account found for this Google email. New customers need an invite link to sign up.';
    case 'google_not_configured':
      return 'Google Sign-In is not configured yet.';
    case 'invalid_token':
      return 'Google sign-in failed. Please try again.';
    case 'role_mismatch':
      return 'This Google account cannot sign in here.';
    default:
      return 'Could not sign in with Google.';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly sessionSignal = signal<AuthSession | null>(this.loadSession());

  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionSignal());
  readonly isClient = computed(() => this.user()?.role === 'client');
  readonly isStaff = computed(() => this.user()?.role === 'staff');
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  constructor(
    private readonly api: ApiClientService,
    private readonly http: HttpClient,
  ) {}

  login(request: LoginRequest): Observable<AuthSession> {
    if (APP_CONFIG.mockMode) {
      const session = this.loginMock(request);
      return of(session);
    }

    return this.api.post<AuthSession>('/auth/login', request).pipe(
      tap((session) => this.persist(session)),
    );
  }

  getAuthConfig(): Observable<AuthConfig> {
    if (APP_CONFIG.mockMode) {
      return of({ googleEnabled: false, googleClientId: null, googleOnly: false, allowSelfSignup: true });
    }
    return this.api.get<AuthConfig>('/auth/config');
  }

  getServicePlans(): Observable<ServicePlan[]> {
    if (APP_CONFIG.mockMode) {
      return of(MOCK_PLANS.map((p) => ({ ...p, features: [...p.features] })));
    }
    return this.api
      .get<ServicePlan[]>('/auth/plans')
      .pipe(map((plans) => plans.map((p) => ({ ...p, features: [...p.features] }))));
  }

  loginWithGoogle(idToken: string, portal?: UserRole): Observable<AuthSession> {
    if (APP_CONFIG.mockMode && idToken.startsWith('mock:')) {
      const email = idToken.slice(5).trim().toLowerCase();
      const role = this.resolveRole(email);
      if (portal && role !== portal) {
        return throwError(() => ({ error: { message: 'role_mismatch' } }));
      }
      const session = this.buildSession(email, role, email.split('@')[0]);
      this.persist(session);
      return of(session);
    }

    return this.api.post<AuthSession>('/auth/google', { idToken, portal }).pipe(
      tap((session) => this.persist(session)),
      catchError((err: HttpErrorResponse) =>
        throwError(() => ({ error: { message: err.error?.message ?? 'google_failed' } })),
      ),
    );
  }

  signup(request: SignupRequest): Observable<AuthSession> {
    if (APP_CONFIG.mockMode) {
      const session = this.signupMock(request);
      return of(session);
    }

    return this.http
      .post<ApiEnvelope<AuthSession>>(`${APP_CONFIG.apiBaseUrl}/auth/signup`, request)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new SignupError((response.message as SignupErrorCode) ?? 'signup_failed');
          }
          return response.data;
        }),
        tap((session) => this.persist(session)),
        catchError((err: HttpErrorResponse) => {
          const code = (err.error?.message as SignupErrorCode) ?? 'signup_failed';
          return throwError(() => new SignupError(code));
        }),
      );
  }

  signupWithGoogle(request: GoogleSignupRequest): Observable<AuthSession> {
    if (APP_CONFIG.mockMode && request.idToken.startsWith('mock:')) {
      const email = request.idToken.slice(5).trim().toLowerCase();
      const session = this.buildSession(email, 'client', request.firstName, request.lastName, request.phone);
      this.persist(session);
      return of(session);
    }

    return this.http
      .post<ApiEnvelope<AuthSession>>(`${APP_CONFIG.apiBaseUrl}/auth/signup/google`, request)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new SignupError((response.message as SignupErrorCode) ?? 'signup_failed');
          }
          return response.data;
        }),
        tap((session) => this.persist(session)),
        catchError((err: HttpErrorResponse) => {
          const code = (err.error?.message as SignupErrorCode) ?? 'signup_failed';
          return throwError(() => new SignupError(code));
        }),
      );
  }

  signupWithGoogleSelf(request: GoogleSelfSignupRequest): Observable<AuthSession> {
    if (APP_CONFIG.mockMode && request.idToken.startsWith('mock:')) {
      const email = request.idToken.slice(5).trim().toLowerCase();
      const session = this.buildSession(email, 'client', request.firstName, request.lastName, request.phone);
      this.persist(session);
      return of(session);
    }

    return this.http
      .post<ApiEnvelope<AuthSession>>(`${APP_CONFIG.apiBaseUrl}/auth/signup/self`, request)
      .pipe(
        map((response) => {
          if (!response.data) {
            throw new SignupError((response.message as SignupErrorCode) ?? 'signup_failed');
          }
          return response.data;
        }),
        tap((session) => this.persist(session)),
        catchError((err: HttpErrorResponse) => {
          const code = (err.error?.message as SignupErrorCode) ?? 'signup_failed';
          return throwError(() => new SignupError(code));
        }),
      );
  }

  private signupMock(request: SignupRequest): AuthSession {
    const session = this.buildSession(
      request.email,
      'client',
      request.firstName,
      request.lastName,
      request.phone,
    );
    this.persist(session);
    return session;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.sessionSignal.set(null);
    void this.router.navigateByUrl('/login');
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ForgotPasswordResult> {
    if (APP_CONFIG.mockMode) {
      const accepted = !!request.email.trim();
      const devResetUrl = accepted
        ? `/reset-password?token=mock-${encodeURIComponent(request.email.trim().toLowerCase())}`
        : null;
      return of({ accepted, devResetUrl }).pipe(delay(400));
    }

    return this.api.post<ForgotPasswordResult>('/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<ResetPasswordResult> {
    if (APP_CONFIG.mockMode) {
      if (!request.token || request.newPassword.length < 8)
        return throwError(() => ({ error: { message: 'password_too_short' } }));
      if (request.newPassword !== request.confirmPassword)
        return throwError(() => ({ error: { message: 'password_mismatch' } }));
      return of({ success: true }).pipe(delay(400));
    }

    return this.api.post<ResetPasswordResult>('/auth/reset-password', request);
  }

  getToken(): string | null {
    return this.sessionSignal()?.token ?? null;
  }

  private loginMock(request: LoginRequest): AuthSession {
    const role = this.resolveRole(request.email);
    const session = this.buildSession(request.email, role, request.email.split('@')[0]);
    this.persist(session);
    return session;
  }

  private resolveRole(email: string): UserRole {
    const lower = email.toLowerCase();
    if (lower.includes('admin')) return 'admin';
    if (lower.includes('staff')) return 'staff';
    return 'client';
  }

  private buildSession(
    email: string,
    role: UserRole,
    firstName: string,
    lastName = 'User',
    phone?: string,
  ): AuthSession {
    const user: AuthUser = {
      id: this.newId(),
      email,
      firstName: role === 'admin' ? 'Sarah' : firstName,
      lastName: role === 'admin' ? 'Nkosi' : lastName,
      role,
      phone,
    };
    return { user, token: `mock-token-${user.id}` };
  }

  private persist(session: AuthSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.sessionSignal.set(session);
  }

  private loadSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private newId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
