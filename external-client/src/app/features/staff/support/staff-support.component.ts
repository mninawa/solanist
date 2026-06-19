import { Component, inject } from '@angular/core';
import { APP_CONFIG } from '../../../core/config/app-config';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-staff-support',
  standalone: true,
  imports: [AppIconComponent],
  templateUrl: './staff-support.component.html',
  styleUrl: './staff-support.component.scss',
})
export class StaffSupportComponent {
  readonly config = APP_CONFIG;
}
