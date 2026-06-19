import { Component, inject, signal, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppLogoComponent } from '../../shared/components/app-logo/app-logo.component';
import { AppIconComponent, AppIconName } from '../../shared/components/app-icon/app-icon.component';
import { AuthService } from '../../core/auth/auth.service';

interface NavLink {
  path: string;
  label: string;
  icon: AppIconName;
  exact?: boolean;
}

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppLogoComponent, AppIconComponent],
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.scss',
})
export class ClientLayoutComponent {
  private readonly auth = inject(AuthService);

  mobileNavOpen = signal(false);
  userMenuOpen = signal(false);
  notificationsOpen = signal(false);

  primaryNav: NavLink[] = [
    { path: '/client/dashboard', label: 'Overview', icon: 'dashboard', exact: true },
    { path: '/client/properties', label: 'Properties', icon: 'home' },
    { path: '/client/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/client/reports', label: 'Reports', icon: 'report' },
    { path: '/client/subscription', label: 'Plan', icon: 'subscription' },
    { path: '/client/settings', label: 'Settings', icon: 'settings' },
  ];

  bottomNav: NavLink[] = [
    { path: '/client/dashboard', label: 'Overview', icon: 'dashboard', exact: true },
    { path: '/client/properties', label: 'Properties', icon: 'home' },
    { path: '/client/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/client/reports', label: 'Reports', icon: 'report' },
  ];

  userNav: NavLink[] = [
    { path: '/client/payments', label: 'Payments', icon: 'payment' },
    { path: '/client/support', label: 'Support', icon: 'support' },
    { path: '/client/profile', label: 'Profile', icon: 'profile' },
  ];

  user = this.auth.user;

  @HostListener('document:click')
  closeMenus(): void {
    this.userMenuOpen.set(false);
    this.notificationsOpen.set(false);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
    this.notificationsOpen.set(false);
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationsOpen.update((v) => !v);
    this.userMenuOpen.set(false);
  }

  logout(): void {
    this.closeMobileNav();
    this.userMenuOpen.set(false);
    this.auth.logout();
  }
}
