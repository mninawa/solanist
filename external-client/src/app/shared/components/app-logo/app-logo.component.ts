import { Component, Input, computed, signal } from '@angular/core';

export type LogoVariant = 'dark' | 'light';
export type LogoLayout = 'horizontal' | 'stacked' | 'icon';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Renders the official Solanist brand lockup using the assets shipped under
 * /assets/brand. The component exposes three axes:
 *   - `layout`   horizontal (default) | stacked | icon-only
 *   - `variant`  dark   = dark text   (use on light backgrounds)
 *                light  = white text  (use on dark backgrounds)
 *   - `size`     sm | md | lg | xl  (controls rendered height)
 *
 * The legacy `showTagline` input is preserved for compatibility but ignored —
 * the brand asset now bakes in the "SOLAR PANEL CARE" tagline as part of the
 * primary horizontal lockup.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span
      class="logo"
      [class.logo-sm]="size === 'sm'"
      [class.logo-md]="size === 'md'"
      [class.logo-lg]="size === 'lg'"
      [class.logo-xl]="size === 'xl'"
      [class.logo-stacked]="layout === 'stacked'"
      [class.logo-icon-only]="layout === 'icon'"
    >
      <img [src]="src()" [alt]="alt" [width]="dims().w" [height]="dims().h" />
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      line-height: 0;
    }
    img {
      display: block;
      height: 100%;
      width: auto;
      max-width: 100%;
      object-fit: contain;
    }

    /* Horizontal lockup heights */
    .logo-sm { height: 28px; }
    .logo-md { height: 36px; }
    .logo-lg { height: 48px; }
    .logo-xl { height: 64px; }

    /* Stacked lockup heights — bigger because text sits below the mark */
    .logo-stacked.logo-sm { height: 44px; }
    .logo-stacked.logo-md { height: 64px; }
    .logo-stacked.logo-lg { height: 88px; }
    .logo-stacked.logo-xl { height: 120px; }

    /* Icon-only — square */
    .logo-icon-only.logo-sm { height: 24px; width: 24px; }
    .logo-icon-only.logo-md { height: 32px; width: 32px; }
    .logo-icon-only.logo-lg { height: 44px; width: 44px; }
    .logo-icon-only.logo-xl { height: 64px; width: 64px; }
  `,
})
export class AppLogoComponent {
  @Input() set size(value: LogoSize) {
    this._size.set(value);
  }
  get size(): LogoSize {
    return this._size();
  }

  @Input() set variant(value: LogoVariant | 'default') {
    this._variant.set(value === 'default' ? 'dark' : value);
  }
  get variant(): LogoVariant {
    return this._variant();
  }

  @Input() set layout(value: LogoLayout) {
    this._layout.set(value);
  }
  get layout(): LogoLayout {
    return this._layout();
  }

  // Retained for backwards compatibility — the brand lockup already
  // includes the tagline so this is no longer needed.
  @Input() showTagline = false;

  @Input() alt = 'Solanist — Solar Panel Care';

  private readonly _size = signal<LogoSize>('md');
  private readonly _variant = signal<LogoVariant>('dark');
  private readonly _layout = signal<LogoLayout>('horizontal');

  readonly src = computed(() => {
    const layout = this._layout();
    const variant = this._variant();
    if (layout === 'icon') return '/assets/brand/solanist-icon.png';
    if (layout === 'stacked') return '/assets/brand/solanist-stacked-light.png';
    return variant === 'light'
      ? '/assets/brand/solanist-horizontal-light.png'
      : '/assets/brand/solanist-horizontal-dark.png';
  });

  // Intrinsic dimensions help the browser reserve layout space and avoid CLS.
  // Aspect ratios were measured from the source PNGs.
  readonly dims = computed(() => {
    switch (this._layout()) {
      case 'icon':
        return { w: 1, h: 1 };
      case 'stacked':
        return { w: 4, h: 5 };
      default:
        return { w: 78, h: 22 };
    }
  });
}
