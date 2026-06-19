import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboard, AdminFunnelStage } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { GautengHotspotsMapComponent } from '../../../shared/components/gauteng-hotspots-map/gauteng-hotspots-map.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, LoadingStateComponent, AppIconComponent, GautengHotspotsMapComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  dashboard = signal<AdminDashboard | null>(null);
  loading = signal(true);

  maxRevenueTrend = computed(() => {
    const d = this.dashboard();
    if (!d?.revenueTrendPoints.length) return 1;
    return Math.max(...d.revenueTrendPoints.map((p) => p.amount), 1);
  });

  chartMonthLabel = computed(() => {
    const points = this.dashboard()?.revenueTrendPoints ?? [];
    if (points.length === 0) return '';
    return `${points[0].label} – ${points[points.length - 1].label}`;
  });

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.loading.set(false);
      },
    });
  }

  urgencyClass(urgency: string): string {
    return urgency === 'urgent' ? 'pill-urgent' : 'pill-normal';
  }

  /** Infer trend direction from the human-readable trend string. */
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

  /** Strip a leading arrow glyph so we don't render it twice. */
  trendText(trend: string | null | undefined): string {
    return (trend ?? '').replace(/^[↗↘→]\s*/, '').trim();
  }

  funnelBandWidth(index: number, total: number): number {
    if (total <= 1) return 100;
    const taper = 48;
    return 100 - (index / (total - 1)) * taper;
  }

  funnelDropOff(index: number, funnel: AdminFunnelStage[]): string | null {
    const prev = funnel[index - 1]?.count ?? 0;
    const curr = funnel[index]?.count ?? 0;
    if (prev <= 0 || curr >= prev) return null;
    return `−${Math.round(((prev - curr) / prev) * 100)}%`;
  }
}
