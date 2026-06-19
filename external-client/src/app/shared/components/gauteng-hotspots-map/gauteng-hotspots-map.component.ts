import { Component, computed, input } from '@angular/core';
import { AdminHotspot } from '../../../core/models/admin.models';
import { resolveGautengAreaPosition } from '../../utils/gauteng-area-coords';

interface HotspotPoint extends AdminHotspot {
  x: number;
  y: number;
  radius: number;
  rank: number;
}

@Component({
  selector: 'app-gauteng-hotspots-map',
  standalone: true,
  template: `
    <div class="hotspots-map" role="img" [attr.aria-label]="ariaLabel()">
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="gauteng-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(245, 166, 35, 0.08)" />
            <stop offset="100%" stop-color="rgba(245, 166, 35, 0.02)" />
          </linearGradient>
          <radialGradient id="hotspot-glow">
            <stop offset="0%" stop-color="rgba(245, 166, 35, 0.9)" />
            <stop offset="100%" stop-color="rgba(245, 166, 35, 0)" />
          </radialGradient>
        </defs>

        <!-- Simplified Gauteng outline -->
        <path
          class="region-outline"
          d="M 48 18 L 120 14 L 168 28 L 188 52 L 182 88 L 168 118 L 142 148 L 108 168 L 72 162 L 42 138 L 28 108 L 22 72 L 32 42 Z"
        />
        <path
          class="region-fill"
          d="M 48 18 L 120 14 L 168 28 L 188 52 L 182 88 L 168 118 L 142 148 L 108 168 L 72 162 L 42 138 L 28 108 L 22 72 L 32 42 Z"
        />

        <!-- Grid lines -->
        @for (x of gridLines; track x) {
          <line [attr.x1]="x" y1="10" [attr.x2]="x" y2="270" class="grid-line" />
        }
        @for (y of gridLinesY; track y) {
          <line x1="10" [attr.y1]="y" x2="390" [attr.y2]="y" class="grid-line" />
        }

        <text x="200" y="268" class="region-label">Gauteng</text>

        @for (point of points(); track point.area) {
          <g class="hotspot" [class.top-rank]="point.rank <= 3">
            <circle
              [attr.cx]="point.x * 4"
              [attr.cy]="point.y * 2.8"
              [attr.r]="point.radius + 6"
              fill="url(#hotspot-glow)"
              opacity="0.35"
            />
            <circle
              [attr.cx]="point.x * 4"
              [attr.cy]="point.y * 2.8"
              [attr.r]="point.radius"
              class="hotspot-dot"
            />
            @if (point.rank <= 3) {
              <text
                [attr.x]="point.x * 4"
                [attr.y]="point.y * 2.8 - point.radius - 6"
                class="hotspot-label"
                text-anchor="middle"
              >
                {{ point.area }}
              </text>
            }
            <title>{{ point.area }}: {{ point.leads }} leads</title>
          </g>
        }
      </svg>
    </div>
  `,
  styles: `
    .hotspots-map {
      height: 140px;
      margin-bottom: 12px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      overflow: hidden;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .region-fill {
      fill: url(#gauteng-fill);
      stroke: none;
    }

    .region-outline {
      fill: none;
      stroke: rgba(245, 166, 35, 0.25);
      stroke-width: 1.5;
      stroke-dasharray: 4 3;
    }

    .grid-line {
      stroke: rgba(255, 255, 255, 0.04);
      stroke-width: 1;
    }

    .region-label {
      fill: var(--admin-text-dim, rgba(255, 255, 255, 0.25));
      font-size: 10px;
      text-anchor: middle;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .hotspot-dot {
      fill: var(--admin-gold, #f5a623);
      stroke: rgba(255, 255, 255, 0.35);
      stroke-width: 1;
    }

    .hotspot.top-rank .hotspot-dot {
      fill: #ffc857;
    }

    .hotspot-label {
      fill: var(--admin-text-muted, rgba(255, 255, 255, 0.55));
      font-size: 9px;
      font-weight: 600;
    }
  `,
})
export class GautengHotspotsMapComponent {
  hotspots = input.required<AdminHotspot[]>();

  readonly gridLines = [80, 160, 240, 320];
  readonly gridLinesY = [70, 140, 210];

  points = computed((): HotspotPoint[] => {
    const items = [...this.hotspots()].sort((a, b) => b.leads - a.leads);
    const max = Math.max(...items.map((h) => h.leads), 1);

    return items.map((spot, index) => {
      const pos = resolveGautengAreaPosition(spot.area);
      return {
        ...spot,
        x: pos.x,
        y: pos.y,
        radius: 5 + (spot.leads / max) * 11,
        rank: index + 1,
      };
    });
  });

  ariaLabel = computed(() => {
    const top = this.points()
      .slice(0, 3)
      .map((p) => `${p.area} (${p.leads})`)
      .join(', ');
    return top ? `Lead hotspots: ${top}` : 'Gauteng lead hotspots map';
  });
}
