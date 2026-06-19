namespace Solanist.Application.Dtos;

public sealed record ServicePlanDto(
    string Id,
    string Name,
    string Description,
    decimal PricePerVisit,
    int VisitsPerYear,
    decimal AnnualPrice,
    IReadOnlyList<string> Features,
    bool Recommended = false);

public sealed record PropertyDetailsDto(
    string Address,
    string City,
    string Postcode,
    int PanelCount,
    string RoofType,
    string? AccessNotes,
    double? SystemSizeKw,
    string? ImageUrl);

public sealed record InviteQuoteDto(
    decimal BasePrice,
    int EstimatedPanelCount,
    string ServiceType,
    string? QuoteRef,
    string? Notes);

public sealed record InviteDto(
    string Code,
    string CustomerName,
    string CustomerEmail,
    string CustomerPhone,
    InviteQuoteDto Quote,
    PropertyDetailsDto Property,
    IReadOnlyList<ServicePlanDto> Plans,
    DateTime ExpiresAt,
    string Status,
    string? SignupBlockedReason = null);

public sealed record SubscriptionSummaryDto(
    string Status,
    string PlanName,
    decimal AnnualPrice,
    int VisitsRemaining = 0);

public sealed record ClientDashboardDto(
    string CustomerName,
    string CustomerFullName,
    string Greeting,
    PlanSummaryDto CurrentPlan,
    NextServiceDto? NextService,
    PropertyDetailsDto Property,
    double SystemSizeKw,
    CleaningReportSummaryDto? LatestReport,
    SubscriptionSummaryDto Subscription,
    IReadOnlyList<string> ValueProps,
    string? SystemStatus = null);

public sealed record PlanSummaryDto(string Name, decimal PricePerVisit, int VisitsPerYear, DateOnly NextBillingDate);
public sealed record NextServiceDto(string Date, string TimeSlot, int DaysUntil, string Status);

public sealed record BookingDto(
    string Id,
    string Date,
    string TimeSlot,
    string Status,
    string ServiceType,
    string PropertyAddress,
    string? StaffName,
    string? ConfirmationStatus,
    string? BookingRef = null,
    string? PropertyId = null,
    string? PropertyPostcode = null,
    string? PlanName = null,
    string? BookedOn = null,
    string? ServiceDuration = null,
    int? PanelCount = null,
    double? SystemSizeKw = null,
    string? RoofType = null,
    string? AccessNotes = null,
    string? SpecialInstructions = null,
    string? BillingNote = null,
    bool? IsNextBooking = null);

public sealed record CleaningReportSummaryDto(
    string Id,
    string CompletedAt,
    string ServiceType,
    int PanelCount,
    string? StaffName,
    string? ThumbnailUrl);

public sealed record CleaningReportDto(
    string Id,
    string CompletedAt,
    string ServiceType,
    int PanelCount,
    string StaffName,
    string PropertyAddress,
    IReadOnlyList<string> BeforePhotos,
    IReadOnlyList<string> AfterPhotos,
    IReadOnlyList<string> ChecklistSummary,
    string StaffNotes,
    string? PropertyId = null,
    string? BookingId = null,
    string? PlanName = null,
    double? SystemSizeKw = null,
    string? RoofType = null,
    string? AccessNotes = null,
    string? PropertyImageUrl = null,
    double? BeforeKwhReading = null,
    double? AfterKwhReading = null,
    double? KwhGain = null,
    string? Status = null);

public sealed record SubscriptionDto(
    string PlanName,
    string PlanDescription,
    string Status,
    decimal PricePerVisit,
    decimal AnnualPrice,
    string BillingCycle,
    string NextBillingDate,
    string NextCleanDate,
    int VisitsRemaining,
    string PaymentMethod,
    IReadOnlyList<string> Features,
    string PaymentProvider = "manual",
    bool RequiresPaymentSetup = false);

public sealed record PaymentDto(string Id, string Date, string Description, decimal Amount, string Status);
public sealed record PropertySummaryDto(
    string Id,
    string Address,
    string City,
    string Postcode,
    int PanelCount,
    string RoofType,
    string? AccessNotes,
    double? SystemSizeKw,
    string? ImageUrl,
    bool IsPrimary,
    string? SubscriptionStatus = null,
    string? PlanName = null,
    string? PlanVariant = null,
    string? PlanFrequency = null,
    string? NextCleanDate = null,
    string? NextCleanTimeSlot = null,
    decimal? PricePerClean = null,
    int? VisitsPerYear = null,
    int? VisitsRemaining = null,
    decimal? MonthlyBilling = null);

public sealed record ClientProfileDto(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string PreferredContact,
    bool EmailReminders,
    bool WhatsAppReminders);

public sealed record UpdateClientProfileRequestDto(
    string FirstName,
    string LastName,
    string Phone,
    string PreferredContact,
    bool EmailReminders,
    bool WhatsAppReminders);

public sealed record ChangePasswordRequestDto(
    string? CurrentPassword,
    string NewPassword,
    string ConfirmPassword);

public sealed record ChangePasswordResultDto(bool Success, string? ErrorCode = null);

public sealed record ChecklistItemDto(string Id, string Label, bool Completed, bool Required);

public sealed record AddPhotosRequest(string Type, IReadOnlyList<string> Photos);
public sealed record UpdateChecklistRequest(IReadOnlyList<ChecklistItemDto> Checklist);
public sealed record CompleteJobRequest(string Notes, PublishJobReportRequest? Report = null);

public sealed record CreateBookingRequest(
    string PropertyId,
    string Date,
    string TimeSlot,
    string CleaningType,
    string? SpecialInstructions = null);

public sealed record RescheduleBookingRequest(
    string BookingId,
    string Date,
    string TimeSlot,
    string? Notes = null);

public sealed record CreatePropertyRequest(
    string Address,
    string City,
    string Postcode,
    int PanelCount,
    string RoofType,
    string? AccessNotes = null,
    double? SystemSizeKw = null);

public sealed record UpdatePropertyImageRequest(string ImageUrl);
public sealed record UpdatePropertyNextCleanRequest(string? Date);

public sealed record SetBillingModeRequest(string BillingMode);

public sealed record InvoicePreviewItemDto(
    string PropertyId,
    string PropertyName,
    string PlanName,
    decimal Amount);

public sealed record SubscriptionPortfolioDto(
    string BillingMode,
    string PaymentMethod,
    string NextBillingDate,
    decimal UpcomingBillingTotal,
    IReadOnlyList<InvoicePreviewItemDto> InvoicePreview);

public sealed record SubscriptionPortfolioResponseDto(
    IReadOnlyList<PropertySummaryDto> Properties,
    SubscriptionPortfolioDto Portfolio,
    IReadOnlyList<PaymentDto> Payments);

public sealed record PropertyPlanDetailsDto(
    PropertySummaryDto Property,
    SubscriptionDto? Plan,
    IReadOnlyList<PaymentDto> RecentPayments,
    IReadOnlyList<BookingDto> UpcomingBookings,
    IReadOnlyList<CleaningReportSummaryDto> RecentReports);
