import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InviteService } from '../../../core/services/invite.service';
import { InviteFlowService } from '../../../core/services/invite-flow.service';
import { AuthService, signupErrorMessage, SignupError } from '../../../core/auth/auth.service';
import { InviteData, ServicePlan } from '../../../core/models/invite.models';
import { TIME_SLOTS } from '../../../core/data/mock-data';
import { APP_CONFIG, clampPanelCount } from '../../../core/config/app-config';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { PlanCardComponent } from '../../../shared/components/plan-card/plan-card.component';
import { OnboardingStepperComponent } from '../../../shared/components/onboarding-stepper/onboarding-stepper.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { GoogleSignInComponent } from '../../../core/auth/google-sign-in.component';

@Component({
  selector: 'app-invite-landing',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    FormsModule,
    AppLogoComponent,
    AppIconComponent,
    PlanCardComponent,
    OnboardingStepperComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    RouterLink,
    GoogleSignInComponent,
  ],
  templateUrl: './invite-landing.component.html',
  styleUrl: './invite-landing.component.scss',
})
export class InviteLandingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inviteService = inject(InviteService);
  private readonly flowService = inject(InviteFlowService);
  private readonly auth = inject(AuthService);

  invite = signal<InviteData | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  step = signal(0);
  selectedPlanId = signal<string | null>(null);
  preferredDate = signal('');
  preferredTimeSlot = signal('');
  panelCount = signal(12);
  roofType = signal('Tile Roof');
  accessNotes = signal('Side gate access — please use side entrance.');

  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  acceptedTerms = signal(false);
  submitting = signal(false);
  signupError = signal<string | null>(null);
  googleClientId = signal<string | null>(null);

  readonly timeSlots = TIME_SLOTS;
  readonly stepLabels = ['Choose Plan', 'Property', 'Date', 'Account'];
  readonly roofTypes = ['Tile Roof', 'Metal Roof', 'Flat Roof', 'Thatch (special access)'];
  readonly minPanels = APP_CONFIG.minPanelCount;
  readonly maxPanels = APP_CONFIG.maxPanelCount;

  ngOnInit(): void {
    const code = this.route.snapshot.paramMap.get('inviteCode') ?? '';
    this.auth.getAuthConfig().subscribe({
      next: (config) => this.googleClientId.set(config.googleClientId),
    });
    this.inviteService.getInvite(code).subscribe({
      next: (data) => {
        this.invite.set(data);
        if (data.status !== 'pending' || data.signupBlockedReason) {
          this.flowService.clear();
          this.loading.set(false);
          return;
        }

        this.flowService.initFlow(data.code);
        const flow = this.flowService.flowState();
        if (flow) {
          this.step.set(flow.currentStep);
          if (flow.selectedPlanId) this.selectedPlanId.set(flow.selectedPlanId);
          if (flow.preferredServiceDate) this.preferredDate.set(flow.preferredServiceDate);
          if (flow.preferredTimeSlot) this.preferredTimeSlot.set(flow.preferredTimeSlot);
          if (flow.panelCount) this.panelCount.set(flow.panelCount);
          if (flow.roofType) this.roofType.set(flow.roofType);
          if (flow.accessNotes) this.accessNotes.set(flow.accessNotes);
        }
        if (!this.selectedPlanId()) {
          const recommended = data.plans.find((p) => p.recommended);
          if (recommended) this.selectPlan(recommended.id);
        }
        this.panelCount.set(data.property.panelCount);
        this.roofType.set(data.property.roofType);
        this.accessNotes.set(data.property.accessNotes ?? '');
        const nameParts = data.customerName.split(' ');
        this.firstName.set(nameParts[0] ?? '');
        this.lastName.set(nameParts.slice(1).join(' ') || '');
        this.email.set(data.customerEmail);
        this.phone.set(data.customerPhone);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message ?? 'Invite not found');
        this.loading.set(false);
      },
    });
  }

  signupBlockReason(data: InviteData): string | null {
    if (data.status === 'accepted') return 'invite_used';
    if (data.status === 'expired') return 'expired_invite';
    return data.signupBlockedReason ?? null;
  }

  blockTitle(reason: string): string {
    return signupErrorMessage(reason);
  }

  blockMessage(reason: string): string {
    switch (reason) {
      case 'email_exists':
        return 'This email already has a Solanist account. Log in to manage your properties, bookings, and reports.';
      case 'invite_used':
        return 'An account was already created with this link. Log in to manage your bookings, reports, and subscription.';
      case 'expired_invite':
        return 'Ask your Solanist contact for a fresh invite, or email hello@solanist.co.za for help.';
      default:
        return 'Please contact Solanist for a new quote link.';
    }
  }

  showLoginCta(reason: string): boolean {
    return reason === 'invite_used' || reason === 'email_exists';
  }

  get selectedPlan(): ServicePlan | undefined {
    return this.invite()?.plans.find((p) => p.id === (this.selectedPlanId() ?? ''));
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
    this.flowService.selectPlan(planId);
  }

  startOnboarding(): void {
    const data = this.invite();
    if (!data || data.status !== 'pending' || data.signupBlockedReason) return;
    this.step.set(1);
    this.flowService.setStep(1);
  }

  nextFromPlan(): void {
    if (!this.selectedPlanId()) return;
    this.step.set(2);
    this.flowService.setStep(2);
  }

  nextFromProperty(): void {
    this.panelCount.set(clampPanelCount(this.panelCount()));
    this.flowService.setPropertyDetails(this.panelCount(), this.roofType(), this.accessNotes());
    this.step.set(3);
    this.flowService.setStep(3);
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

  nextFromDate(): void {
    if (!this.preferredDate() || !this.preferredTimeSlot()) return;
    this.flowService.setPreferredDate(this.preferredDate(), this.preferredTimeSlot());
    this.step.set(4);
    this.flowService.setStep(4);
  }

  onGoogleSignup(idToken: string): void {
    if (!this.acceptedTerms()) {
      this.signupError.set('Please accept the Terms of Service.');
      return;
    }
    const invite = this.invite();
    if (!invite) return;

    const flowState = this.flowService.flowState();
    this.submitting.set(true);
    this.signupError.set(null);

    this.auth.signupWithGoogle({
      idToken,
      firstName: this.firstName().trim(),
      lastName: this.lastName().trim(),
      phone: this.phone(),
      inviteCode: invite.code,
      selectedPlanId: flowState?.selectedPlanId ?? undefined,
      preferredServiceDate: flowState?.preferredServiceDate ?? undefined,
      preferredTimeSlot: flowState?.preferredTimeSlot ?? undefined,
      panelCount: this.panelCount(),
      roofType: this.roofType(),
      accessNotes: this.accessNotes(),
    }).subscribe({
      next: () => this.finishSignup(),
      error: (err) => {
        const code = err instanceof SignupError ? err.code : 'signup_failed';
        this.signupError.set(signupErrorMessage(code));
        this.submitting.set(false);
      },
    });
  }

  private finishSignup(): void {
    this.flowService.clear();
    this.step.set(5);
    this.submitting.set(false);
  }

  goToDashboard(): void {
    this.router.navigate(['/client/dashboard']);
  }

  back(): void {
    const s = this.step();
    if (s > 1) this.step.set(s - 1);
    else if (s === 1) this.step.set(0);
  }
}
