import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminCustomerDetail } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';

@Component({
  selector: 'app-admin-customer-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-customer-detail.component.html',
  styleUrl: './admin-customer-detail.component.scss',
})
export class AdminCustomerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  customer = signal<AdminCustomerDetail | null>(null);
  loading = signal(true);
  notFound = signal(false);

  upcomingBookings = computed(() => this.customer()?.bookings.filter((b) => b.status === 'upcoming') ?? []);
  pastBookings = computed(() => this.customer()?.bookings.filter((b) => b.status !== 'upcoming') ?? []);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.adminService.getCustomer(id).subscribe({
      next: (c) => {
        this.customer.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  telHref(phone: string): string {
    return `tel:${(phone ?? '').replace(/\s/g, '')}`;
  }

  mailtoHref(email: string): string {
    return `mailto:${email}`;
  }

  whatsAppHref(phone: string): string {
    return whatsAppUrl(phone);
  }

  bookingStatusClass(status: string): string {
    if (status === 'upcoming') return 'pill-upcoming';
    if (status === 'completed') return 'pill-completed';
    return 'pill-cancelled';
  }
}
