import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="logo" [class.logo-sm]="size === 'sm'" [class.logo-light]="variant === 'light'">
      <span class="logo-icon">
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <rect
            width="32"
            height="32"
            rx="8"
            [attr.fill]="variant === 'light' ? 'rgba(255,255,255,0.16)' : '#2563eb'"
          />
          <g fill="#ffffff">
            <path d="M6 15 L12 15 L16 4 L10 4 Z" />
            <path d="M16 15 L22 15 L26 4 L20 4 Z" />
            <path d="M6 28 L12 28 L16 17 L10 17 Z" />
            <path d="M16 28 L22 28 L26 17 L20 17 Z" />
          </g>
        </svg>
      </span>
      <span class="logo-text">
        <span class="logo-brand">Solanist</span>
        @if (size !== 'sm' && showTagline) {
          <span class="logo-tagline">Solar Care</span>
        }
      </span>
    </div>
  `,
  styles: `
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon svg {
      width: 32px;
      height: 32px;
    }
    .logo-sm .logo-icon svg {
      width: 28px;
      height: 28px;
    }
    .logo-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .logo-brand {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-text-primary);
      letter-spacing: -0.03em;
    }
    .logo-light .logo-brand {
      color: #ffffff;
    }
    .logo-sm .logo-brand {
      font-size: 1rem;
    }
    .logo-tagline {
      font-size: 0.625rem;
      font-weight: 500;
      color: var(--color-text-muted);
      letter-spacing: 0.04em;
    }
    .logo-light .logo-tagline {
      color: rgba(255, 255, 255, 0.7);
    }
  `,
})
export class AppLogoComponent {
  @Input() size: 'sm' | 'md' = 'md';
  @Input() variant: 'default' | 'light' = 'default';
  @Input() showTagline = false;
}
