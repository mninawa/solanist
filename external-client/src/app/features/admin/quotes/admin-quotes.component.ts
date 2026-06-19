import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLead } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [RouterLink, DecimalPipe, FormsModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-quotes.component.html',
  styleUrl: './admin-quotes.component.scss',
})
export class AdminQuotesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  quotes = signal<AdminLead[]>([]);
  loading = signal(true);
  search = signal('');

  filteredQuotes = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.quotes();
    if (!q) return list;
    return list.filter((l) =>
      [
        l.customerName,
        l.propertyAddress,
        l.city,
        l.quoteSummary?.ref ?? l.quoteRef ?? '',
        l.quoteSummary?.planName ?? l.recommendedPlan ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  });

  totalCount = computed(() => this.quotes().length);
  sentCount = computed(
    () =>
      this.quotes().filter(
        (q) => (q.quoteSummary?.status ?? q.status) === 'sent' || q.status === 'quote_sent',
      ).length,
  );
  acceptedCount = computed(
    () => this.quotes().filter((q) => q.quoteSummary?.status === 'accepted').length,
  );
  pipelineValue = computed(() =>
    this.quotes().reduce((sum, q) => sum + (q.quoteSummary?.price ?? 0), 0),
  );

  ngOnInit(): void {
    this.adminService.getLeads().subscribe({
      next: (leads) => {
        this.quotes.set(
          leads.filter((l) => l.status === 'quoted' || l.status === 'quote_sent' || l.quoteSummary),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  displayStatus(q: AdminLead): string {
    return q.quoteSummary?.status ?? q.status;
  }

  statusClass(q: AdminLead): string {
    const status = this.displayStatus(q);
    if (status === 'accepted' || status === 'converted') return 'pill-active';
    if (status === 'sent' || status === 'quote_sent') return 'pill-quote_sent';
    if (status === 'draft' || status === 'quoted') return 'pill-quoted';
    return 'pill-new';
  }
}
