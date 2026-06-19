import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { CleaningReport, PropertySummary } from '../../../core/models/client.models';
import { REPORT_INCLUDES_SIDEBAR } from '../../../core/content/client-content';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

type DateFilter = 'all' | '2026' | '2025' | '2024';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-client-reports',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    UpperCasePipe,
    LoadingStateComponent,
    EmptyStateComponent,
    AppIconComponent,
  ],
  templateUrl: './client-reports.component.html',
  styleUrl: './client-reports.component.scss',
})
export class ClientReportsComponent implements OnInit {
  private readonly clientService = inject(ClientService);

  readonly includes = REPORT_INCLUDES_SIDEBAR;
  readonly pageSize = PAGE_SIZE;

  allReports = signal<CleaningReport[]>([]);
  properties = signal<PropertySummary[]>([]);
  loading = signal(true);

  propertyFilter = signal('all');
  dateFilter = signal<DateFilter>('all');
  searchQuery = signal('');
  currentPage = signal(1);

  filteredReports = computed(() => {
    let list = [...this.allReports()];
    const prop = this.propertyFilter();
    const date = this.dateFilter();
    const q = this.searchQuery().trim().toLowerCase();

    if (prop !== 'all') {
      list = list.filter((r) => r.propertyId === prop);
    }
    if (date !== 'all') {
      list = list.filter((r) => r.completedAt.startsWith(date));
    }
    if (q) {
      list = list.filter(
        (r) =>
          r.propertyAddress.toLowerCase().includes(q) ||
          (r.staffName?.toLowerCase().includes(q) ?? false) ||
          r.serviceType.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredReports().length / PAGE_SIZE)));

  pagedReports = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * PAGE_SIZE;
    return this.filteredReports().slice(start, start + PAGE_SIZE);
  });

  totalReports = computed(() => this.allReports().length);

  reportsThisYear = computed(
    () => this.allReports().filter((r) => r.completedAt.startsWith('2026')).length,
  );

  propertiesCovered = computed(() => {
    const names = new Set<string>();
    for (const r of this.allReports()) {
      names.add(r.propertyAddress.split(',')[0]?.trim() ?? r.propertyAddress);
    }
    return [...names];
  });

  lastVisit = computed(() => {
    const sorted = [...this.allReports()].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return sorted[0] ?? null;
  });

  ngOnInit(): void {
    this.clientService.getReports().subscribe({
      next: (data) => {
        this.allReports.set(data);
        this.loading.set(false);
      },
    });
    this.clientService.getProperties().subscribe({
      next: (props) => this.properties.set(props),
    });
  }

  onPropertyFilterChange(value: string): void {
    this.propertyFilter.set(value);
    this.currentPage.set(1);
  }

  onDateFilterChange(value: DateFilter): void {
    this.dateFilter.set(value);
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.currentPage.set(1);
  }

  clearFilters(): void {
    this.propertyFilter.set('all');
    this.dateFilter.set('all');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  propertyName(report: CleaningReport): string {
    return report.propertyAddress.split(',')[0]?.trim() ?? report.propertyAddress;
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }
}
