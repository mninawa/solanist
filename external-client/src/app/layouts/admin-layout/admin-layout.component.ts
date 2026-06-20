import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppIconComponent, AppIconName } from '../../shared/components/app-icon/app-icon.component';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';
import { AuthService } from '../../core/auth/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { AdminSearchHit } from '../../core/models/admin.models';

interface NavLink {
  path: string;
  label: string;
  icon: AppIconName;
  exact?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent, AppLogoComponent, FormsModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  mobileNavOpen = false;
  importingBark = signal(false);
  leadsBadge = signal<number | undefined>(undefined);
  issuesBadge = signal<number | undefined>(undefined);
  invitesBadge = signal<number | undefined>(undefined);
  bookingsBadge = signal<number | undefined>(undefined);
  jobsBadge = signal<number | undefined>(undefined);
  searchOpen = signal(false);
  searchLoading = signal(false);
  searchHits = signal<AdminSearchHit[]>([]);
  userMenuOpen = signal(false);

  searchQuery = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  primaryNav: NavLink[] = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/leads', label: 'Leads Inbox', icon: 'mail' },
    { path: '/admin/invites', label: 'Invites', icon: 'link' },
    { path: '/admin/customers', label: 'Customers', icon: 'users' },
    { path: '/admin/quotes', label: 'Quotes', icon: 'report' },
    { path: '/admin/schedule', label: 'Schedule', icon: 'calendar' },
    { path: '/admin/bookings', label: 'Bookings', icon: 'schedule' },
    { path: '/admin/jobs', label: 'Jobs', icon: 'sun' },
    { path: '/admin/staff', label: 'Staff', icon: 'jobs' },
    { path: '/admin/issues', label: 'Issues', icon: 'support' },
    { path: '/admin/subscriptions', label: 'Subscriptions', icon: 'subscription' },
    { path: '/admin/reports', label: 'Reports', icon: 'report' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  user = this.auth.user;

  ngOnInit(): void {
    this.adminService.getInboxStats().subscribe({
      next: (s) => this.leadsBadge.set(s.emailLeadsCaptured),
    });
    this.adminService.getIssues().subscribe({
      next: (issues) => this.issuesBadge.set(issues.length > 0 ? issues.length : undefined),
    });
    this.adminService.getInvites().subscribe({
      next: (invites) => {
        const pending = invites.filter((i) => i.status === 'pending').length;
        this.invitesBadge.set(pending > 0 ? pending : undefined);
      },
    });
    this.adminService.getBookings().subscribe({
      next: (bookings) => {
        const unassigned = bookings.filter((b) => b.status === 'upcoming' && !b.staffId).length;
        this.bookingsBadge.set(unassigned > 0 ? unassigned : undefined);
      },
    });
    this.adminService.getJobs().subscribe({
      next: (jobs) => {
        const issues = jobs.filter((j) => j.operationalStatus === 'issue_reported').length;
        this.jobsBadge.set(issues > 0 ? issues : undefined);
      },
    });
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
      if (this.searchQuery.trim()) this.searchOpen.set(true);
    }
    if (event.key === 'Escape') {
      this.searchOpen.set(false);
      this.userMenuOpen.set(false);
    }
  }

  @HostListener('document:click')
  closeSearch(): void {
    this.searchOpen.set(false);
    this.userMenuOpen.set(false);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
    this.searchOpen.set(false);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  navLinks(): NavLink[] {
    return this.primaryNav.map((link) => {
      if (link.path === '/admin/leads') return { ...link, badge: this.leadsBadge() };
      if (link.path === '/admin/invites') return { ...link, badge: this.invitesBadge() };
      if (link.path === '/admin/bookings') return { ...link, badge: this.bookingsBadge() };
      if (link.path === '/admin/jobs') return { ...link, badge: this.jobsBadge() };
      if (link.path === '/admin/issues') return { ...link, badge: this.issuesBadge() };
      return link;
    });
  }

  onSearchInput(event: Event): void {
    event.stopPropagation();
    clearTimeout(this.searchTimer);
    const value = this.searchQuery.trim();
    if (!value) {
      this.searchHits.set([]);
      this.searchOpen.set(false);
      return;
    }
    this.searchTimer = setTimeout(() => this.runSearch(), 250);
  }

  onSearchFocus(event: Event): void {
    event.stopPropagation();
    if (this.searchQuery.trim()) this.searchOpen.set(true);
  }

  onSearchPanelClick(event: Event): void {
    event.stopPropagation();
  }

  private runSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) return;
    this.searchLoading.set(true);
    this.searchOpen.set(true);
    this.adminService.search(q).subscribe({
      next: (result) => {
        this.searchHits.set(result.hits);
        this.searchLoading.set(false);
      },
      error: () => this.searchLoading.set(false),
    });
  }

  openHit(hit: AdminSearchHit): void {
    this.searchOpen.set(false);
    const path = hit.type === 'lead' ? `/admin/leads/${hit.id}` : '/admin/customers';
    void this.router.navigateByUrl(path);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  logout(): void {
    this.closeMobileNav();
    this.auth.logout();
  }

  importBarkEmails(): void {
    if (this.importingBark()) return;
    this.importingBark.set(true);
    this.adminService.syncBarkLead().subscribe({
      next: (lead) => {
        this.importingBark.set(false);
        this.router.navigate(['/admin/leads', lead.id]);
      },
      error: () => this.importingBark.set(false),
    });
  }
}
