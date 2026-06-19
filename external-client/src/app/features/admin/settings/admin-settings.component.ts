import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthConfig } from '../../../core/models/auth.models';
import {
  AdminPortalSettings,
  AdminSubscriptionPlan,
  AdminIntegrationStatus,
  UpsertServicePlanRequest,
} from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

interface QuickLink {
  label: string;
  detail: string;
  path: string;
  icon: 'users' | 'report' | 'subscription' | 'calendar' | 'jobs' | 'link';
}

type PlanEditorMode = 'create' | 'edit';

interface PlanFormState {
  name: string;
  description: string;
  pricePerVisit: number;
  visitsPerYear: number;
  featuresText: string;
  popular: boolean;
  active: boolean;
  paystackPlanCode: string;
  paystackInterval: string;
}

const PAYSTACK_INTERVALS = [
  { value: 'once', label: 'Once-off (no Paystack plan)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'biannually', label: 'Bi-annually' },
  { value: 'annually', label: 'Annually' },
];

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [LoadingStateComponent, DecimalPipe, FormsModule, RouterLink, AppIconComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
})
export class AdminSettingsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);

  settings = signal<AdminPortalSettings | null>(null);
  plans = signal<AdminSubscriptionPlan[]>([]);
  authConfig = signal<AuthConfig | null>(null);
  loading = signal(true);
  saving = signal(false);
  syncingId = signal<string | null>(null);
  planMessage = signal<string | null>(null);
  planError = signal<string | null>(null);
  copied = signal(false);

  readonly currentUser = computed(() => this.auth.user());

  readonly quickLinks: QuickLink[] = [
    { label: 'Staff & access', detail: 'Add, edit roles, remove', path: '/admin/staff', icon: 'users' },
    { label: 'Service reports', detail: 'Cleaning outcomes & AI export', path: '/admin/reports', icon: 'report' },
    { label: 'Subscriptions', detail: 'Plans, MRR, renewals', path: '/admin/subscriptions', icon: 'subscription' },
    { label: 'Schedule', detail: 'Route planning by area', path: '/admin/schedule', icon: 'calendar' },
  ];

  editorOpen = signal(false);
  editorMode = signal<PlanEditorMode>('create');
  editingPlanId = signal<string | null>(null);
  form = signal<PlanFormState>(this.emptyForm());

  readonly paystackIntervals = PAYSTACK_INTERVALS;
  readonly activePlans = computed(() => this.plans().filter((p) => p.active !== false));

  planCadence(plan: AdminSubscriptionPlan): string {
    const visits = plan.visitsPerYear ?? 1;
    if (visits <= 1) return 'per clean · once-off';
    if (visits === 2) return 'per clean · twice a year';
    if (visits === 4) return 'per clean · quarterly';
    if (visits === 12) return 'per clean · monthly';
    return `per clean · ${visits}× per year`;
  }

  billingLabel(plan: AdminSubscriptionPlan): string {
    if (plan.paystackLinked && plan.paystackPlanCode) return plan.paystackPlanCode;
    if (plan.paystackInterval === 'once') return 'One-time payment — no Paystack plan';
    return 'Not linked to Paystack';
  }

  billingTone(plan: AdminSubscriptionPlan): 'linked' | 'pending' | 'neutral' {
    if (plan.paystackLinked) return 'linked';
    if (plan.paystackInterval === 'once') return 'neutral';
    return 'pending';
  }

  showPaystackSync(plan: AdminSubscriptionPlan): boolean {
    return !plan.paystackLinked && plan.paystackInterval !== 'once';
  }

  ngOnInit(): void {
    this.adminService.getPortalSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.auth.getAuthConfig().subscribe({
      next: (config) => this.authConfig.set(config),
    });
    this.loadPlans();
  }

  signInMethod(): string {
    const config = this.authConfig();
    if (!config) return 'Loading…';
    if (config.googleOnly) return 'Google SSO (enforced)';
    if (config.googleEnabled) return 'Google SSO + password';
    return 'Email & password';
  }

  copyAppUrl(url: string): void {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 1800);
      })
      .catch(() => {
        /* clipboard unavailable */
      });
  }

  statusLabel(status: AdminIntegrationStatus): string {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'demo':
        return 'Demo';
      default:
        return 'Not configured';
    }
  }

  integrationIcon(key: string): 'shield' | 'wallet' | 'camera' | 'link' | 'mail' | 'chat' {
    switch (key) {
      case 'paystack':
        return 'wallet';
      case 's3':
        return 'camera';
      case 'bark':
        return 'link';
      case 'email':
        return 'mail';
      case 'whatsapp':
        return 'chat';
      default:
        return 'shield';
    }
  }

  openCreatePlan(): void {
    this.editorMode.set('create');
    this.editingPlanId.set(null);
    this.form.set(this.emptyForm());
    this.planError.set(null);
    this.planMessage.set(null);
    this.editorOpen.set(true);
  }

  openEditPlan(plan: AdminSubscriptionPlan): void {
    this.editorMode.set('edit');
    this.editingPlanId.set(plan.id);
    this.form.set({
      name: plan.name,
      description: plan.description ?? '',
      pricePerVisit: plan.price,
      visitsPerYear: plan.visitsPerYear ?? 4,
      featuresText: plan.features.join('\n'),
      popular: plan.popular ?? false,
      active: plan.active !== false,
      paystackPlanCode: plan.paystackPlanCode ?? '',
      paystackInterval: plan.paystackInterval ?? 'quarterly',
    });
    this.planError.set(null);
    this.planMessage.set(null);
    this.editorOpen.set(true);
  }

  closeEditor(): void {
    this.editorOpen.set(false);
  }

  patchForm(patch: Partial<PlanFormState>): void {
    this.form.update((f) => ({ ...f, ...patch }));
  }

  savePlan(): void {
    const f = this.form();
    if (!f.name.trim()) {
      this.planError.set('Plan name is required.');
      return;
    }

    const payload: UpsertServicePlanRequest = {
      name: f.name.trim(),
      description: f.description.trim(),
      pricePerVisit: Number(f.pricePerVisit),
      visitsPerYear: Number(f.visitsPerYear),
      features: f.featuresText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      popular: f.popular,
      active: f.active,
      paystackPlanCode: f.paystackPlanCode.trim() || null,
      paystackInterval: f.paystackInterval,
    };

    this.saving.set(true);
    this.planError.set(null);

    const request =
      this.editorMode() === 'edit' && this.editingPlanId()
        ? this.adminService.updateServicePlan(this.editingPlanId()!, payload)
        : this.adminService.createServicePlan(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.editorOpen.set(false);
        this.planMessage.set(this.editorMode() === 'edit' ? 'Plan updated.' : 'Plan created.');
        this.loadPlans();
      },
      error: () => {
        this.saving.set(false);
        this.planError.set('Could not save plan — check values and try again.');
      },
    });
  }

  syncPaystack(plan: AdminSubscriptionPlan): void {
    this.syncingId.set(plan.id);
    this.planMessage.set(null);
    this.planError.set(null);

    this.adminService.syncServicePlanPaystack(plan.id).subscribe({
      next: (result) => {
        this.syncingId.set(null);
        if (result.plan.paystackLinked) {
          this.planError.set(null);
          this.planMessage.set(result.message ?? `Linked to ${result.plan.paystackPlanCode}.`);
        } else {
          this.planMessage.set(null);
          this.planError.set(result.message ?? 'Paystack sync failed.');
        }
        this.loadPlans();
      },
      error: () => {
        this.syncingId.set(null);
        this.planError.set('Paystack sync failed.');
      },
    });
  }

  deactivatePlan(plan: AdminSubscriptionPlan): void {
    if (!confirm(`Deactivate "${plan.name}"? It will no longer appear on new invites.`)) return;

    this.adminService.deactivateServicePlan(plan.id).subscribe({
      next: () => {
        this.planMessage.set(`"${plan.name}" deactivated.`);
        this.loadPlans();
      },
      error: () => this.planError.set('Could not deactivate plan.'),
    });
  }

  private loadPlans(): void {
    this.adminService.getSubscriptionPlans().subscribe({
      next: (plans) => this.plans.set(plans.map((p) => ({ ...p, features: [...p.features] }))),
    });
  }

  private emptyForm(): PlanFormState {
    return {
      name: '',
      description: '',
      pricePerVisit: 499,
      visitsPerYear: 4,
      featuresText: '',
      popular: false,
      active: true,
      paystackPlanCode: '',
      paystackInterval: 'quarterly',
    };
  }
}
