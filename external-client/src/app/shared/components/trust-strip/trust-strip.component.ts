import { Component } from '@angular/core';

@Component({
  selector: 'app-trust-strip',
  standalone: true,
  template: `
    <div class="trust-strip">
      <div class="trust-item">
        <span class="trust-icon">🛡</span>
        <span>Fully insured</span>
      </div>
      <div class="trust-item">
        <span class="trust-icon">⭐</span>
        <span>4.9★ rated</span>
      </div>
      <div class="trust-item">
        <span class="trust-icon">🌿</span>
        <span>Eco-friendly</span>
      </div>
      <div class="trust-item">
        <span class="trust-icon">📋</span>
        <span>Photo reports</span>
      </div>
    </div>
  `,
  styles: `
    .trust-strip {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: 0.8125rem;
      color: var(--color-text-secondary);
    }
    .trust-icon {
      font-size: 1rem;
    }
  `,
})
export class TrustStripComponent {}
