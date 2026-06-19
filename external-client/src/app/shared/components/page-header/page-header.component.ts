import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">{{ title }}</h1>
        @if (subtitle) {
          <p class="page-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="actions">
        <ng-content select="[actions]" />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 var(--spacing-xs);
    }
    .page-subtitle {
      font-size: 0.9375rem;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-shrink: 0;
    }
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
