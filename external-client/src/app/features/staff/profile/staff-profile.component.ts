import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { StaffService } from '../../../core/services/staff.service';
import { StaffProfile } from '../../../core/models/staff.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';

@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [LoadingStateComponent],
  templateUrl: './staff-profile.component.html',
  styleUrl: './staff-profile.component.scss',
})
export class StaffProfileComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly staffService = inject(StaffService);

  profile = signal<StaffProfile | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.staffService.getProfile().subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  roleLabel(role: string): string {
    if (role === 'staff') return 'Field Technician';
    return role;
  }
}
