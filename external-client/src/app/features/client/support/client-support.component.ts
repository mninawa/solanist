import { Component } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-client-support',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1 class="page-title">Support</h1>
        <p class="page-subtitle">Get help with your solar care plan.</p>
      </header>

      <div class="support-grid">
        <div class="card support-option">
          <div class="support-icon">
            <app-icon name="chat" [size]="28" />
          </div>
          <h3>WhatsApp</h3>
          <p>Fastest way to reach our team.</p>
          <a [href]="'https://wa.me/' + config.supportWhatsApp" target="_blank" class="btn btn-whatsapp btn-block">
            Chat on WhatsApp
          </a>
        </div>
        <div class="card support-option">
          <div class="support-icon">
            <app-icon name="phone" [size]="28" />
          </div>
          <h3>Phone</h3>
          <p>Mon–Fri, 8am–5pm SAST</p>
          <a [href]="'tel:' + config.supportPhone" class="btn btn-primary btn-block">
            {{ config.supportPhone }}
          </a>
        </div>
        <div class="card support-option">
          <div class="support-icon">
            <app-icon name="mail" [size]="28" />
          </div>
          <h3>Email</h3>
          <p>We respond within 24 hours.</p>
          <a [href]="'mailto:' + config.supportEmail" class="btn btn-secondary btn-block">
            {{ config.supportEmail }}
          </a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .support-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); @media (max-width: 800px) { grid-template-columns: 1fr; } }
    .support-option { text-align: center; }
    .support-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: var(--radius-full);
      background: var(--color-accent-muted);
      color: var(--color-accent);
      margin-bottom: var(--spacing-md);
    }
    .support-option h3 { font-size: 1rem; font-weight: 600; margin: 0 0 var(--spacing-sm); }
    .support-option p { font-size: 0.875rem; color: var(--color-text-secondary); margin: 0 0 var(--spacing-lg); }
    .btn-whatsapp { display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
  `,
})
export class ClientSupportComponent {
  readonly config = APP_CONFIG;
}
