import { Component, Input } from '@angular/core';

export type AppIconName =
  | 'dashboard'
  | 'home'
  | 'calendar'
  | 'report'
  | 'subscription'
  | 'payment'
  | 'support'
  | 'profile'
  | 'settings'
  | 'logout'
  | 'menu'
  | 'close'
  | 'bell'
  | 'chat'
  | 'chevron-down'
  | 'chevron-right'
  | 'download'
  | 'check'
  | 'check-circle'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'camera'
  | 'sun'
  | 'users'
  | 'schedule'
  | 'jobs'
  | 'link'
  | 'empty'
  | 'plus'
  | 'shield'
  | 'wallet'
  | 'star'
  | 'lightbulb'
  | 'arrow-left'
  | 'pause'
  | 'trash';

const ICONS: Record<AppIconName, string> = {
  dashboard: 'M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v8h-8v-8z',
  home: 'M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z',
  calendar: 'M7 2v2M17 2v2M4 8h16M6 6h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z',
  report: 'M9 17v-6M12 17V7M15 17v-4M5 21h14a2 2 0 002-2V7l-6-4H5a2 2 0 00-2 2v14a2 2 0 002 2z',
  subscription: 'M4 7h16M4 12h16M4 17h10M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z',
  payment: 'M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0-2a2 2 0 012-2h14a2 2 0 012 2v0H3z',
  support: 'M12 22a10 10 0 100-20 10 10 0 000 20zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z',
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z',
  settings: 'M12 8a4 4 0 110 8 4 4 0 010-8zm8.5 4a7.5 7.5 0 00-.2-1.7l2-1.5-2-3.5-2.3 1a7.6 7.6 0 00-2.9-1.7L14.5 2h-5l-.6 2.6a7.6 7.6 0 00-2.9 1.7l-2.3-1-2 3.5 2 1.5a7.5 7.5 0 000 3.4l-2 1.5 2 3.5 2.3-1a7.6 7.6 0 002.9 1.7l.6 2.6h5l.6-2.6a7.6 7.6 0 002.9-1.7l2.3 1 2-3.5-2-1.5c.1-.5.2-1.1.2-1.7z',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  bell: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V4a2 2 0 10-4 0v1.34A6 6 0 006 11v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0a3 3 0 11-6 0',
  chat: 'M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-right': 'M9 6l6 6-6 6',
  download: 'M12 3v12m0 0l4-4m-4 4l-4-4M4 21h16',
  check: 'M5 12l5 5L20 7',
  'check-circle': 'M12 22a10 10 0 100-20 10 10 0 000 20zm-2-6l6-6-1.4-1.4L10 14.2l-2.6-2.6L6 13l4 3z',
  phone: 'M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.5 2.6a2 2 0 01-.5 2.1L8 9a16 16 0 006 6l.6-.6a2 2 0 012.1-.5c.8.2 1.7.4 2.6.5A2 2 0 0122 16.9z',
  mail: 'M4 6h16v12H4V6zm0 0l8 6 8-6',
  'map-pin': 'M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11zm0-9a2 2 0 100-4 2 2 0 000 4z',
  camera: 'M4 7h4l2-2h8a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2zm8 3a4 4 0 110 8 4 4 0 010-8z',
  sun: 'M12 4V2m0 20v-2M4.2 4.2L2.8 2.8m18.4 18.4-1.4-1.4M4 12H2m20 0h-2M4.2 19.8l-1.4 1.4M19.8 4.2l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
  users: 'M17 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  schedule: 'M12 6v6l4 2M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
  jobs: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  link: 'M10 13a5 5 0 007.1 0l1.4-1.4a5 5 0 000-7.1 5 5 0 00-7.1 0M14 11a5 5 0 00-7.1 0l-1.4 1.4a5 5 0 000 7.1 5 5 0 007.1 0',
  empty: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  plus: 'M12 5v14M5 12h14',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  wallet: 'M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm0-2a2 2 0 012-2h14a2 2 0 012 2v0H3zm16 6h.01',
  star: 'M12 2l3.1 6.3L22 9.3l-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2 2 9.3l6.9-1 3.1-6.3z',
  lightbulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  pause: 'M10 5v14M14 5v14',
  trash: 'M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0h10m-9 4v8a1 1 0 001 1h6a1 1 0 001-1v-8',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path" />
    </svg>
  `,
  styles: `:host { display: inline-flex; line-height: 0; flex-shrink: 0; }`,
})
export class AppIconComponent {
  @Input({ required: true }) name!: AppIconName;
  @Input() size = 20;

  get path(): string {
    return ICONS[this.name];
  }
}
