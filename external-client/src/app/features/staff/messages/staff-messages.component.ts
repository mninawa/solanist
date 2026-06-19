import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StaffService } from '../../../core/services/staff.service';
import { StaffMessage } from '../../../core/models/staff.models';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-messages',
  standalone: true,
  imports: [RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './staff-messages.component.html',
  styleUrl: './staff-messages.component.scss',
})
export class StaffMessagesComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  messages = signal<StaffMessage[]>([]);
  loading = signal(true);

  unreadCount = computed(() => this.messages().filter((m) => m.unread).length);

  ngOnInit(): void {
    this.staffService.getMessages().subscribe({
      next: (msgs) => {
        this.messages.set(msgs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  whatsAppLink(phone: string): string {
    return whatsAppUrl(phone);
  }
}
