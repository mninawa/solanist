import { Component, inject, signal, OnInit, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { startWith, switchMap } from 'rxjs/operators';
import { interval } from 'rxjs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';
import { AppIconComponent, AppIconName } from '../../shared/components/app-icon/app-icon.component';
import { AuthService } from '../../core/auth/auth.service';
import { StaffService } from '../../core/services/staff.service';
import { StaffDashboard, StaffNotification } from '../../core/models/staff.models';

interface NavLink {
  path: string;
  label: string;
  icon: AppIconName;
  exact?: boolean;
  badge?: number;
}

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppLogoComponent, AppIconComponent],
  templateUrl: './staff-layout.component.html',
  styleUrl: './staff-layout.component.scss',
})
export class StaffLayoutComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly staffService = inject(StaffService);
  private readonly destroyRef = inject(DestroyRef);

  mobileNavOpen = signal(false);
  dashboard = signal<StaffDashboard | null>(null);

  notifications = signal<StaffNotification[]>([]);
  notificationsOpen = signal(false);
  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  progressPct = computed(() => {
    const d = this.dashboard();
    if (!d || !d.totalCount) return 0;
    return Math.round((d.completedCount / d.totalCount) * 100);
  });

  primaryNav: NavLink[] = [
    { path: '/staff/dashboard', label: "Today's Jobs", icon: 'dashboard', exact: true },
    { path: '/staff/schedule', label: 'Schedule', icon: 'schedule' },
    { path: '/staff/jobs', label: 'Jobs', icon: 'jobs' },
    { path: '/staff/reports', label: 'Reports', icon: 'report' },
    { path: '/staff/issues', label: 'Issues', icon: 'support' },
    { path: '/staff/customers', label: 'Customers', icon: 'users' },
    { path: '/staff/messages', label: 'Messages', icon: 'chat' },
    { path: '/staff/profile', label: 'Profile', icon: 'profile' },
    { path: '/staff/support', label: 'Support', icon: 'support' },
  ];

  issueCount = signal(0);
  messageCount = signal(0);

  user = this.auth.user;

  ngOnInit(): void {
    this.staffService.getDashboard().subscribe({
      next: (d) => this.dashboard.set(d),
    });
    this.staffService.getJobsWithIssues().subscribe({
      next: (jobs) => this.issueCount.set(jobs.length),
    });
    this.staffService.getMessages().subscribe({
      next: (msgs) => this.messageCount.set(msgs.filter((m) => m.unread).length),
    });

    interval(45000)
      .pipe(
        startWith(0),
        switchMap(() => this.staffService.getNotifications()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => this.notifications.set(items),
      });
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    const opening = !this.notificationsOpen();
    this.notificationsOpen.set(opening);
    if (opening && this.unreadCount() > 0) {
      this.staffService.markNotificationsRead().subscribe({
        next: () =>
          this.notifications.update((list) => list.map((n) => ({ ...n, read: true }))),
      });
    }
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffMs = Date.now() - then;
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  }

  notificationIcon(type: string): AppIconName {
    switch (type) {
      case 'job_assigned':
        return 'calendar';
      case 'job_removed':
        return 'close';
      default:
        return 'bell';
    }
  }

  navLinks(): NavLink[] {
    return this.primaryNav.map((link) => {
      if (link.path === '/staff/issues' && this.issueCount() > 0) {
        return { ...link, badge: this.issueCount() };
      }
      if (link.path === '/staff/messages' && this.messageCount() > 0) {
        return { ...link, badge: this.messageCount() };
      }
      if (link.path === '/staff/messages') {
        return { ...link, badge: undefined };
      }
      return link;
    });
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  logout(): void {
    this.closeMobileNav();
    this.auth.logout();
  }
}
