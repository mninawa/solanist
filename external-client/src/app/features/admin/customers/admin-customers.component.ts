import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminCustomer } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-customers.component.html',
  styleUrl: './admin-customers.component.scss',
})
export class AdminCustomersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  customers = signal<AdminCustomer[]>([]);
  loading = signal(true);
  search = signal('');

  filteredCustomers = computed(() => {
    const q = this.search().trim().toLowerCase();
    const list = this.customers();
    if (!q) return list;
    return list.filter((c) =>
      [c.name, c.email, c.phone, c.primaryAddress, c.planName ?? '']
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  });

  totalCount = computed(() => this.customers().length);
  activeCount = computed(() => this.customers().filter((c) => c.status === 'active').length);
  prospectCount = computed(() => this.customers().filter((c) => c.status === 'prospect').length);
  totalProperties = computed(() =>
    this.customers().reduce((sum, c) => sum + (c.propertyCount ?? 0), 0),
  );

  ngOnInit(): void {
    this.adminService.getCustomers().subscribe({
      next: (c) => {
        this.customers.set(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  openCustomer(id: string): void {
    void this.router.navigate(['/admin/customers', id]);
  }

  statusClass(status: string): string {
    return status === 'active' ? 'pill-active' : 'pill-new';
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

  telHref(phone: string): string {
    return `tel:${(phone ?? '').replace(/\s/g, '')}`;
  }

  mailtoHref(email: string): string {
    return `mailto:${email}`;
  }

  whatsAppHref(phone: string): string {
    return whatsAppUrl(phone);
  }
}
