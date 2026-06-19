import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, signupErrorMessage, SignupError } from '../../../core/auth/auth.service';
import { ServicePlan } from '../../../core/models/invite.models';
import { TIME_SLOTS } from '../../../core/data/mock-data';
import { APP_CONFIG, clampPanelCount } from '../../../core/config/app-config';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { PlanCardComponent } from '../../../shared/components/plan-card/plan-card.component';
import { OnboardingStepperComponent } from '../../../shared/components/onboarding-stepper/onboarding-stepper.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { GoogleSignInComponent } from '../../../core/auth/google-sign-in.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    AppLogoComponent,
    AppIconComponent,
    PlanCardComponent,
    OnboardingStepperComponent,
    LoadingStateComponent,
    GoogleSignInComponent,
  ],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(true);
  allowed = signal(false);
  googleClientId = signal<string | null>(null);
  plans = signal<ServicePlan[]>([]);

  step = signal(1);
  selectedPlanId = signal<string | null>(null);

  address = signal('');
  city = signal('');
  postcode = signal('');
  panelCount = signal(12);
  roofType = signal('Tile Roof');
  accessNotes = signal('');

  preferredDate = signal('');
  preferredTimeSlot = signal('');

  firstName = signal('');
  lastName = signal('');
  phone = signal('');
  acceptedTerms = signal(false);

  submitting = signal(false);
  signupError = signal<string | null>(null);

  readonly timeSlots = TIME_SLOTS;
  readonly stepLabels = ['Choose Plan', 'Property', 'Date', 'Account'];
  readonly roofTypes = ['Tile Roof', 'Metal Roof', 'Flat Roof', 'Thatch (special access)'];
  readonly minPanels = APP_CONFIG.minPanelCount;
  readonly maxPanels = APP_CONFIG.maxPanelCount;
  readonly supportEmail = APP_CONFIG.supportEmail;

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.router.navigate(['/client/dashboard']);
      return;
    }

    this.auth.getAuthConfig().subscribe({
      next: (config) => {
        this.googleClientId.set(config.googleClientId);
        this.allowed.set(config.allowSelfSignup);
        if (config.allowSelfSignup) {
          this.auth.getServicePlans().subscribe({
            next: (plans) => {
              this.plans.set(plans);
              const recommended = plans.find((p) => p.recommended) ?? plans[0];
              if (recommended) this.selectedPlanId.set(recommended.id);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  get selectedPlan(): ServicePlan | undefined {
    return this.plans().find((p) => p.id === (this.selectedPlanId() ?? ''));
  }

  get selectedTimeLabel(): string {
    const slot = this.timeSlots.find((s) => s.id === this.preferredTimeSlot());
    return slot ? `${slot.label} (${slot.time})` : '';
  }

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }

  selectPlan(planId: string): void {
    this.selectedPlanId.set(planId);
  }

  updatePanelCount(value: number): void {
    this.panelCount.set(clampPanelCount(value));
  }

  bumpPanels(delta: number): void {
    this.updatePanelCount(this.panelCount() + delta);
  }

  selectRoofType(type: string): void {
    this.roofType.set(type);
  }

  nextFromPlan(): void {
    if (!this.selectedPlanId()) return;
    this.step.set(2);
  }

  nextFromProperty(): void {
    if (!this.address().trim() || !this.city().trim()) return;
    this.panelCount.set(clampPanelCount(this.panelCount()));
    this.step.set(3);
  }

  nextFromDate(): void {
    if (!this.preferredDate() || !this.preferredTimeSlot()) return;
    this.step.set(4);
  }

  back(): void {
    const s = this.step();
    if (s > 1) this.step.set(s - 1);
  }

  onGoogleSignup(idToken: string): void {
    if (!this.acceptedTerms()) {
      this.signupError.set('Please accept the Terms of Service.');
      return;
    }
    if (!this.firstName().trim() || !this.lastName().trim()) {
      this.signupError.set('Please enter your first and last name.');
      return;
    }

    this.submitting.set(true);
    this.signupError.set(null);

    this.auth
      .signupWithGoogleSelf({
        idToken,
        firstName: this.firstName().trim(),
        lastName: this.lastName().trim(),
        phone: this.phone(),
        address: this.address().trim(),
        city: this.city().trim(),
        postcode: this.postcode().trim(),
        selectedPlanId: this.selectedPlanId() ?? undefined,
        preferredServiceDate: this.preferredDate() || undefined,
        preferredTimeSlot: this.preferredTimeSlot() || undefined,
        panelCount: this.panelCount(),
        roofType: this.roofType(),
        accessNotes: this.accessNotes(),
      })
      .subscribe({
        next: () => {
          this.step.set(5);
          this.submitting.set(false);
        },
        error: (err) => {
          const code = err instanceof SignupError ? err.code : 'signup_failed';
          this.signupError.set(signupErrorMessage(code));
          this.submitting.set(false);
        },
      });
  }

  goToDashboard(): void {
    this.router.navigate(['/client/dashboard']);
  }
}
