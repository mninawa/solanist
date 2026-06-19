import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminInvite } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-admin-invites',
  standalone: true,
  imports: [DatePipe, RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-invites.component.html',
  styleUrl: './admin-invites.component.scss',
})
export class AdminInvitesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  invites = signal<AdminInvite[]>([]);
  loading = signal(true);
  copiedCode = signal<string | null>(null);

  pendingCount = computed(() => this.invites().filter((i) => i.status === 'pending').length);
  acceptedCount = computed(() => this.invites().filter((i) => i.status === 'accepted').length);

  ngOnInit(): void {
    this.adminService.getInvites().subscribe({
      next: (i) => {
        this.invites.set(i);
        this.loading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    if (status === 'pending') return 'status-pending';
    if (status === 'accepted') return 'status-active';
    return 'status-expired';
  }

  invitePath(code: string): string {
    return `/invite/${code}`;
  }

  async copyLink(code: string): Promise<void> {
    const url = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      this.copiedCode.set(code);
      setTimeout(() => this.copiedCode.set(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }
}
