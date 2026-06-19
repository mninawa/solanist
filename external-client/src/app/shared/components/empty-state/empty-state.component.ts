import { Component, Input } from '@angular/core';
import { AppIconComponent, AppIconName } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="empty-state">
      <div class="icon-wrap">
        <app-icon [name]="iconName" [size]="40" />
      </div>
      <h3>{{ title }}</h3>
      @if (message) {
        <p>{{ message }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty-state {
      text-align: center;
      padding: var(--spacing-2xl) var(--spacing-lg);
    }
    .icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: var(--radius-full);
      background: var(--color-accent-muted);
      color: var(--color-accent);
      margin-bottom: var(--spacing-md);
    }
    h3 {
      font-size: 1.125rem;
      color: var(--color-text-primary);
      margin-bottom: var(--spacing-sm);
    }
    p {
      color: var(--color-text-muted);
      font-size: 0.875rem;
      max-width: 360px;
      margin: 0 auto;
    }
  `,
})
export class EmptyStateComponent {
  @Input() iconName: AppIconName = 'empty';
  @Input({ required: true }) title!: string;
  @Input() message?: string;
}
