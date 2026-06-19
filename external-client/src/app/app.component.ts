import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="app-shell">
      <div class="felidaen-watermark" aria-hidden="true"></div>
      <div class="app-shell__content">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .app-shell {
      position: relative;
      min-height: 100vh;
      isolation: isolate;
    }

    .app-shell__content {
      position: relative;
      z-index: 1;
      min-height: 100vh;
    }
  `,
})
export class AppComponent {}
