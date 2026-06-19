namespace Solanist.Application.Dtos;

public sealed record PublishJobReportRequest(
    string JobId,
    string CustomerId,
    string PropertyId,
    string BookingId,
    string Address,
    string City,
    string Postcode,
    int PanelCount,
    double SystemSizeKw,
    string RoofType,
    string AccessNotes,
    string PlanName,
    string? PropertyImageUrl,
    IReadOnlyList<string> BeforePhotos,
    IReadOnlyList<string> AfterPhotos,
    double? BeforeKwhReading,
    double? AfterKwhReading,
    IReadOnlyList<string> ChecklistSummary,
    string StaffNotes);
