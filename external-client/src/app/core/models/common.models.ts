export type UserRole = 'client' | 'staff' | 'admin';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type JobStatus =
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export type BookingConfirmationStatus = 'confirmed' | 'scheduled';

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export type PaymentStatus = 'paid' | 'pending' | 'failed';

export const CURRENCY_CODE = 'ZAR';
