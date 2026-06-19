import { RouterLink } from '@angular/router';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminScheduleSlot,
  AdminSubscriptionPlan,
  AdminSubscriptionRow,
  AdminSubscriptionStats,
} from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [DecimalPipe, RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-subscriptions.component.html',
  styleUrl: './admin-subscriptions.component.scss',
})
export class AdminSubscriptionsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  stats = signal<AdminSubscriptionStats | null>(null);
  rows = signal<AdminSubscriptionRow[]>([]);
  plans = signal<AdminSubscriptionPlan[]>([]);
  schedule = signal<AdminScheduleSlot[]>([]);
  loading = signal(true);
  search = signal('');

  filteredRows = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.rows();
    if (!q) return list;
    return list.filter((r) =>
      [r.customerName, r.location, r.planType, r.paymentStatus, r.planStatus]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  });

  ngOnInit(): void {
    this.adminService.getSubscriptionStats().subscribe({ next: (s) => this.stats.set(s) });
    this.adminService.getSubscriptions().subscribe({
      next: (r) => {
        this.rows.set(r);
        this.loading.set(false);
      },
    });
    this.adminService.getSubscriptionPlans().subscribe({ next: (p) => this.plans.set(p) });
    this.adminService.getScheduleSlots().subscribe({ next: (s) => this.schedule.set(s) });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  paymentClass(status: string): string {
    return `pill-${status}`;
  }

  planStatusClass(status: string): string {
    return status === 'active' ? 'pill-active' : 'pill-paused';
  }

  trendDirection(trend: string | null | undefined): 'up' | 'down' | 'neutral' {
    if (!trend) return 'neutral';
    const t = trend.toLowerCase().trim();
    if (t.startsWith('-') || t.startsWith('−') || t.startsWith('↘') || t.includes('down') || t.includes('-')) {
      return 'down';
    }
    if (t.startsWith('+') || t.startsWith('↗') || t.includes('up') || t.includes('+')) {
      return 'up';
    }
    return 'neutral';
  }

  trendArrow(trend: string | null | undefined): string {
    const dir = this.trendDirection(trend);
    return dir === 'down' ? '↘' : dir === 'up' ? '↗' : '→';
  }

  trendText(trend: string | null | undefined): string {
    return (trend ?? '').replace(/^[↗↘→]\s*/, '').trim();
  }
}
