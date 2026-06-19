import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminStaffMember, UpsertStaffRequest } from '../../../core/models/admin.models';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'staff' | 'admin';
}

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [RouterLink, FormsModule, LoadingStateComponent, AppIconComponent],
  templateUrl: './admin-staff.component.html',
  styleUrl: './admin-staff.component.scss',
})
export class AdminStaffComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  staff = signal<AdminStaffMember[]>([]);
  loading = signal(true);

  drawerOpen = signal(false);
  editingId = signal<string | null>(null);
  saving = signal(false);
  deletingId = signal<string | null>(null);
  formError = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);

  form: StaffForm = this.emptyForm();

  onDutyCount = computed(() => this.staff().filter((s) => s.status === 'active').length);
  jobsToday = computed(() => this.staff().reduce((sum, s) => sum + s.jobsToday, 0));
  completedToday = computed(() => this.staff().reduce((sum, s) => sum + s.completedToday, 0));

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.adminService.getStaff().subscribe({
      next: (s) => {
        this.staff.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private emptyForm(): StaffForm {
    return { firstName: '', lastName: '', email: '', phone: '', role: 'staff' };
  }

  statusClass(status: string): string {
    return status === 'active' ? 'pill-active' : 'pill-paused';
  }

  statusLabel(status: string): string {
    return status === 'active' ? 'On duty' : 'Off duty';
  }

  roleBadgeClass(accountRole: string): string {
    return accountRole === 'admin' ? 'pill-quoted' : 'pill-new';
  }

  openAdd(): void {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(member: AdminStaffMember): void {
    this.editingId.set(member.id);
    const [firstName, ...rest] = member.fullName.split(' ');
    this.form = {
      firstName: firstName ?? '',
      lastName: rest.join(' '),
      email: member.email,
      phone: member.phone,
      role: member.accountRole,
    };
    this.formError.set(null);
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    if (this.saving()) return;
    this.drawerOpen.set(false);
  }

  save(): void {
    const email = this.form.email.trim().toLowerCase();
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.formError.set('First and last name are required.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      this.formError.set('Enter a valid email address.');
      return;
    }

    const request: UpsertStaffRequest = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email,
      phone: this.form.phone.trim() || undefined,
      role: this.form.role,
    };

    this.saving.set(true);
    this.formError.set(null);
    const id = this.editingId();
    const op = id
      ? this.adminService.updateStaff(id, request)
      : this.adminService.createStaff(request);

    op.subscribe({
      next: (member) => {
        this.saving.set(false);
        this.drawerOpen.set(false);
        if (id) {
          this.staff.update((list) => list.map((m) => (m.id === id ? member : m)));
        } else {
          this.staff.update((list) => [member, ...list]);
        }
      },
      error: (err) => {
        this.saving.set(false);
        const code = err?.error?.message ?? '';
        this.formError.set(
          code.includes('duplicate')
            ? 'A user with this email already exists.'
            : 'Could not save staff member. Please try again.',
        );
      },
    });
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(member: AdminStaffMember): void {
    this.deletingId.set(member.id);
    this.adminService.deleteStaff(member.id).subscribe({
      next: () => {
        this.staff.update((list) => list.filter((m) => m.id !== member.id));
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.confirmDeleteId.set(null);
      },
    });
  }
}
