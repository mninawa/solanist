import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `,
  styles: `
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      gap: var(--spacing-md);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    p {
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `,
})
export class LoadingStateComponent {}
