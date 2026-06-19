import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, googleLoginErrorMessage } from '../../../core/auth/auth.service';
import { homeRouteForRole } from '../../../core/auth/auth.constants';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { GoogleSignInComponent } from '../../../core/auth/google-sign-in.component';
import { APP_CONFIG } from '../../../core/config/app-config';
import { UserRole } from '../../../core/models/common.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, AppLogoComponent, GoogleSignInComponent],
  template: `
    <div class="auth-layout">
      <!-- Brand hero -->
      <aside class="auth-hero">
        <div class="hero-orbs" aria-hidden="true">
          <span class="orb orb-1"></span>
          <span class="orb orb-2"></span>
          <span class="orb orb-3"></span>
        </div>

        <div class="hero-top">
          <app-logo variant="light" [showTagline]="true" />
        </div>

        <div class="hero-body">
          <span class="hero-eyebrow">Solar care, simplified</span>
          <h2 class="hero-title">Keep every panel performing at its peak.</h2>
          <p class="hero-text">
            Bookings, cleaning reports, and live energy gains — all in one professional portal for
            customers, field staff, and admins.
          </p>

          <ul class="hero-points">
            <li><span class="tick">✓</span> Automated service scheduling &amp; reminders</li>
            <li><span class="tick">✓</span> Before &amp; after photo reports with kWh gains</li>
            <li><span class="tick">✓</span> One secure portal for every role</li>
          </ul>
        </div>

        <div class="hero-footer">
          <img class="hero-watermark" src="/assets/felidaen-watermark.png" alt="Felidaen" />
          <span class="hero-footer-label">Powered by Felidaen</span>
        </div>
      </aside>

      <!-- Sign-in panel -->
      <main class="auth-panel">
        <div class="auth-card">
          <div class="auth-card-logo">
            <app-logo />
          </div>

          <h1>Welcome back</h1>

          @if (loadingConfig()) {
            <p class="text-sm text-muted center">Loading…</p>
          } @else {
            @if (!googleOnly()) {
              <form (ngSubmit)="onDemoSubmit()">
                <div class="form-group">
                  <label class="form-label" for="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    class="form-input"
                    [(ngModel)]="email"
                    name="email"
                    autocomplete="email"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    class="form-input"
                    [(ngModel)]="password"
                    name="password"
                    autocomplete="current-password"
                    required
                  />
                </div>
                <button type="submit" class="btn btn-primary btn-block" [disabled]="submitting()">
                  {{ submitting() ? 'Signing in…' : 'Sign in' }}
                </button>
              </form>
            }

            @if (googleClientId()) {
              @if (!googleOnly()) {
                <div class="or-divider"><span>or</span></div>
              }
              <div class="google-wrap">
                <app-google-sign-in
                  [clientId]="googleClientId()!"
                  [disabled]="submitting()"
                  (credential)="onGoogleCredential($event)"
                  (loadError)="error.set($event)"
                />
              </div>
            } @else if (!APP_CONFIG.mockMode && googleOnly()) {
              <p class="form-error">Google Sign-In is not configured. Contact support.</p>
            }
          }

          @if (error()) {
            <div class="form-error" [class.with-action]="errorCode() === 'account_not_found'">
              <p>{{ error() }}</p>
              @if (errorCode() === 'account_not_found') {
                <a class="error-action" [href]="'mailto:' + SUPPORT_EMAIL">Request access</a>
              }
            </div>
          }

          <div class="new-customer">
            <p class="new-customer-title">New to Solanist?</p>
            @if (allowSelfSignup()) {
              <p class="new-customer-text">
                Create your account, choose a plan, and book your first clean in a few minutes.
              </p>
              <a class="btn btn-secondary btn-block" routerLink="/signup">Create an account</a>
            } @else {
              <p class="new-customer-text">
                Accounts are created from a personal invite. Use the link your Solanist contact sent
                you, or reach out and we'll get you set up.
              </p>
              <a class="new-customer-link" [href]="'mailto:' + SUPPORT_EMAIL">Request access</a>
            }
          </div>

          <p class="trust-note">
            <span class="lock">🔒</span> Protected with encrypted Google sign-in
          </p>
        </div>
      </main>
    </div>
  `,
  styles: `
    .auth-layout {
      display: grid;
      grid-template-columns: 1.05fr 1fr;
      min-height: 100vh;
      /* transparent so the global Felidaen watermark shows on the panel side */
      background: transparent;
    }

    /* ---- Hero ---- */
    .auth-hero {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: var(--spacing-2xl);
      color: #fff;
      background:
        radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.55), transparent 45%),
        radial-gradient(circle at 80% 0%, rgba(139, 92, 246, 0.45), transparent 40%),
        linear-gradient(155deg, #0b1f4d 0%, #123a8c 45%, #1d4ed8 100%);
    }
    .hero-orbs { position: absolute; inset: 0; z-index: 0; }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(8px);
      opacity: 0.5;
      animation: float 14s ease-in-out infinite;
    }
    .orb-1 {
      width: 280px; height: 280px; top: -60px; right: -40px;
      background: radial-gradient(circle, rgba(249, 115, 22, 0.55), transparent 70%);
    }
    .orb-2 {
      width: 220px; height: 220px; bottom: 10%; left: -50px;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.5), transparent 70%);
      animation-delay: -4s;
    }
    .orb-3 {
      width: 180px; height: 180px; top: 40%; right: 18%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.35), transparent 70%);
      animation-delay: -8s;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) translateX(0); }
      50% { transform: translateY(-26px) translateX(14px); }
    }

    .hero-top,
    .hero-body,
    .hero-footer { position: relative; z-index: 1; }

    .hero-body { max-width: 460px; }
    .hero-eyebrow {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: var(--spacing-md);
    }
    .hero-title {
      font-size: 2.25rem;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 var(--spacing-md);
    }
    .hero-text {
      font-size: 1rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.82);
      margin: 0 0 var(--spacing-xl);
    }
    .hero-points { list-style: none; padding: 0; margin: 0; display: grid; gap: var(--spacing-md); }
    .hero-points li {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.9375rem;
      color: rgba(255, 255, 255, 0.92);
    }
    .tick {
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      flex-shrink: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.16);
      font-size: 0.75rem;
      font-weight: 700;
    }

    .hero-footer {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }
    .hero-watermark {
      height: 40px;
      width: auto;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.95);
      padding: 4px 8px;
      box-shadow: var(--shadow-md);
    }
    .hero-footer-label {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.7);
      letter-spacing: 0.02em;
    }

    /* ---- Panel ---- */
    .auth-panel {
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl) var(--spacing-xl);
    }
    .auth-panel::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background-image: url('/assets/felidaen-watermark.png');
      background-repeat: no-repeat;
      background-position: center center;
      background-size: min(70%, 440px) auto;
      opacity: 0.07;
      mix-blend-mode: multiply;
    }
    .auth-card {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 400px;
      background: var(--color-bg-card);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--spacing-2xl);
    }
    .auth-card-logo { margin-bottom: var(--spacing-xl); }
    h1 { font-size: 1.5rem; margin: 0 0 var(--spacing-xl); letter-spacing: -0.02em; }
    .subtitle { color: var(--color-text-secondary); font-size: 0.9375rem; line-height: 1.55; margin: 0 0 var(--spacing-xl); }
    .center { text-align: center; }
    .google-wrap { display: flex; justify-content: center; }
    .or-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: var(--spacing-lg) 0;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted);
    }
    .or-divider::before,
    .or-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }
    .hints { margin-top: var(--spacing-lg); padding: var(--spacing-md); background: var(--color-bg-primary); border-radius: var(--radius-md); }
    .form-error { margin-top: var(--spacing-md); color: var(--color-error); font-size: 0.875rem; }
    .form-error p { margin: 0; }
    .form-error.with-action {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
    .error-action {
      font-weight: 600;
      color: var(--color-error);
      text-decoration: underline;
    }

    .new-customer {
      margin-top: var(--spacing-xl);
      padding: var(--spacing-lg);
      background: var(--color-bg-primary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      text-align: center;
    }
    .new-customer-title { margin: 0 0 4px; font-size: 0.875rem; font-weight: 600; color: var(--color-text-primary); }
    .new-customer-text { margin: 0 0 var(--spacing-md); font-size: 0.8125rem; line-height: 1.5; color: var(--color-text-secondary); }
    .new-customer-link {
      display: inline-block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary, #2563eb);
    }
    .trust-note {
      margin: var(--spacing-lg) 0 0;
      padding-top: var(--spacing-lg);
      border-top: 1px solid var(--color-border);
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }
    .lock { margin-right: 4px; }

    @media (max-width: 900px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-hero { display: none; }
      .auth-panel { padding: var(--spacing-xl) var(--spacing-md); }
    }

    @media (prefers-reduced-motion: reduce) {
      .orb { animation: none; }
    }
  `,
})
export class LoginComponent implements OnInit {
  readonly APP_CONFIG = APP_CONFIG;
  readonly SUPPORT_EMAIL = 'hello@solanist.co.za';
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  error = signal<string | null>(null);
  errorCode = signal<string | null>(null);
  submitting = signal(false);
  loadingConfig = signal(true);
  googleClientId = signal<string | null>(null);
  googleOnly = signal(false);
  allowSelfSignup = signal(false);

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.router.navigateByUrl(homeRouteForRole(user.role), { replaceUrl: true });
      return;
    }

    this.auth.getAuthConfig().subscribe({
      next: (config) => {
        this.googleClientId.set(config.googleClientId);
        this.googleOnly.set(config.googleOnly);
        this.allowSelfSignup.set(config.allowSelfSignup);
        this.loadingConfig.set(false);
      },
      error: () => this.loadingConfig.set(false),
    });
  }

  onGoogleCredential(idToken: string): void {
    this.error.set(null);
    this.errorCode.set(null);
    this.submitting.set(true);

    this.auth.loginWithGoogle(idToken).subscribe({
      next: (session) => this.navigateHome(session),
      error: (err) => {
        this.submitting.set(false);
        const code = err?.error?.message ?? 'google_failed';
        this.errorCode.set(code);
        this.error.set(googleLoginErrorMessage(code));
      },
    });
  }

  onDemoSubmit(): void {
    const email = this.email.trim();
    if (!email || !this.password) {
      this.error.set('Please enter email and password.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    this.auth.login({ email, password: this.password }).subscribe({
      next: (session) => this.navigateHome(session),
      error: () => {
        this.submitting.set(false);
        this.error.set('Invalid email or password.');
      },
    });
  }

  private navigateHome(session: { user: { role: string } }): void {
    this.submitting.set(false);
    const target = homeRouteForRole(session.user.role as UserRole);
    this.router.navigateByUrl(target, { replaceUrl: true }).catch(() => {
      this.error.set('Could not open your portal. Try again or refresh the page.');
    });
  }
}
