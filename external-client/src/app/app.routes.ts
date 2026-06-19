import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: 'invite/:inviteCode',
        loadComponent: () =>
          import('./features/public/invite-landing/invite-landing.component').then(
            (m) => m.InviteLandingComponent,
          ),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./features/public/signup/signup.component').then((m) => m.SignupComponent),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/public/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'staff/login',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'admin/login',
        redirectTo: 'login',
        pathMatch: 'full',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/public/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/public/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },
  {
    path: 'client',
    canActivate: [authGuard, roleGuard('client')],
    loadComponent: () =>
      import('./layouts/client-layout/client-layout.component').then((m) => m.ClientLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/client/dashboard/client-dashboard.component').then(
            (m) => m.ClientDashboardComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/client/bookings/client-bookings.component').then(
            (m) => m.ClientBookingsComponent,
          ),
      },
      {
        path: 'bookings/:id',
        loadComponent: () =>
          import('./features/client/bookings/client-booking-detail.component').then(
            (m) => m.ClientBookingDetailComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/client/reports/client-reports.component').then(
            (m) => m.ClientReportsComponent,
          ),
      },
      {
        path: 'reports/:id',
        loadComponent: () =>
          import('./features/client/reports/client-report-detail.component').then(
            (m) => m.ClientReportDetailComponent,
          ),
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./features/client/subscription/client-subscription.component').then(
            (m) => m.ClientSubscriptionComponent,
          ),
      },
      {
        path: 'properties',
        loadComponent: () =>
          import('./features/client/properties/client-properties.component').then(
            (m) => m.ClientPropertiesComponent,
          ),
      },
      {
        path: 'properties/:id/plan',
        loadComponent: () =>
          import('./features/client/manage-plan/client-manage-plan.component').then(
            (m) => m.ClientManagePlanComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/client/payments/client-payments.component').then(
            (m) => m.ClientPaymentsComponent,
          ),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/client/support/client-support.component').then(
            (m) => m.ClientSupportComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/client/profile/client-profile.component').then(
            (m) => m.ClientProfileComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/client/settings/client-settings.component').then(
            (m) => m.ClientSettingsComponent,
          ),
      },
    ],
  },
  {
    path: 'staff',
    canActivate: [authGuard, roleGuard('staff')],
    loadComponent: () =>
      import('./layouts/staff-layout/staff-layout.component').then((m) => m.StaffLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/staff/dashboard/staff-dashboard.component').then(
            (m) => m.StaffDashboardComponent,
          ),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/staff/jobs/staff-jobs.component').then((m) => m.StaffJobsComponent),
      },
      {
        path: 'jobs/:id',
        loadComponent: () =>
          import('./features/staff/job-workspace/staff-job-workspace.component').then(
            (m) => m.StaffJobWorkspaceComponent,
          ),
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/staff/job-detail/staff-job-detail.component').then(
                (m) => m.StaffJobDetailComponent,
              ),
          },
          {
            path: 'check-in',
            loadComponent: () =>
              import('./features/staff/job-check-in/staff-job-check-in.component').then(
                (m) => m.StaffJobCheckInComponent,
              ),
          },
          {
            path: 'before-photos',
            loadComponent: () =>
              import('./features/staff/job-photos/staff-job-before-photos.component').then(
                (m) => m.StaffJobBeforePhotosComponent,
              ),
          },
          {
            path: 'after-photos',
            loadComponent: () =>
              import('./features/staff/job-photos/staff-job-after-photos.component').then(
                (m) => m.StaffJobAfterPhotosComponent,
              ),
          },
          {
            path: 'photos',
            redirectTo: 'before-photos',
            pathMatch: 'full',
          },
          {
            path: 'checklist',
            loadComponent: () =>
              import('./features/staff/job-checklist/staff-job-checklist.component').then(
                (m) => m.StaffJobChecklistComponent,
              ),
          },
          {
            path: 'issue',
            loadComponent: () =>
              import('./features/staff/job-issue/staff-job-issue.component').then(
                (m) => m.StaffJobIssueComponent,
              ),
          },
          {
            path: 'complete',
            loadComponent: () =>
              import('./features/staff/job-complete/staff-job-complete.component').then(
                (m) => m.StaffJobCompleteComponent,
              ),
          },
        ],
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./features/staff/schedule/staff-schedule.component').then(
            (m) => m.StaffScheduleComponent,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/staff/reports/staff-reports.component').then(
            (m) => m.StaffReportsComponent,
          ),
      },
      {
        path: 'issues',
        loadComponent: () =>
          import('./features/staff/issues/staff-issues.component').then(
            (m) => m.StaffIssuesComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/staff/customers/staff-customers.component').then(
            (m) => m.StaffCustomersComponent,
          ),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/staff/messages/staff-messages.component').then(
            (m) => m.StaffMessagesComponent,
          ),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/staff/support/staff-support.component').then(
            (m) => m.StaffSupportComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/staff/profile/staff-profile.component').then(
            (m) => m.StaffProfileComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard('admin')],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./features/admin/leads/admin-leads.component').then((m) => m.AdminLeadsComponent),
      },
      {
        path: 'leads/new',
        loadComponent: () =>
          import('./features/admin/new-lead/admin-new-lead.component').then((m) => m.AdminNewLeadComponent),
      },
      {
        path: 'leads/:id/conversion',
        loadComponent: () =>
          import('./features/admin/lead-conversion/admin-lead-conversion.component').then(
            (m) => m.AdminLeadConversionComponent,
          ),
      },
      {
        path: 'leads/:id/send-invite',
        loadComponent: () =>
          import('./features/admin/send-invite/admin-send-invite.component').then(
            (m) => m.AdminSendInviteComponent,
          ),
      },
      {
        path: 'leads/:id',
        loadComponent: () =>
          import('./features/admin/lead-detail/admin-lead-detail.component').then(
            (m) => m.AdminLeadDetailComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/admin/customers/admin-customers.component').then(
            (m) => m.AdminCustomersComponent,
          ),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./features/admin/customer-detail/admin-customer-detail.component').then(
            (m) => m.AdminCustomerDetailComponent,
          ),
      },
      {
        path: 'quotes',
        loadComponent: () =>
          import('./features/admin/quotes/admin-quotes.component').then((m) => m.AdminQuotesComponent),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./features/admin/schedule/admin-schedule.component').then((m) => m.AdminScheduleComponent),
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/admin/subscriptions/admin-subscriptions.component').then(
            (m) => m.AdminSubscriptionsComponent,
          ),
      },
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/admin/bookings/admin-bookings.component').then((m) => m.AdminBookingsComponent),
      },
      {
        path: 'invites',
        loadComponent: () =>
          import('./features/admin/invites/admin-invites.component').then((m) => m.AdminInvitesComponent),
      },
      {
        path: 'jobs',
        loadComponent: () =>
          import('./features/admin/jobs/admin-jobs.component').then((m) => m.AdminJobsComponent),
      },
      {
        path: 'staff',
        loadComponent: () =>
          import('./features/admin/staff/admin-staff.component').then((m) => m.AdminStaffComponent),
      },
      {
        path: 'issues',
        loadComponent: () =>
          import('./features/admin/issues/admin-issues.component').then((m) => m.AdminIssuesComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/admin-reports.component').then(
            (m) => m.AdminReportsComponent,
          ),
      },
      {
        path: 'reports/:id',
        loadComponent: () =>
          import('./features/admin/reports/admin-report-detail.component').then(
            (m) => m.AdminReportDetailComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/admin-settings.component').then(
            (m) => m.AdminSettingsComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
