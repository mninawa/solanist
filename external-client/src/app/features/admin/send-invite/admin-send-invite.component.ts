import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLead, AdminInvite } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-admin-send-invite',
  standalone: true,
  imports: [RouterLink, LoadingStateComponent],
  templateUrl: './admin-send-invite.component.html',
  styleUrl: './admin-send-invite.component.scss',
})
export class AdminSendInviteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  lead = signal<AdminLead | null>(null);
  invite = signal<AdminInvite | null>(null);
  loading = signal(true);
  sending = signal(false);
  sent = signal(false);
  error = signal<string | null>(null);
  reminder24h = signal(true);
  reminder3d = signal(true);
  expiryDays = signal(14);

  messageTemplate =
    'Hi {{customer_name}} 👋\n\nThanks for reaching out about solar panel cleaning!\n\nWe\'ve prepared a personalised quote and care plan for your property.\n\nView your quote & choose your plan:\n{{invite_link}}\n\nOffer: {{offer_name}}\nLink expires: {{expiry_date}}\n\n— James, Solanist Solar Care';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.adminService.getLead(id).subscribe({
      next: (l) => {
        this.lead.set(l);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load this lead.');
        this.loading.set(false);
      },
    });
  }

  inviteUrl(link?: string): string {
    if (!link) return '';
    if (link.startsWith('http')) return link;
    return `${window.location.origin}${link.startsWith('/') ? link : `/${link}`}`;
  }

  previewMessage(l: AdminLead): string {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.expiryDays());
    return this.messageTemplate
      .replace('{{customer_name}}', l.customerName.split(' ')[0])
      .replace('{{invite_link}}', this.inviteUrl(l.inviteLink) || 'https://solanist.co.za/invite/...')
      .replace('{{offer_name}}', l.recommendedPlan ?? 'Quarterly Solar Care')
      .replace('{{expiry_date}}', expiry.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' }));
  }

  copyLink(link?: string): void {
    const url = this.inviteUrl(link);
    if (url) navigator.clipboard?.writeText(url);
  }

  sendNow(): void {
    const l = this.lead();
    if (!l || this.sending()) return;

    this.sending.set(true);
    this.error.set(null);
    this.adminService.sendInvite(l.id, this.expiryDays()).subscribe({
      next: ({ lead, invite }) => {
        this.lead.set(lead);
        this.invite.set(invite);
        this.sent.set(true);
        this.sending.set(false);
      },
      error: () => {
        this.error.set('Could not send invite. Please try again.');
        this.sending.set(false);
      },
    });
  }
}
