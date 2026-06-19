namespace Solanist.Application.Abstractions;

using Solanist.Application.Dtos;

public interface IInviteService
{
    Task<InviteDto?> GetInviteAsync(string code, CancellationToken ct = default);
}

public interface IClientService
{
    Task<ClientDashboardDto> GetDashboardAsync(CancellationToken ct = default);
    Task<IReadOnlyList<BookingDto>> GetBookingsAsync(CancellationToken ct = default);
    Task<BookingDto?> GetBookingAsync(string id, CancellationToken ct = default);
    Task<BookingDto> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct = default);
    Task<BookingDto> RescheduleBookingAsync(RescheduleBookingRequest request, CancellationToken ct = default);
    Task<BookingDto?> GetUpcomingBookingForPropertyAsync(string propertyId, CancellationToken ct = default);
    Task<IReadOnlyList<CleaningReportDto>> GetReportsAsync(CancellationToken ct = default);
    Task<CleaningReportDto?> GetReportAsync(string id, CancellationToken ct = default);
    Task<SubscriptionDto> GetSubscriptionAsync(CancellationToken ct = default);
    Task<SubscriptionPortfolioResponseDto> GetSubscriptionPortfolioAsync(CancellationToken ct = default);
    Task<string> SetBillingModeAsync(string billingMode, CancellationToken ct = default);
    Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PropertySummaryDto>> GetPropertiesAsync(CancellationToken ct = default);
    Task<PropertyPlanDetailsDto?> GetPropertyPlanAsync(string propertyId, CancellationToken ct = default);
    Task<PropertyDetailDto?> GetPropertyDetailAsync(string propertyId, CancellationToken ct = default);
    Task<PropertyDetailDto?> SeedDemoCleaningsAsync(string propertyId, CancellationToken ct = default);
    Task<PropertySummaryDto> AddPropertyAsync(CreatePropertyRequest request, CancellationToken ct = default);
    Task<PropertySummaryDto> UpdatePropertyImageAsync(string propertyId, string imageUrl, CancellationToken ct = default);
    Task<PropertySummaryDto> UpdatePropertyNextCleanAsync(string propertyId, string? date, CancellationToken ct = default);
    Task<IReadOnlyList<PropertySummaryDto>> SetPrimaryPropertyAsync(string propertyId, CancellationToken ct = default);
    Task<IReadOnlyList<PropertySummaryDto>> DeletePropertyAsync(string propertyId, CancellationToken ct = default);
    Task<ClientProfileDto> GetProfileAsync(CancellationToken ct = default);
    Task<ClientProfileDto> UpdateProfileAsync(UpdateClientProfileRequestDto request, CancellationToken ct = default);
    Task<ChangePasswordResultDto> ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken ct = default);
    void PublishLatestReport();
}

public interface IStaffService
{
    Task<StaffDashboardDto> GetDashboardAsync(CancellationToken ct = default);
    Task<StaffScheduleDto> GetScheduleAsync(string? from = null, string? to = null, CancellationToken ct = default);
    Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default);
    Task<StaffJobDto?> GetJobAsync(string id, CancellationToken ct = default);
    Task<StaffJobDto?> CheckInAsync(string id, CheckInRequest? request = null, CancellationToken ct = default);
    Task<StaffJobDto?> AddPhotosAsync(string id, string type, IReadOnlyList<string> photos, CancellationToken ct = default);
    Task<StaffJobDto?> UpdateChecklistAsync(string id, IReadOnlyList<ChecklistItemDto> checklist, CancellationToken ct = default);
    Task<StaffJobDto?> UpdateJobAsync(string id, UpdateStaffJobRequest request, CancellationToken ct = default);
    Task<StaffJobDto?> ReportIssueAsync(string id, ReportJobIssueRequest request, CancellationToken ct = default);
    Task<StaffJobDto?> CompleteJobAsync(string id, string notes, CancellationToken ct = default);
    Task<StaffProfileDto?> GetProfileAsync(CancellationToken ct = default);
    Task<IReadOnlyList<StaffNotificationDto>> GetNotificationsAsync(CancellationToken ct = default);
    Task<int> MarkNotificationsReadAsync(CancellationToken ct = default);
}

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default);
    Task<AdminInboxStatsDto> GetInboxStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminLeadDto>> GetLeadsAsync(string? status = null, string? urgency = null, CancellationToken ct = default);
    Task<AdminLeadDto?> GetLeadAsync(string id, CancellationToken ct = default);
    Task<AdminLeadDto?> UpdateLeadStatusAsync(string id, string status, CancellationToken ct = default);
    Task<AdminLeadDto?> UpdateLeadContactAsync(string id, UpdateLeadContactRequest request, CancellationToken ct = default);
    Task<AdminLeadDto?> AddLeadTagAsync(string id, AddLeadTagRequest request, CancellationToken ct = default);
    Task<AdminLeadDto?> AddLeadNoteAsync(string id, AddLeadNoteRequest request, CancellationToken ct = default);
    Task<AdminLeadDto?> UpdatePipelineStageAsync(string id, string stage, CancellationToken ct = default);
    Task<IReadOnlyList<AdminBookingDto>> GetBookingsAsync(CancellationToken ct = default);
    Task<AdminBookingDto?> AssignStaffAsync(string bookingId, AssignStaffRequest request, CancellationToken ct = default);
    Task<AdminBookingDto?> UpdateBookingStatusAsync(string bookingId, UpdateBookingStatusRequest request, CancellationToken ct = default);
    Task<StaffJobDto?> UpdateJobStatusAsync(string jobId, UpdateAdminJobStatusRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(CancellationToken ct = default);
    Task<AdminCustomerDetailDto?> GetCustomerAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<AdminStaffMemberDto>> GetStaffAsync(CancellationToken ct = default);
    Task<AdminStaffMemberDto?> CreateStaffAsync(UpsertStaffRequest request, CancellationToken ct = default);
    Task<AdminStaffMemberDto?> UpdateStaffAsync(string id, UpsertStaffRequest request, CancellationToken ct = default);
    Task<bool> DeleteStaffAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<StaffJobDto>> GetIssuesAsync(CancellationToken ct = default);
    Task<AdminReportStatsDto> GetReportStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminReportListItemDto>> GetAdminReportsAsync(string? search = null, CancellationToken ct = default);
    Task<AdminReportDetailDto?> GetAdminReportAsync(string id, CancellationToken ct = default);
    Task<AdminReportsExportDto> GetAdminReportsExportAsync(CancellationToken ct = default);
    Task<AdminSubscriptionStatsDto> GetSubscriptionStatsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminSubscriptionRowDto>> GetSubscriptionsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminSubscriptionPlanDto>> GetSubscriptionPlansAsync(CancellationToken ct = default);
    Task<AdminSubscriptionPlanDto?> CreateServicePlanAsync(UpsertServicePlanRequest request, CancellationToken ct = default);
    Task<AdminSubscriptionPlanDto?> UpdateServicePlanAsync(string id, UpsertServicePlanRequest request, CancellationToken ct = default);
    Task<bool> DeactivateServicePlanAsync(string id, CancellationToken ct = default);
    Task<SyncPaystackPlanResponseDto?> SyncServicePlanPaystackAsync(string id, CancellationToken ct = default);
    Task<IReadOnlyList<AdminScheduleSlotDto>> GetScheduleSlotsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<AdminInviteDto>> GetInvitesAsync(CancellationToken ct = default);
    Task<SendInviteResponseDto?> SendInviteFromLeadAsync(string leadId, SendInviteRequest? request = null, CancellationToken ct = default);
    Task<AdminLeadDto> CreateLeadAsync(CreateLeadRequestDto request, CancellationToken ct = default);
    Task<AdminLeadDto> SyncBarkLeadAsync(CancellationToken ct = default);
    Task<AdminSearchResultDto> SearchAsync(string query, CancellationToken ct = default);
    Task<AdminPortalSettingsDto> GetPortalSettingsAsync(CancellationToken ct = default);
}
