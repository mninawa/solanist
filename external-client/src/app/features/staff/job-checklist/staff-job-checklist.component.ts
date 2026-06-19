import { Component, inject, computed } from '@angular/core';
import { StaffJobWorkspaceService } from '../job-workspace/staff-job-workspace.service';
import { ChecklistItem } from '../../../core/models/staff.models';
import { isChecklistComplete } from '../../../core/utils/staff-workflow.util';
import { ChecklistComponent } from '../../../shared/components/checklist/checklist.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-job-checklist',
  standalone: true,
  imports: [ChecklistComponent, AppIconComponent],
  templateUrl: './staff-job-checklist.component.html',
  styleUrl: './staff-job-checklist.component.scss',
})
export class StaffJobChecklistComponent {
  readonly ws = inject(StaffJobWorkspaceService);

  allComplete = computed(() => isChecklistComplete(this.ws.checklistDraft()));

  completedCount = computed(() => this.ws.checklistDraft().filter((c) => c.completed).length);

  progressPct = computed(() => {
    const items = this.ws.checklistDraft();
    if (!items.length) return 0;
    return Math.round((this.completedCount() / items.length) * 100);
  });

  onChecklistChange(items: ChecklistItem[]): void {
    this.ws.setChecklistDraft(items);
  }
}
