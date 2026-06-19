import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterLink, AppLogoComponent, AppIconComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  submitted = signal(false);
  submitting = signal(false);
  devResetUrl = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.auth.getAuthConfig().subscribe({
      next: (config) => {
        if (config.googleOnly) {
          void this.router.navigateByUrl('/login', { replaceUrl: true });
        }
      },
    });
  }

  onSubmit(): void {
    const email = this.email.trim();
    if (!email) return;

    this.submitting.set(true);
    this.error.set(null);
    this.auth.forgotPassword({ email }).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.devResetUrl.set(result.devResetUrl ?? null);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }
}
