import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, AppLogoComponent, AppIconComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  token = '';
  newPassword = '';
  confirmPassword = '';
  submitting = signal(false);
  completed = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.getAuthConfig().subscribe({
      next: (config) => {
        if (config.googleOnly) {
          void this.router.navigateByUrl('/login', { replaceUrl: true });
          return;
        }
        this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
        if (!this.token) {
          this.error.set('This reset link is invalid. Request a new one from the sign-in page.');
        }
      },
    });
  }

  onSubmit(): void {
    if (!this.token) return;

    if (this.newPassword.length < 8) {
      this.error.set('Password must be at least 8 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.submitting.set(true);
    this.error.set(null);
    this.auth
      .resetPassword({
        token: this.token,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.completed.set(true);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(this.errorMessage(err?.error?.message));
        },
      });
  }

  private errorMessage(code?: string): string {
    switch (code) {
      case 'password_too_short':
        return 'Password must be at least 8 characters.';
      case 'password_mismatch':
        return 'Passwords do not match.';
      case 'expired_token':
        return 'This reset link has expired. Request a new one.';
      case 'invalid_token':
        return 'This reset link is invalid. Request a new one.';
      default:
        return 'Could not reset password. Please try again.';
    }
  }
}
