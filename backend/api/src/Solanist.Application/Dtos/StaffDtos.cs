namespace Solanist.Application.Dtos;

public sealed record StaffNotificationDto(
    string Id,
    string Title,
    string Body,
    string Type,
    string? BookingRef,
    bool Read,
    DateTime CreatedAt);

public sealed record JobPhotoSlotDto(
    string Id,
    string Label,
    string Type,
    bool Required,
    string? PhotoUrl);

public sealed record JobIssueDto(
    string IssueType,
    string Description,
    string ReportedAt);

public sealed record StaffJobDto(
    string Id,
    string BookingId,
    string PropertyId,
    string CustomerId,
    string CustomerName,
    string CustomerPhone,
    string CustomerEmail,
    string Address,
    string City,
    string Postcode,
    string ServiceType,
    string PlanType,
    string ScheduledTime,
    string ScheduledDate,
    string Status,
    int RouteOrder,
    int PanelCount,
    double SystemSizeKw,
    string RoofType,
    string AccessShort,
    string AccessNotes,
    string HeroImageUrl,
    string Instructions,
    IReadOnlyList<ChecklistItemDto> Checklist,
    IReadOnlyList<JobPhotoSlotDto> PhotoSlots,
    IReadOnlyList<string> BeforePhotos,
    IReadOnlyList<string> AfterPhotos,
    double? BeforeKwhReading,
    double? AfterKwhReading,
    string? CheckedInAt,
    double? CheckInLatitude,
    double? CheckInLongitude,
    string? CheckInNote,
    string? CompletedAt,
    string? CompletionNotes,
    bool OnTheWay,
    bool Arrived,
    JobIssueDto? Issue);

public sealed record StaffJobSummaryDto(
    string Id,
    string BookingId,
    string CustomerName,
    string CustomerPhone,
    string Address,
    string City,
    string Postcode,
    string ServiceType,
    string PlanType,
    string ScheduledTime,
    string ScheduledDate,
    string Status,
    int RouteOrder,
    int PanelCount,
    double SystemSizeKw,
    string RoofType,
    string AccessShort,
    string HeroImageUrl,
    string? CheckedInAt,
    string? CompletedAt,
    bool OnTheWay,
    bool Arrived,
    JobIssueDto? Issue,
    int BeforePhotoCount,
    int AfterPhotoCount,
    double? BeforeKwhReading,
    double? AfterKwhReading,
    IReadOnlyList<ChecklistItemDto> Checklist);

public sealed record StaffDashboardDto(
    string StaffName,
    string TodayDate,
    IReadOnlyList<StaffJobDto> Jobs,
    int CompletedCount,
    int TotalCount);

public sealed record StaffScheduleDto(
    string From,
    string To,
    IReadOnlyList<StaffJobDto> Jobs);

public sealed record CheckInRequest(string? Note = null, double? Latitude = null, double? Longitude = null);

public sealed record UpdateStaffJobRequest(
    bool? OnTheWay = null,
    bool? Arrived = null,
    string? CompletionNotes = null,
    double? BeforeKwhReading = null,
    double? AfterKwhReading = null,
    IReadOnlyList<string>? BeforePhotos = null,
    IReadOnlyList<string>? AfterPhotos = null,
    IReadOnlyList<ChecklistItemDto>? Checklist = null);

public sealed record ReportJobIssueRequest(string IssueType, string Description);

public sealed record StaffProfileDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string? Phone,
    string Role,
    string? StaffId);
