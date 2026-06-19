import { Injectable } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';
import { InviteData } from '../models/invite.models';
import { MOCK_INVITE } from '../data/mock-data';
import { APP_CONFIG } from '../config/app-config';
import { ApiClientService } from '../http/api-client.service';
import { InviteDtoApi, mapInvite } from '../mappers/invite-api.mapper';

@Injectable({ providedIn: 'root' })
export class InviteService {
  private readonly useApi = !APP_CONFIG.mockMode;

  constructor(private readonly api: ApiClientService) {}

  getInvite(code: string): Observable<InviteData> {
    if (this.useApi) {
      return this.api.get<InviteDtoApi>(`/invites/${encodeURIComponent(code)}`).pipe(map(mapInvite));
    }

    const normalized = code.toUpperCase();
    if (normalized === MOCK_INVITE.code) {
      return of({ ...MOCK_INVITE, plans: [...MOCK_INVITE.plans] }).pipe(delay(400));
    }
    return throwError(() => new Error(`Invite code "${code}" not found or expired.`)).pipe(delay(400));
  }
}
