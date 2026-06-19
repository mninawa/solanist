import { Injectable, signal } from '@angular/core';
import { InviteFlowState } from '../models/invite.models';

const FLOW_KEY = 'solanist_invite_flow';

const DEFAULT_STATE = (code: string): InviteFlowState => ({
  inviteCode: code,
  currentStep: 1,
  selectedPlanId: null,
  preferredServiceDate: null,
  preferredTimeSlot: null,
  propertyConfirmed: false,
  panelCount: null,
  roofType: null,
  accessNotes: null,
});

@Injectable({ providedIn: 'root' })
export class InviteFlowService {
  private readonly state = signal<InviteFlowState | null>(this.load());

  readonly flowState = this.state.asReadonly();

  initFlow(inviteCode: string): void {
    const existing = this.state();
    if (existing?.inviteCode === inviteCode) return;
    this.state.set(DEFAULT_STATE(inviteCode));
    this.persist();
  }

  setStep(step: number): void {
    const current = this.state();
    if (!current) return;
    this.state.set({ ...current, currentStep: step });
    this.persist();
  }

  selectPlan(planId: string): void {
    const current = this.state();
    if (!current) return;
    this.state.set({ ...current, selectedPlanId: planId });
    this.persist();
  }

  setPropertyDetails(panelCount: number, roofType: string, accessNotes: string): void {
    const current = this.state();
    if (!current) return;
    this.state.set({
      ...current,
      panelCount,
      roofType,
      accessNotes,
      propertyConfirmed: true,
    });
    this.persist();
  }

  setPreferredDate(date: string, timeSlot: string): void {
    const current = this.state();
    if (!current) return;
    this.state.set({ ...current, preferredServiceDate: date, preferredTimeSlot: timeSlot });
    this.persist();
  }

  clear(): void {
    localStorage.removeItem(FLOW_KEY);
    this.state.set(null);
  }

  private persist(): void {
    const current = this.state();
    if (current) localStorage.setItem(FLOW_KEY, JSON.stringify(current));
  }

  private load(): InviteFlowState | null {
    try {
      const raw = localStorage.getItem(FLOW_KEY);
      return raw ? (JSON.parse(raw) as InviteFlowState) : null;
    } catch {
      return null;
    }
  }
}
