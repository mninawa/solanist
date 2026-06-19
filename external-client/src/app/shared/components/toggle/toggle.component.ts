import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="toggle"
      [class.on]="checked"
      [attr.aria-checked]="checked"
      role="switch"
      (click)="toggle()"
    >
      <span class="thumb"></span>
    </button>
  `,
  styles: `
    .toggle {
      width: 44px;
      height: 24px;
      border: none;
      border-radius: var(--radius-full);
      background: var(--color-border-strong);
      padding: 2px;
      cursor: pointer;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }
    .toggle.on {
      background: var(--color-accent);
    }
    .thumb {
      display: block;
      width: 20px;
      height: 20px;
      border-radius: var(--radius-full);
      background: white;
      box-shadow: var(--shadow-sm);
      transition: transform 0.2s ease;
    }
    .toggle.on .thumb {
      transform: translateX(20px);
    }
  `,
})
export class ToggleComponent {
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
