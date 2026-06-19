import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminReportListItem, AdminReportStats } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    FormsModule,
    LoadingStateComponent,
    EmptyStateComponent,
    AppIconComponent,
  ],
  templateUrl: './admin-reports.component.html',
  styleUrl: './admin-reports.component.scss',
})
export class AdminReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  stats = signal<AdminReportStats | null>(null);
  reports = signal<AdminReportListItem[]>([]);
  loading = signal(true);
  exporting = signal(false);
  search = '';

  ngOnInit(): void {
    this.adminService.getReportStats().subscribe({
      next: (s) => this.stats.set(s),
    });
    this.loadReports();
  }

  loadReports(): void {
    this.loading.set(true);
    this.adminService.getAdminReports(this.search).subscribe({
      next: (rows) => {
        this.reports.set(rows);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    this.loadReports();
  }

  exportJson(): void {
    this.exporting.set(true);
    this.adminService.downloadReportsExport().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `solanist-reports-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  performanceLabel(item: AdminReportListItem): string {
    const gain = item.performance.kwhGain;
    if (gain == null) return 'No meter data';
    const pct = item.performance.gainPercent;
    return pct != null ? `+${gain.toFixed(1)} kWh (${pct.toFixed(1)}%)` : `+${gain.toFixed(1)} kWh`;
  }
}
