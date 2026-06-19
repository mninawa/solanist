import { UserRole } from './common.models';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  inviteCode?: string;
  selectedPlanId?: string;
  preferredServiceDate?: string;
  preferredTimeSlot?: string;
  panelCount?: number;
  roofType?: string;
  accessNotes?: string;
}

export interface GoogleSignupRequest {
  idToken: string;
  firstName: string;
  lastName: string;
  phone?: string;
  inviteCode: string;
  selectedPlanId?: string;
  preferredServiceDate?: string;
  preferredTimeSlot?: string;
  panelCount?: number;
  roofType?: string;
  accessNotes?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
}

export interface AuthConfig {
  googleEnabled: boolean;
  googleClientId: string | null;
  googleOnly: boolean;
  allowSelfSignup: boolean;
}

export interface GoogleSelfSignupRequest {
  idToken: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: string;
  city: string;
  postcode?: string;
  selectedPlanId?: string;
  preferredServiceDate?: string;
  preferredTimeSlot?: string;
  panelCount?: number;
  roofType?: string;
  accessNotes?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResult {
  accepted: boolean;
  devResetUrl?: string | null;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
}
