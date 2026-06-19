import { Component, Input } from '@angular/core';
import { AppLogoComponent } from '../app-logo/app-logo.component';
import { AppIconComponent } from '../app-icon/app-icon.component';

@Component({
  selector: 'app-onboarding-stepper',
  standalone: true,
  imports: [AppLogoComponent, AppIconComponent],
  templateUrl: './onboarding-stepper.component.html',
  styleUrl: './onboarding-stepper.component.scss',
})
export class OnboardingStepperComponent {
  @Input({ required: true }) labels!: string[];
  @Input({ required: true }) currentStep = 1;

  progressPercent(): number {
    if (!this.labels?.length) return 0;
    return Math.round((this.currentStep / this.labels.length) * 100);
  }
}
