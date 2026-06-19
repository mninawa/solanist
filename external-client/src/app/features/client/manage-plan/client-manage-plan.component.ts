import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { PaystackService } from '../../../core/services/paystack.service';
import { PropertyPlanDetails, PropertySummary } from '../../../core/models/client.models';
import { APP_CONFIG } from '../../../core/config/app-config';
import { PLAN_BENEFITS } from '../../../core/content/client-content';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { ClientAssignPlanDrawerComponent } from '../assign-plan/client-assign-plan-drawer.component';

interface CalendarCell {
  day: number | null;
  isToday: boolean;
  isHighlighted: boolean;
}

@Component({
  selector: 'app-client-manage-plan',
  standalone: true,
  imports: [RouterLink, DatePipe, CurrencyPipe, TitleCasePipe, LoadingStateComponent, AppIconComponent, ClientAssignPlanDrawerComponent],
  templateUrl: './client-manage-plan.component.html',
  styleUrl: './client-manage-plan.component.scss',
})
export class ClientManagePlanComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly paystack = inject(PaystackService);
  private readonly route = inject(ActivatedRoute);

  readonly config = APP_CONFIG;
  readonly planBenefits = PLAN_BENEFITS;

  planDetails = signal<PropertyPlanDetails | null>(null);
  allProperties = signal<PropertySummary[]>([]);
  loading = signal(true);
  paystackEnabled = signal(false);
  billingBusy = signal(false);
  billingMessage = signal<string | null>(null);
  assignDrawerOpen = signal(false);
  private readonly imageErrors = signal<Set<string>>(new Set());

  otherProperties = computed(() => {
    const current = this.planDetails()?.property.id;
    return this.allProperties().filter((p) => p.id !== current);
  });

  usagePercent = computed(() => {
    const usage = this.planDetails()?.usage;
    if (!usage || !usage.cleansTotal) return 0;
    return Math.round((usage.cleansCompleted / usage.cleansTotal) * 100);
  });

  activePlan = computed(() => this.planDetails()?.plan ?? null);
  activeUsage = computed(() => this.planDetails()?.usage ?? null);
  activeCleaning = computed(() => this.planDetails()?.nextCleaning ?? null);
  activeBilling = computed(() => this.planDetails()?.billing ?? null);

  private calendarRef = computed(() => {
    const cleaning = this.planDetails()?.nextCleaning;
    return cleaning ? new Date(cleaning.date) : new Date();
  });

  calendarMonthLabel = computed(() =>
    this.calendarRef().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
  );

  calendarCells = computed((): CalendarCell[] => {
    const ref = this.calendarRef();
    const year = ref.getFullYear();
    const month = ref.getMonth();
    const today = new Date();
    const cleaning = this.planDetails()?.nextCleaning;
    const highlightDay = cleaning ? new Date(cleaning.date).getDate() : null;
    const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ day: null, isToday: false, isHighlighted: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        isToday:
          today.getFullYear() === year && today.getMonth() === month && today.getDate() === day,
        isHighlighted: day === highlightDay,
      });
    }
    return cells;
  });

  ngOnInit(): void {
    this.paystack.getConfig().subscribe({
      next: (cfg) => this.paystackEnabled.set(cfg.enabled),
    });

    this.clientService.getProperties().subscribe({
      next: (properties) => this.allProperties.set(properties),
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.loading.set(true);
      this.clientService.getPropertyPlan(id).subscribe({
        next: (details) => {
          this.planDetails.set(details);
          this.loading.set(false);
        },
      });
    });
  }

  changePaymentMethod(): void {
    const propertyId = this.planDetails()?.property.id;
    const planName = this.planDetails()?.plan?.name;
    this.billingBusy.set(true);
    this.billingMessage.set(null);
    this.paystack.checkout(propertyId, planName).subscribe({
      next: () => {
        this.billingBusy.set(false);
        this.billingMessage.set('Payment method updated via Paystack.');
        this.reloadPlan(propertyId!);
      },
      error: (err: Error) => {
        this.billingBusy.set(false);
        this.billingMessage.set(err.message ?? 'Paystack checkout failed.');
      },
    });
  }

  cancelPlan(): void {
    if (!confirm('Cancel your Paystack subscription? Future cleans will stop.')) return;
    this.billingBusy.set(true);
    this.billingMessage.set(null);
    this.paystack.cancelSubscription().subscribe({
      next: (result) => {
        this.billingBusy.set(false);
        this.billingMessage.set(result.message ?? (result.success ? 'Subscription cancelled.' : 'Could not cancel.'));
        const propertyId = this.planDetails()?.property.id;
        if (propertyId) this.reloadPlan(propertyId);
      },
      error: (err: Error) => {
        this.billingBusy.set(false);
        this.billingMessage.set(err.message ?? 'Could not cancel subscription.');
      },
    });
  }

  private reloadPlan(propertyId: string): void {
    this.clientService.getPropertyPlan(propertyId).subscribe({
      next: (details) => this.planDetails.set(details),
    });
  }

  openAssignDrawer(): void {
    this.assignDrawerOpen.set(true);
  }

  closeAssignDrawer(): void {
    this.assignDrawerOpen.set(false);
  }

  onPlanAssigned(): void {
    const propertyId = this.planDetails()?.property.id;
    this.closeAssignDrawer();
    if (propertyId) this.reloadPlan(propertyId);
    this.clientService.getProperties().subscribe({
      next: (properties) => this.allProperties.set(properties),
    });
  }

  onImageError(id: string): void {
    this.imageErrors.update((set) => new Set(set).add(id));
  }

  hasImageError(id: string): boolean {
    return this.imageErrors().has(id);
  }
}
