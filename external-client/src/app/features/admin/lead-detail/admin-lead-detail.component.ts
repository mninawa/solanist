import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminLead, UpdateLeadContactPayload } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { whatsAppUrl } from '../../../core/utils/staff-workflow.util';

const TAG_TONES: AdminLead['tags'][0]['tone'][] = ['teal', 'gold', 'red', 'purple', 'blue'];

@Component({
  selector: 'app-admin-lead-detail',
  standalone: true,
  imports: [RouterLink, DatePipe, FormsModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-lead-detail.component.html',
  styleUrl: './admin-lead-detail.component.scss',
})
export class AdminLeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);

  lead = signal<AdminLead | null>(null);
  loading = signal(true);
  updating = signal(false);
  editingContact = signal(false);
  contactError = signal<string | null>(null);
  addingTag = signal(false);
  tagError = signal<string | null>(null);
  addingNote = signal(false);
  noteError = signal<string | null>(null);
  inviteError = signal<string | null>(null);
  inviteSuccess = signal(false);
  newTagLabel = '';
  newTagTone: AdminLead['tags'][0]['tone'] = 'teal';
  newNoteText = '';
  readonly tagTones = TAG_TONES;

  contactForm: UpdateLeadContactPayload = {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    propertyAddress: '',
    city: '',
    bestTimeToContact: '',
    preferredContact: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.adminService.getLead(id).subscribe({
      next: (l) => {
        this.lead.set(l);
        this.loading.set(false);
      },
    });
  }

  firstName(name: string): string {
    return name.split(' ')[0];
  }

  statusClass(status: string): string {
    return `pill-${status}`;
  }

  inviteUrl(link?: string): string {
    if (!link) return '';
    if (link.startsWith('http')) return link;
    return `${window.location.origin}${link.startsWith('/') ? link : `/${link}`}`;
  }

  whatsAppHref(phone: string): string {
    return whatsAppUrl(phone);
  }

  startEditContact(): void {
    const l = this.lead();
    if (!l) return;
    this.contactForm = {
      customerName: l.customerName,
      customerEmail: l.customerEmail,
      customerPhone: l.customerPhone,
      propertyAddress: l.propertyAddress,
      city: l.city,
      bestTimeToContact: l.bestTimeToContact ?? '',
      preferredContact: l.preferredContact ?? '',
    };
    this.contactError.set(null);
    this.editingContact.set(true);
  }

  cancelEditContact(): void {
    this.contactError.set(null);
    this.editingContact.set(false);
  }

  saveContact(): void {
    const l = this.lead();
    if (!l || this.updating()) return;

    const payload: UpdateLeadContactPayload = {
      customerName: this.contactForm.customerName.trim(),
      customerEmail: this.contactForm.customerEmail.trim(),
      customerPhone: this.contactForm.customerPhone.trim(),
      propertyAddress: this.contactForm.propertyAddress.trim(),
      city: this.contactForm.city.trim(),
      bestTimeToContact: this.contactForm.bestTimeToContact?.trim() || undefined,
      preferredContact: this.contactForm.preferredContact?.trim() || undefined,
    };

    if (
      !payload.customerName ||
      !payload.customerEmail ||
      !payload.customerPhone ||
      !payload.propertyAddress ||
      !payload.city
    ) {
      this.contactError.set('Name, email, phone, address, and city are required.');
      return;
    }

    this.updating.set(true);
    this.contactError.set(null);
    this.adminService.updateLeadContact(l.id, payload).subscribe({
      next: (updated) => {
        if (updated) {
          this.lead.set(updated);
          this.editingContact.set(false);
        } else {
          this.contactError.set('Could not save contact details.');
        }
        this.updating.set(false);
      },
      error: () => {
        this.contactError.set('Could not save contact details.');
        this.updating.set(false);
      },
    });
  }

  startAddTag(): void {
    this.newTagLabel = '';
    this.newTagTone = 'teal';
    this.tagError.set(null);
    this.addingTag.set(true);
  }

  cancelAddTag(): void {
    this.tagError.set(null);
    this.addingTag.set(false);
  }

  saveTag(): void {
    const l = this.lead();
    if (!l || this.updating()) return;

    const label = this.newTagLabel.trim();
    if (!label) {
      this.tagError.set('Enter a tag label.');
      return;
    }

    this.updating.set(true);
    this.tagError.set(null);
    this.adminService.addLeadTag(l.id, label, this.newTagTone).subscribe({
      next: (updated) => {
        if (updated) {
          this.lead.set(updated);
          this.addingTag.set(false);
        } else {
          this.tagError.set('Could not add tag.');
        }
        this.updating.set(false);
      },
      error: () => {
        this.tagError.set('Could not add tag.');
        this.updating.set(false);
      },
    });
  }

  startAddNote(): void {
    this.newNoteText = '';
    this.noteError.set(null);
    this.addingNote.set(true);
  }

  cancelAddNote(): void {
    this.noteError.set(null);
    this.addingNote.set(false);
  }

  saveNote(): void {
    const l = this.lead();
    if (!l || this.updating()) return;

    const note = this.newNoteText.trim();
    if (!note) {
      this.noteError.set('Enter a note.');
      return;
    }

    this.updating.set(true);
    this.noteError.set(null);
    this.adminService.addLeadNote(l.id, note).subscribe({
      next: (updated) => {
        if (updated) {
          this.lead.set(updated);
          this.addingNote.set(false);
        } else {
          this.noteError.set('Could not save note.');
        }
        this.updating.set(false);
      },
      error: () => {
        this.noteError.set('Could not save note.');
        this.updating.set(false);
      },
    });
  }

  sendInvite(): void {
    const l = this.lead();
    if (!l || this.updating()) return;

    this.updating.set(true);
    this.inviteError.set(null);
    this.inviteSuccess.set(false);
    this.adminService.sendInvite(l.id).subscribe({
      next: ({ lead }) => {
        this.lead.set(lead);
        this.inviteSuccess.set(true);
        this.updating.set(false);
      },
      error: () => {
        this.inviteError.set('Could not send invite. Try again or customize the message.');
        this.updating.set(false);
      },
    });
  }

  markWon(): void {
    this.updateStatus('converted');
  }

  markLost(): void {
    this.updateStatus('lost');
  }

  private updateStatus(status: 'converted' | 'lost'): void {
    const l = this.lead();
    if (!l || this.updating()) return;

    this.updating.set(true);
    this.adminService.updateLeadStatus(l.id, status).subscribe({
      next: (updated) => {
        if (updated) this.lead.set(updated);
        this.updating.set(false);
      },
      error: () => this.updating.set(false),
    });
  }
}
