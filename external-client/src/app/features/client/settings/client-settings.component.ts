import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../../../core/services/client.service';
import { ClientProfile } from '../../../core/models/client.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';

@Component({
  selector: 'app-client-settings',
  standalone: true,
  imports: [FormsModule, LoadingStateComponent, ToggleComponent],
  templateUrl: './client-settings.component.html',
  styleUrl: './client-settings.component.scss',
})
export class ClientSettingsComponent implements OnInit {
  private readonly clientService = inject(ClientService);

  profile = signal<ClientProfile | null>(null);
  loading = signal(true);
  saving = signal(false);
  saved = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.clientService.getProfile().subscribe({
      next: (p) => {
        this.profile.set({ ...p });
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const p = this.profile();
    if (!p) return;

    this.saving.set(true);
    this.error.set(null);

    this.clientService
      .updateProfile({
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        phone: p.phone.trim(),
        preferredContact: p.preferredContact,
        emailReminders: p.emailReminders,
        whatsAppReminders: p.whatsAppReminders,
      })
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.finishSave();
        },
        error: () => {
          this.saving.set(false);
          this.error.set('Could not save settings. Please try again.');
        },
      });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }
}
