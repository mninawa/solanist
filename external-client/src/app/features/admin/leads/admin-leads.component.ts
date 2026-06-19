import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminInboxStats,
  AdminLead,
  AdminLeadFilters,
  LeadPipelineStage,
  LeadStatus,
  LeadUrgency,
} from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { GautengHotspotsMapComponent } from '../../../shared/components/gauteng-hotspots-map/gauteng-hotspots-map.component';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

const STATUS_OPTIONS: { value: LeadStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'converted', label: 'Converted' },
  { value: 'lost', label: 'Lost' },
];

const URGENCY_OPTIONS: { value: LeadUrgency | ''; label: string }[] = [
  { value: '', label: 'All Urgency' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'normal', label: 'Normal' },
];

const PIPELINE_LABELS: Record<LeadPipelineStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  quote_sent: 'Quote Sent',
  invite_sent: 'Invite Sent',
  signed_up: 'Signed Up',
};

@Component({
  selector: 'app-admin-leads',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, LoadingStateComponent, AppIconComponent, GautengHotspotsMapComponent],
  templateUrl: './admin-leads.component.html',
  styleUrl: './admin-leads.component.scss',
})
export class AdminLeadsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  leads = signal<AdminLead[]>([]);
  private allLeads = signal<AdminLead[]>([]);
  stats = signal<AdminInboxStats | null>(null);
  loading = signal(true);
  tableLoading = signal(false);
  syncing = signal(false);
  totalLeads = signal(0);
  showMoreFilters = signal(false);
  pipelineFilter = signal<LeadPipelineStage | ''>('');
  copiedLeadId = signal<string | null>(null);

  statusFilter: LeadStatus | '' = '';
  urgencyFilter: LeadUrgency | '' = '';
  selectedIds = signal<Set<string>>(new Set());

  readonly statusOptions = STATUS_OPTIONS;
  readonly urgencyOptions = URGENCY_OPTIONS;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const pipeline = params.get('pipeline') as LeadPipelineStage | null;
      this.pipelineFilter.set(pipeline && pipeline in PIPELINE_LABELS ? pipeline : '');
      this.applyPipelineFilter();
    });
    this.refreshStats();
    this.loadLeads();
  }

  refreshStats(): void {
    this.adminService.getInboxStats().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.totalLeads.set(s.emailLeadsCaptured);
      },
    });
  }

  syncBark(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.adminService.syncBarkLead().subscribe({
      next: () => {
        this.refreshStats();
        this.loadLeads();
        this.syncing.set(false);
      },
      error: () => this.syncing.set(false),
    });
  }

  lastSyncLabel(iso?: string): string {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
  }

  onFiltersChanged(): void {
    this.loadLeads();
  }

  toggleMoreFilters(): void {
    this.showMoreFilters.update((v) => !v);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.urgencyFilter = '';
    this.showMoreFilters.set(false);
    this.clearPipelineFilter();
    this.loadLeads();
  }

  hasActiveFilters(): boolean {
    return !!this.statusFilter || !!this.urgencyFilter || !!this.pipelineFilter();
  }

  pipelineFilterLabel(): string {
    const p = this.pipelineFilter();
    return p ? PIPELINE_LABELS[p] : '';
  }

  clearPipelineFilter(): void {
    this.pipelineFilter.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { pipeline: null },
      queryParamsHandling: 'merge',
    });
  }

  private applyPipelineFilter(): void {
    const pipeline = this.pipelineFilter();
    const all = this.allLeads();
    this.leads.set(pipeline ? all.filter((l) => l.pipelineStage === pipeline) : all);
    this.pruneSelection();
  }

  private pruneSelection(): void {
    const visible = new Set(this.leads().map((l) => l.id));
    const current = this.selectedIds();
    const next = new Set([...current].filter((id) => visible.has(id)));
    if (next.size !== current.size) this.selectedIds.set(next);
  }

  private loadLeads(): void {
    const isInitial = this.loading();
    if (!isInitial) this.tableLoading.set(true);
    const filters: AdminLeadFilters = {
      status: this.statusFilter,
      urgency: this.urgencyFilter,
    };
    this.adminService.getLeads(filters).subscribe({
      next: (l) => {
        this.allLeads.set(l);
        this.applyPipelineFilter();
        this.loading.set(false);
        this.tableLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.tableLoading.set(false);
      },
    });
  }

  trendDirection(trend: string | null | undefined): 'up' | 'down' | 'neutral' {
    if (!trend) return 'neutral';
    const t = trend.toLowerCase().trim();
    if (t.startsWith('-') || t.startsWith('−') || t.startsWith('↘') || t.includes('down') || t.includes('-')) {
      return 'down';
    }
    if (t.startsWith('+') || t.startsWith('↗') || t.includes('up') || t.includes('+')) {
      return 'up';
    }
    return 'neutral';
  }

  trendArrow(trend: string | null | undefined): string {
    const dir = this.trendDirection(trend);
    return dir === 'down' ? '↘' : dir === 'up' ? '↗' : '→';
  }

  trendText(trend: string | null | undefined): string {
    return (trend ?? '').replace(/^[↗↘→]\s*/, '').trim();
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelected(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.selectedIds.set(next);
  }

  allSelected(): boolean {
    const rows = this.leads();
    return rows.length > 0 && rows.every((l) => this.selectedIds().has(l.id));
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.leads().map((l) => l.id)));
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  selectedCount(): number {
    return this.selectedIds().size;
  }

  /** WhatsApp link to the first selected lead (bulk messaging starting point). */
  bulkWhatsAppHref(): string {
    const ids = this.selectedIds();
    const first = this.leads().find((l) => ids.has(l.id));
    return first ? whatsAppUrl(first.customerPhone) : '#';
  }

  avatarColor(index: number): string {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  statusClass(status: string): string {
    return `pill-${status}`;
  }

  urgencyClass(urgency: string): string {
    return urgency === 'urgent' ? 'pill-urgent' : 'pill-normal';
  }

  relativeReceived(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    if (d >= startOfToday) return 'Today';
    if (d >= startOfYesterday) return 'Yesterday';
    return '';
  }

  telHref(phone: string): string {
    return `tel:${phone.replace(/\s/g, '')}`;
  }

  whatsAppHref(phone: string): string {
    return whatsAppUrl(phone);
  }

  inviteUrl(lead: AdminLead): string {
    if (lead.inviteLink?.startsWith('http')) return lead.inviteLink;
    if (lead.inviteCode) return `${window.location.origin}/invite/${lead.inviteCode}`;
    if (!lead.inviteLink) return '';
    return `${window.location.origin}${lead.inviteLink.startsWith('/') ? lead.inviteLink : `/${lead.inviteLink}`}`;
  }

  async copyInviteLink(lead: AdminLead): Promise<void> {
    const url = this.inviteUrl(lead);
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.copiedLeadId.set(lead.id);
      setTimeout(() => this.copiedLeadId.set(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }
}
