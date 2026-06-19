import { UserRole } from '../models/common.models';

export const ROLE_HOME: Record<UserRole, string> = {
  client: '/client/dashboard',
  staff: '/staff/dashboard',
  admin: '/admin/dashboard',
};

export const LOGIN_ROUTE = '/login';

export function homeRouteForRole(role: UserRole): string {
  return ROLE_HOME[role];
}

export function loginRouteForRole(_role?: UserRole): string {
  return LOGIN_ROUTE;
}
