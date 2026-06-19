import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ChecklistItem } from '../../../core/models/staff.models';

@Component({
  selector: 'app-checklist',
  standalone: true,
  template: `
    <ul class="checklist">
      @for (item of items; track item.id) {
        <li class="checklist-item" [class.completed]="item.completed">
          <label>
            <input
              type="checkbox"
              [checked]="item.completed"
              (change)="toggle(item)"
            />
            <span>{{ item.label }}</span>
            @if (item.required) {
              <span class="required">Required</span>
            }
          </label>
        </li>
      }
    </ul>
    @if (showProgress) {
      <p class="progress">{{ completedCount }} of {{ items.length }} complete</p>
    }
  `,
  styles: `
    .checklist {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }
    .checklist-item label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: 12px 14px;
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .checklist-item.completed label {
      border-color: var(--color-success);
      background: var(--color-success-muted);
    }
    .checklist-item input {
      width: 18px;
      height: 18px;
      accent-color: var(--color-accent);
    }
    .required {
      margin-left: auto;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }
    .progress {
      margin-top: var(--spacing-md);
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }
  `,
})
export class ChecklistComponent {
  @Input({ required: true }) items: ChecklistItem[] = [];
  @Input() showProgress = true;
  @Output() itemsChange = new EventEmitter<ChecklistItem[]>();

  get completedCount(): number {
    return this.items.filter((i) => i.completed).length;
  }

  toggle(item: ChecklistItem): void {
    const updated = this.items.map((i) =>
      i.id === item.id ? { ...i, completed: !i.completed } : i,
    );
    this.itemsChange.emit(updated);
  }
}
