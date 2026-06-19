import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ServicePlan } from '../../../core/models/invite.models';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <button
      type="button"
      class="plan-card"
      [class.selected]="selected"
      [class.recommended]="plan.recommended"
      [class.compact]="compact"
      (click)="select.emit(plan.id)"
    >
      @if (plan.recommended) {
        <span class="badge">Best Value</span>
      }
      <h3 class="plan-name">{{ plan.name }}</h3>
      <p class="plan-desc">{{ plan.description }}</p>
      <div class="plan-price">
        <span class="price-amount">{{ plan.pricePerVisit | currency: 'ZAR':'symbol-narrow':'1.0-0' }}</span>
        @if (plan.visitsPerYear > 1) {
          <span class="price-unit">/ clean</span>
        }
      </div>
      @if (plan.visitsPerYear === 1) {
        <p class="plan-annual">One-time payment</p>
      } @else {
        <p class="plan-annual">{{ plan.visitsPerYear }} cleans · {{ plan.annualPrice | currency: 'ZAR':'symbol-narrow':'1.0-0' }}/yr</p>
      }
      <ul class="plan-features">
        @for (feature of visibleFeatures; track feature) {
          <li>{{ feature }}</li>
        }
      </ul>
    </button>
  `,
  styles: `
    .plan-card {
      position: relative;
      width: 100%;
      text-align: left;
      background: var(--color-bg-card);
      border: 2px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      cursor: pointer;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      font-family: inherit;
      color: inherit;
    }
    .plan-card.compact {
      padding: var(--spacing-md) var(--spacing-lg);
    }
    .plan-card:hover {
      border-color: var(--color-border-strong);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    .plan-card.selected {
      border-color: var(--color-accent);
      box-shadow: 0 0 0 3px var(--color-accent-muted);
    }
    .plan-card.recommended {
      border-color: var(--color-accent);
    }
    .badge {
      position: absolute;
      top: -10px;
      right: 16px;
      background: var(--color-accent);
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
    }
    .plan-name {
      font-size: 1.0625rem;
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
    }
    .plan-desc {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      margin-bottom: var(--spacing-md);
    }
    .price-amount {
      font-size: 1.625rem;
      font-weight: 700;
      color: var(--color-brand);
    }
    .price-unit {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
    .plan-annual {
      font-size: 0.8125rem;
      color: var(--color-text-muted);
      margin: 4px 0 var(--spacing-md);
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .plan-features li {
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
      padding-left: 18px;
      position: relative;
    }
    .plan-features li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: var(--color-success);
      font-weight: 700;
    }
  `,
})
export class PlanCardComponent {
  @Input({ required: true }) plan!: ServicePlan;
  @Input() selected = false;
  @Input() compact = false;
  @Output() select = new EventEmitter<string>();

  get visibleFeatures(): string[] {
    if (!this.compact) return this.plan.features;
    return this.plan.features.slice(0, 3);
  }
}
