import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { PaystackService } from '../../../core/services/paystack.service';
import { PropertySummary } from '../../../core/models/client.models';
import { ServicePlan } from '../../../core/models/invite.models';
import { PLAN_BENEFITS } from '../../../core/content/client-content';
import { fallbackPropertyImage } from '../../../core/util/property-image';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PlanCardComponent } from '../../../shared/components/plan-card/plan-card.component';

@Component({
  selector: 'app-client-assign-plan-drawer',
  standalone: true,
  imports: [
    CurrencyPipe,
    AppIconComponent,
    LoadingStateComponent,
    PlanCardComponent,
  ],
  templateUrl: './client-assign-plan-drawer.component.html',
  styleUrl: './client-assign-plan-drawer.component.scss',
})
export class ClientAssignPlanDrawerComponent {
  private readonly auth = inject(AuthService);
  private readonly paystack = inject(PaystackService);
  private readonly drawerBody = viewChild<ElementRef>('drawerBody');

  readonly open = input(false);
  readonly property = input<PropertySummary | null>(null);
  readonly closed = output<void>();
  readonly planAssigned = output<PropertySummary>();

  readonly stepLabels = ['Choose plan', 'Payment'];
  readonly planBenefits = PLAN_BENEFITS;

  plans = signal<ServicePlan[]>([]);
  loading = signal(false);
  step = signal(1);
  assignSuccess = signal(false);
  pendingConfirmation = signal(false);
  checkoutBusy = signal(false);
  checkoutError = signal<string | null>(null);
  paystackEnabled = signal(false);
  selectedPlanId = signal<string | null>(null);
  private readonly imageError = signal(false);

  selectedPlan = computed(
    () => this.plans().find((p) => p.id === this.selectedPlanId()) ?? null,
  );

  propertyImage = computed(() => {
    const prop = this.property();
    if (!prop) return fallbackPropertyImage('assign');
    if (prop.imageUrl && !this.imageError()) return prop.imageUrl;
    return fallbackPropertyImage(prop.id);
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        document.body.style.overflow = 'hidden';
        this.loadPlans();
      } else {
        document.body.style.overflow = '';
        this.reset();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open() && !this.checkoutBusy()) this.close();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.checkoutError.set(null);
    this.paystack.getConfig().subscribe({
      next: (cfg) => this.paystackEnabled.set(cfg.enabled),
    });
    this.auth.getServicePlans().subscribe({
      next: (plans) => {
        this.plans.set(plans);
        const recommended = plans.find((p) => p.recommended) ?? plans[0];
        this.selectedPlanId.set(recommended?.id ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  reset(): void {
    this.step.set(1);
    this.assignSuccess.set(false);
    this.pendingConfirmation.set(false);
    this.checkoutBusy.set(false);
    this.checkoutError.set(null);
    this.selectedPlanId.set(null);
    this.imageError.set(false);
  }

  close(): void {
    this.closed.emit();
  }

  selectPlan(id: string): void {
    this.selectedPlanId.set(id);
  }

  continueToPayment(): void {
    if (!this.selectedPlanId()) return;
    this.step.set(2);
    this.checkoutError.set(null);
    this.scrollDrawerTop();
  }

  back(): void {
    if (this.step() === 2) {
      this.step.set(1);
      this.checkoutError.set(null);
      this.scrollDrawerTop();
    } else {
      this.close();
    }
  }

  payWithPaystack(): void {
    const prop = this.property();
    const plan = this.selectedPlan();
    if (!prop || !plan) return;

    this.checkoutBusy.set(true);
    this.checkoutError.set(null);
    this.pendingConfirmation.set(false);
    this.paystack.checkout(prop.id, plan.name).subscribe({
      next: (result) => {
        this.checkoutBusy.set(false);
        // Payment went through; `success` reflects whether the server could confirm
        // and link it immediately. If not, the webhook will finalise it shortly.
        this.pendingConfirmation.set(!result.success);
        this.assignSuccess.set(true);
        this.scrollDrawerTop();
      },
      error: (err: Error) => {
        this.checkoutBusy.set(false);
        this.checkoutError.set(err.message ?? 'Payment could not be completed.');
      },
    });
  }

  finish(): void {
    const prop = this.property();
    if (prop) this.planAssigned.emit(prop);
    this.close();
  }

  onImageError(): void {
    this.imageError.set(true);
  }

  private scrollDrawerTop(): void {
    this.drawerBody()?.nativeElement.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
