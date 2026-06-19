import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ClientService } from '../../../core/services/client.service';
import { Payment } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-client-payments',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, LoadingStateComponent, EmptyStateComponent, AppIconComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Payments</h1>
        <p class="page-subtitle">View your payment history and invoices.</p>
      </header>

      @if (loading()) {
        <app-loading-state />
      } @else if (!payments().length) {
        <app-empty-state iconName="payment" title="No payments yet" message="Your payment history will appear here." />
      } @else {
        <div class="summary-grid">
          <div class="stat-card">
            <div class="stat-label">Total Paid</div>
            <div class="stat-value">{{ totalPaid() | currency: 'ZAR':'symbol-narrow':'1.0-0' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Last Payment</div>
            <div class="stat-value">{{ lastPayment()?.date | date: 'd MMM yyyy' }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Next Payment</div>
            <div class="stat-value">
              {{ nextPaymentDate() ? (nextPaymentDate() | date: 'd MMM yyyy') : '—' }}
            </div>
          </div>
        </div>

        <div class="card mt-lg payments-card">
          <h3 class="section-heading">History</h3>
          <div class="table-wrap">
            <table class="payments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (payment of payments(); track payment.id) {
                  <tr>
                    <td data-label="Date">{{ payment.date | date: 'd MMM yyyy' }}</td>
                    <td data-label="Description">{{ payment.description }}</td>
                    <td data-label="Amount">{{ payment.amount | currency: 'ZAR':'symbol-narrow':'1.0-0' }}</td>
                    <td data-label="Status"><span class="badge badge-success">Paid</span></td>
                    <td>
                      <button type="button" class="icon-btn" aria-label="Download invoice">
                        <app-icon name="download" [size]="18" />
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--spacing-md);
      @media (max-width: 700px) { grid-template-columns: 1fr; }
    }
    .section-heading { font-size: 0.9375rem; font-weight: 600; margin: 0 0 var(--spacing-md); }
    .table-wrap { overflow-x: auto; }
    .payments-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; min-width: 520px; }
    .payments-table th { text-align: left; padding: 8px 12px; color: var(--color-text-muted); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
    .payments-table td { padding: 12px; border-bottom: 1px solid var(--color-border); }
    .icon-btn { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: var(--radius-md); display: inline-flex; }
    .icon-btn:hover { color: var(--color-accent); background: var(--color-bg-hover); }

    @media (max-width: 640px) {
      .payments-table thead { display: none; }
      .payments-table tr { display: block; padding: var(--spacing-md) 0; border-bottom: 1px solid var(--color-border); }
      .payments-table td { display: flex; justify-content: space-between; padding: 6px 0; border: none; }
      .payments-table td::before { content: attr(data-label); color: var(--color-text-muted); font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
      .payments-table { min-width: 0; }
    }
  `,
})
export class ClientPaymentsComponent implements OnInit {
  private readonly clientService = inject(ClientService);
  payments = signal<Payment[]>([]);
  nextPaymentDate = signal<string | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.clientService.getPayments().subscribe({
      next: (p) => { this.payments.set(p); this.loading.set(false); },
    });
    this.clientService.getSubscriptionPortfolio().subscribe({
      next: ({ portfolio }) => this.nextPaymentDate.set(portfolio.nextBillingDate ?? null),
    });
  }

  totalPaid(): number {
    return this.payments().reduce((sum, p) => sum + p.amount, 0);
  }

  lastPayment(): Payment | undefined {
    return this.payments()[0];
  }
}
