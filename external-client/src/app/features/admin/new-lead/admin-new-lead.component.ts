import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { CreateLeadRequest, LeadSource, LeadUrgency } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-new-lead',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-new-lead.component.html',
  styleUrl: './admin-new-lead.component.scss',
})
export class AdminNewLeadComponent {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  saving = signal(false);
  error = signal<string | null>(null);

  customerName = '';
  customerEmail = '';
  customerPhone = '';
  propertyAddress = '';
  city = '';
  postcode = '';
  requestSnippet = '';
  notes = '';
  source: LeadSource = 'other';
  urgency: LeadUrgency = 'normal';
  panelCount = 16;
  roofType = 'Tile';
  province = 'Gauteng';
  serviceType = 'Solar Panel Cleaning';

  readonly sourceOptions: { value: LeadSource; label: string }[] = [
    { value: 'bark_email', label: 'Bark Email' },
    { value: 'bark', label: 'Bark' },
    { value: 'referral', label: 'Referral' },
    { value: 'website', label: 'Website' },
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'other', label: 'Other' },
  ];

  submit(): void {
    if (this.saving()) return;

    const customerName = this.customerName.trim();
    const requestSnippet = this.requestSnippet.trim();
    if (!customerName || !requestSnippet) {
      this.error.set('Customer name and request details are required.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: CreateLeadRequest = {
      customerName,
      customerEmail: this.customerEmail.trim(),
      customerPhone: this.customerPhone.trim(),
      propertyAddress: this.propertyAddress.trim(),
      city: this.city.trim(),
      postcode: this.postcode.trim(),
      requestSnippet,
      notes: this.notes.trim() || undefined,
      source: this.source,
      urgency: this.urgency,
      panelCount: this.panelCount,
      roofType: this.roofType,
      province: this.province,
      serviceType: this.serviceType,
    };

    this.adminService.createLead(payload).subscribe({
      next: (lead) => this.router.navigate(['/admin/leads', lead.id]),
      error: () => {
        this.error.set('Could not create lead. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
