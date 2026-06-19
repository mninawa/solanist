import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLead, LeadPipelineStage } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

const PIPELINE: { stage: LeadPipelineStage; label: string; hint: string }[] = [
  { stage: 'new', label: 'New Lead', hint: 'Captured' },
  { stage: 'contacted', label: 'Contacted', hint: 'Spoke or reached out' },
  { stage: 'interested', label: 'Interested', hint: 'Showing interest' },
  { stage: 'quote_sent', label: 'Quote Sent', hint: 'Quote shared' },
  { stage: 'invite_sent', label: 'Invite Sent', hint: 'Invite to platform' },
  { stage: 'signed_up', label: 'Signed Up', hint: 'Converted' },
];

@Component({
  selector: 'app-admin-lead-conversion',
  standalone: true,
  imports: [RouterLink, DatePipe, LoadingStateComponent],
  templateUrl: './admin-lead-conversion.component.html',
  styleUrl: './admin-lead-conversion.component.scss',
})
export class AdminLeadConversionComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  lead = signal<AdminLead | null>(null);
  loading = signal(true);
  updating = signal(false);
  pipeline = PIPELINE;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.adminService.getLead(id).subscribe({
      next: (l) => {
        this.lead.set(l);
        this.loading.set(false);
      },
    });
  }

  isActive(stage: LeadPipelineStage, current: LeadPipelineStage): boolean {
    return stage === current;
  }

  isDone(stage: LeadPipelineStage, current: LeadPipelineStage): boolean {
    const order = PIPELINE.map((p) => p.stage);
    return order.indexOf(stage) < order.indexOf(current);
  }

  advanceStage(stage: LeadPipelineStage): void {
    const l = this.lead();
    if (!l || this.updating() || l.pipelineStage === stage) return;

    this.updating.set(true);
    this.adminService.updatePipelineStage(l.id, stage).subscribe({
      next: (updated) => {
        if (updated) this.lead.set(updated);
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }

  markSignedUp(): void {
    this.advanceStage('signed_up');
  }
}
