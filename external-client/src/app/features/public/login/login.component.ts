import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, googleLoginErrorMessage } from '../../../core/auth/auth.service';
import { homeRouteForRole } from '../../../core/auth/auth.constants';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { GoogleSignInComponent } from '../../../core/auth/google-sign-in.component';
import { APP_CONFIG } from '../../../core/config/app-config';
import { UserRole } from '../../../core/models/common.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    AppLogoComponent,
    AppIconComponent,
    GoogleSignInComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  readonly APP_CONFIG = APP_CONFIG;
  readonly SUPPORT_EMAIL = 'hello@solanist.co.za';
  readonly WAITLIST_MAILTO =
    'mailto:hello@solanist.co.za?subject=Solanist%20waitlist%20%E2%80%94%20count%20me%20in';

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
