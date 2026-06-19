using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminReportMappers
{
    public const string DocumentType = "solar_cleaning_report";
    public const string ExportSchemaVersion = "1.0";

    public static AdminReportPerformanceDto ToPerformance(ReportDocument report)
    {
        var gain = report.KwhGain;
        var before = report.BeforeKwhReading;
        double? gainPercent = null;
        if (gain is not null && before is > 0)
            gainPercent = Math.Round((gain.Value / before.Value) * 100, 2);

        double? gainPerPanel = null;
        if (gain is not null && report.PanelCount > 0)
            gainPerPanel = Math.Round(gain.Value / report.PanelCount, 2);

        return new AdminReportPerformanceDto(
            before,
            report.AfterKwhReading,
            gain,
            gainPercent,
            gainPerPanel);
    }

    public static (string Line, string? City, string? Postcode) ParseAddress(string address)
    {
        var parts = address.Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length >= 3)
            return (parts[0], parts[1], parts[2]);
        if (parts.Length == 2)
            return (parts[0], parts[1], null);
        return (address, null, null);
    }

    public static AdminReportListItemDto ToListItem(
        ReportDocument report,
        CustomerDocument? customer)
    {
        var (line, city, _) = ParseAddress(report.PropertyAddress);
        var customerName = customer is null
            ? "Customer"
            : $"{customer.FirstName} {customer.LastName}".Trim();

        return new AdminReportListItemDto(
            report.Id,
            report.CompletedAt,
            customerName,
            report.CustomerId,
            line,
            city,
            report.PanelCount,
            report.SystemSizeKw,
            report.StaffName,
            ToPerformance(report),
            report.BeforePhotos.Count + report.AfterPhotos.Count,
            !string.IsNullOrWhiteSpace(report.StaffNotes),
            report.Status,
            report.BeforePhotos.FirstOrDefault() ?? report.PropertyImageUrl);
    }

    public static AdminReportDetailDto ToDetail(ReportDocument report, CustomerDocument? customer)
    {
        var (line, city, postcode) = ParseAddress(report.PropertyAddress);
        var customerName = customer is null
            ? null
            : $"{customer.FirstName} {customer.LastName}".Trim();

        var entities = new AdminReportEntityRefsDto(
            report.Id,
            report.CustomerId,
            customerName,
            customer?.Email,
            report.PropertyId,
            report.BookingId,
            report.StaffName);

        var property = new AdminReportPropertyContextDto(
            line,
            city,
            postcode,
            report.PropertyAddress,
            report.PanelCount,
            report.SystemSizeKw,
            report.RoofType,
            report.AccessNotes);

        var service = new AdminReportServiceContextDto(
            report.CompletedAt,
            report.ServiceType,
            report.PlanName,
            report.Status,
            report.ChecklistSummary,
            report.StaffNotes);

        var media = new AdminReportMediaDto(
            report.BeforePhotos,
            report.AfterPhotos,
            report.PropertyImageUrl,
            report.BeforePhotos.Count,
            report.AfterPhotos.Count);

        return new AdminReportDetailDto(
            DocumentType,
            entities,
            property,
            service,
            ToPerformance(report),
            media,
            BuildNarrative(report, customerName, city));
    }

    public static string BuildNarrative(ReportDocument report, string? customerName, string? city)
    {
        var location = string.IsNullOrWhiteSpace(city)
            ? report.PropertyAddress
            : $"{report.PropertyAddress} ({city})";

        var performance = report.KwhGain is not null && report.BeforeKwhReading is not null
            ? $"Energy meter readings improved from {report.BeforeKwhReading:0.##} kWh to {report.AfterKwhReading:0.##} kWh (+{report.KwhGain:0.##} kWh)."
            : "No meter readings were recorded for this visit.";

        var checklist = report.ChecklistSummary.Count > 0
            ? string.Join("; ", report.ChecklistSummary)
            : "No checklist items recorded.";

        var notes = string.IsNullOrWhiteSpace(report.StaffNotes)
            ? "No technician notes."
            : report.StaffNotes.Trim();

        return
            $"Solar panel cleaning report for {location}. " +
            $"Customer: {customerName ?? "unknown"}. " +
            $"Service completed on {report.CompletedAt} by {report.StaffName}. " +
            $"System: {report.PanelCount} panels, {report.SystemSizeKw ?? 0} kW, {report.RoofType ?? "roof type not recorded"}. " +
            $"Plan: {report.PlanName ?? "not on subscription"}. " +
            performance + " " +
            $"Checklist completed: {checklist}. " +
            $"Technician notes: {notes}";
    }
}
