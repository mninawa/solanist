import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { LEGAL_INDEX, LEGAL_POLICIES, PolicyDoc } from './legal-policies';
import { AppLogoComponent } from '../../../shared/components/app-logo/app-logo.component';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-legal-policy',
  standalone: true,
  imports: [RouterLink, AppLogoComponent, AppIconComponent],
  templateUrl: './legal-policy.component.html',
  styleUrl: './legal-policy.component.scss',
})
export class LegalPolicyComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly index = LEGAL_INDEX;
  readonly slug = signal<string | null>(null);

  readonly policy = computed<PolicyDoc | null>(() => {
    const s = this.slug();
    if (!s) return null;
    return LEGAL_POLICIES[s] ?? null;
  });

  readonly otherPolicies = computed(() => {
    const s = this.slug();
    return this.index.filter((p) => p.slug !== s);
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const s = params.get('slug');
      this.slug.set(s);
      if (s && !LEGAL_POLICIES[s]) {
        this.router.navigate(['/legal']);
      }
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/login']);
    }
  }
}
