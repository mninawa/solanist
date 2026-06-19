namespace Solanist.Application.Dtos;

public sealed record AdminLeadTagDto(string Label, string Tone);

public sealed record AdminLeadActivityDto(
    string Id,
    string Type,
    string Title,
    string? Description,
    string Timestamp);

public sealed record AdminLeadChecklistItemDto(string Label, bool Done, string? Date = null);

public sealed record AdminLeadQuoteSummaryDto(
    string Ref,
    string PlanName,
    decimal Price,
    string PriceLabel,
    string Status,
    string? FirstVisit = null);

public sealed record AdminNearbyLeadDto(string Name, string Location, int Score);

public sealed record AdminLeadDto(
    string Id,
    string Source,
    string Status,
    string PipelineStage,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string PropertyAddress,
    string City,
    string? Postcode,
    string? Province,
    int PanelCount,
    string? EstimatedPanelsRange,
    string RoofType,
    string? AccessNotes,
    string? PreferredServiceTime,
    string? PropertyType,
    string Notes,
    string RequestSnippet,
    string CreatedAt,
    string Urgency,
    int LeadScore,
    string ServiceType,
    IReadOnlyList<AdminLeadTagDto> Tags,
    string? BestTimeToContact,
    string? PreferredContact,
    string? QuoteRef,
    string? InviteCode,
    string? InviteLink,
    string? RecommendedPlan,
    IReadOnlyList<AdminLeadActivityDto> Activities,
    IReadOnlyList<AdminLeadChecklistItemDto> Checklist,
    IReadOnlyList<AdminNearbyLeadDto> NearbyLeads,
    AdminLeadQuoteSummaryDto? QuoteSummary = null,
    string? ConversationNotes = null);

public sealed record AdminStaffMemberDto(
    string Id,
    string FullName,
    string Phone,
    string Role,
    string Status,
    int JobsToday,
    int CompletedToday,
    string Email = "",
    string AccountRole = "staff");

public sealed record UpsertStaffRequest(
    string FirstName,
    string LastName,
    string Email,
    string? Phone,
    string? Role);

public sealed record AdminCustomerDto(
    string Id,
    string Name,
    string Email,
    string Phone,
    int PropertyCount,
    string? PlanName,
    string Status,
    string PrimaryAddress);

public sealed record AdminCustomerPropertyDto(
    string Id,
    string Address,
    string City,
    string Postcode,
    int PanelCount,
    string RoofType,
    double? SystemSizeKw,
    bool IsPrimary,
    string? PlanName,
    string? NextCleanDate,
    string? ImageUrl);

public sealed record AdminCustomerSubscriptionDto(
    string PlanName,
    string Status,
    decimal PricePerVisit,
    decimal AnnualPrice,
    string BillingCycle,
    string NextBillingDate,
    int VisitsRemaining,
    string PaymentMethod,
    IReadOnlyList<string> Features);

public sealed record AdminCustomerDetailDto(
    string Id,
    string Name,
    string Email,
    string Phone,
    string Status,
    string PreferredContact,
    bool EmailReminders,
    bool WhatsAppReminders,
    string BillingMode,
    IReadOnlyList<AdminCustomerPropertyDto> Properties,
    AdminCustomerSubscriptionDto? Subscription,
    IReadOnlyList<AdminBookingDto> Bookings);

public sealed record AdminBookingDto(
    string Id,
    string BookingRef,
    string CustomerName,
    string PropertyAddress,
    string Date,
    string TimeSlot,
    string Status,
    string? StaffName,
    string? StaffId,
    string? PlanName,
    int? PanelCount);

public sealed record AdminInboxStatsDto(
    int NewLeadsToday,
    string NewLeadsTrend,
    int EmailLeadsCaptured,
    string EmailLeadsTrend,
    int UrgentLeads,
    int InvitesSent,
    string InvitesTrend,
    int QuotesSent,
    string QuotesTrend,
    int JobsBooked,
    string JobsBookedTrend,
    int TopLeadScore,
    string? TopLeadName,
    IReadOnlyList<AdminHotspotDto> Hotspots,
    IReadOnlyList<string> SuggestedSteps,
    string LastSyncAt,
    bool EmailConnected);

public sealed record AdminFunnelStageDto(string Label, int Count, string Stage);

public sealed record AdminHotspotDto(string Area, int Leads);

public sealed record AdminBarkRequestDto(
    string Id,
    string CustomerName,
    string Location,
    int MinutesAgo,
    string Urgency,
    string? StatusLabel = null);

public sealed record AdminUpcomingJobDto(
    string Id,
    string DateLabel,
    string Time,
    string Service,
    string CustomerName,
    string Location,
    string Status);

public sealed record AdminRevenueTrendPointDto(string Label, decimal Amount);

public sealed record AdminDashboardStatsDto(
    int NewLeadsToday,
    string NewLeadsTrend,
    int QuotesSent,
    string QuotesTrend,
    int JobsScheduled,
    string JobsTrend,
    int ActiveSubscriptions,
    string SubscriptionsTrend,
    decimal RevenueMtd,
    string RevenueTrend);

public sealed record AdminDashboardDto(
    string AdminName,
    AdminDashboardStatsDto Stats,
    IReadOnlyList<AdminFunnelStageDto> Funnel,
    double ConversionRate,
    double AvgTimeToWin,
    IReadOnlyList<AdminHotspotDto> Hotspots,
    IReadOnlyList<AdminUpcomingJobDto> UpcomingJobs,
    IReadOnlyList<AdminBarkRequestDto> BarkRequests,
    IReadOnlyList<string> AiSummary,
    decimal RevenuePaid,
    decimal RevenuePending,
    decimal AvgDealSize,
    int OpenLeads,
    IReadOnlyList<StaffJobDto> TodayJobs,
    IReadOnlyList<AdminRevenueTrendPointDto> RevenueTrendPoints);

public sealed record AdminInviteDto(
    string Id,
    string Code,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    InviteQuoteDto Quote,
    PropertyDetailsDto Property,
    IReadOnlyList<ServicePlanDto> Plans,
    DateTime ExpiresAt,
    string Status,
    string SentAt,
    string SentBy);

public sealed record AdminSubscriptionPlanDto(
    string Id,
    string Name,
    decimal Price,
    string Interval,
    IReadOnlyList<string> Features,
    bool Popular = false,
    string Description = "",
    int VisitsPerYear = 0,
    decimal AnnualPrice = 0,
    bool Active = true,
    string? PaystackPlanCode = null,
    string PaystackInterval = "quarterly",
    bool PaystackLinked = false);

public sealed record UpsertServicePlanRequest(
    string Name,
    string? Description,
    decimal PricePerVisit,
    int VisitsPerYear,
    IReadOnlyList<string> Features,
    bool Popular,
    bool Active,
    string? PaystackPlanCode,
    string PaystackInterval);

public sealed record SyncPaystackPlanResponseDto(
    AdminSubscriptionPlanDto Plan,
    string? Message = null);

public sealed record AdminSubscriptionRowDto(
    string Id,
    string CustomerName,
    string Location,
    string PlanType,
    string NextCleanDate,
    string NextCleanRelative,
    string PaymentStatus,
    string PlanStatus);

public sealed record AdminSubscriptionStatsDto(
    int ActivePlans,
    string ActivePlansTrend,
    int DueThisWeek,
    decimal MonthlyRecurringRevenue,
    string MrrTrend,
    int RenewalRate,
    string RenewalTrend);

public sealed record AdminScheduleSlotEntryDto(
    string Time,
    string Initials,
    string Status);

public sealed record AdminScheduleSlotDto(
    string Area,
    IReadOnlyList<AdminScheduleSlotEntryDto> Slots);

public sealed record UpdateLeadStatusRequest(string Status);

public sealed record UpdateLeadPipelineRequest(string PipelineStage);

public sealed record UpdateLeadContactRequest(
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string PropertyAddress,
    string City,
    string? BestTimeToContact = null,
    string? PreferredContact = null);

public sealed record AddLeadTagRequest(string Label, string? Tone = "teal");

public sealed record AddLeadNoteRequest(string Note);

public sealed record AssignStaffRequest(string StaffId, string StaffName);

public sealed record UpdateBookingStatusRequest(string Status);

public sealed record UpdateAdminJobStatusRequest(string OperationalStatus);

public sealed record AdminIntegrationStatusDto(
    string Key,
    string Label,
    string Status,
    string Detail);

public sealed record AdminPortalCountsDto(
    int Leads,
    int Customers,
    int StaffMembers,
    int ActiveSubscriptions);

public sealed record AdminPortalSettingsDto(
    string Environment,
    string DatabaseName,
    string AppBaseUrl,
    bool PasswordResetDemoLinks,
    bool MongoConnected,
    IReadOnlyList<AdminIntegrationStatusDto> Integrations,
    AdminPortalCountsDto Counts);

public sealed record SendInviteRequest(int ExpiryDays = 14, string? SentBy = null);

public sealed record SendInviteResponseDto(AdminLeadDto Lead, AdminInviteDto Invite);

public sealed record CreateLeadRequestDto(
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    string PropertyAddress,
    string City,
    string? Postcode,
    string RequestSnippet,
    string? Notes = null,
    string Source = "bark_email",
    string Urgency = "normal",
    int PanelCount = 16,
    string RoofType = "Tile",
    string? Province = "Gauteng",
    string? ServiceType = "Solar Panel Cleaning");

public sealed record AdminSearchHitDto(string Id, string Type, string Title, string Subtitle);

public sealed record AdminSearchResultDto(string Query, IReadOnlyList<AdminSearchHitDto> Hits);

public sealed record AdminReportPerformanceDto(
    double? BeforeKwh,
    double? AfterKwh,
    double? KwhGain,
    double? GainPercent,
    double? GainPerPanel);

public sealed record AdminReportEntityRefsDto(
    string ReportId,
    string CustomerId,
    string? CustomerName,
    string? CustomerEmail,
    string? PropertyId,
    string? BookingId,
    string? StaffName);

public sealed record AdminReportPropertyContextDto(
    string AddressLine,
    string? City,
    string? Postcode,
    string FullAddress,
    int PanelCount,
    double? SystemSizeKw,
    string? RoofType,
    string? AccessNotes);

public sealed record AdminReportServiceContextDto(
    string CompletedAt,
    string ServiceType,
    string? PlanName,
    string Status,
    IReadOnlyList<string> ChecklistCompleted,
    string StaffNotes);

public sealed record AdminReportMediaDto(
    IReadOnlyList<string> BeforePhotos,
    IReadOnlyList<string> AfterPhotos,
    string? PropertyImageUrl,
    int BeforePhotoCount,
    int AfterPhotoCount);

public sealed record AdminReportDetailDto(
    string DocumentType,
    AdminReportEntityRefsDto Entities,
    AdminReportPropertyContextDto Property,
    AdminReportServiceContextDto Service,
    AdminReportPerformanceDto Performance,
    AdminReportMediaDto Media,
    string NarrativeText);

public sealed record AdminReportListItemDto(
    string Id,
    string CompletedAt,
    string CustomerName,
    string CustomerId,
    string PropertyAddress,
    string? City,
    int PanelCount,
    double? SystemSizeKw,
    string StaffName,
    AdminReportPerformanceDto Performance,
    int PhotoCount,
    bool HasStaffNotes,
    string Status,
    string? ThumbnailUrl);

public sealed record AdminReportStatsDto(
    int TotalReports,
    int ReportsThisMonth,
    double? AverageKwhGain,
    int ReportsWithPerformanceData);

public sealed record AdminReportsExportDto(
    string SchemaVersion,
    string GeneratedAt,
    IReadOnlyList<AdminReportDetailDto> Reports);
