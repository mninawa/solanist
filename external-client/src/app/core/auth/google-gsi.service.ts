import { Injectable } from '@angular/core';

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              width?: number;
            },
          ) => void;
        };
      };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleGsiService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Google Sign-In failed to load')));
        return;
      }

      const script = document.createElement('script');
      script.src = GSI_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google Sign-In failed to load'));
      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  async renderButton(
    host: HTMLElement,
    clientId: string,
    onCredential: (credential: string) => void,
  ): Promise<void> {
    await this.load();
    if (!window.google?.accounts?.id) throw new Error('Google Sign-In unavailable');

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) onCredential(response.credential);
      },
    });

    host.innerHTML = '';
    window.google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      width: 360,
    });
  }
}
