import { Component, OnInit, inject, signal } from '@angular/core';
import { StaffService } from '../../../core/services/staff.service';
import { StaffCustomerSummary } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';

@Component({
  selector: 'app-staff-customers',
  standalone: true,
  imports: [LoadingStateComponent, AppIconComponent],
  templateUrl: './staff-customers.component.html',
  styleUrl: './staff-customers.component.scss',
})
export class StaffCustomersComponent implements OnInit {
  private readonly staffService = inject(StaffService);

  customers = signal<StaffCustomerSummary[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.staffService.getCustomers().subscribe({
      next: (list) => {
        this.customers.set(list);
        this.loading.set(false);
      },
    });
  }

  whatsAppLink(phone: string): string {
    return whatsAppUrl(phone);
  }
}
