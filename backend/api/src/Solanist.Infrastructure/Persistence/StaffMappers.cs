using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class StaffMappers
{
    public static StaffJobDto ToDto(StaffJobDocument job) => new(
        job.Id,
        job.BookingId,
        job.PropertyId,
        job.CustomerId,
        job.CustomerName,
        job.CustomerPhone,
        job.CustomerEmail,
        job.Address,
        job.City,
        job.Postcode,
        job.ServiceType,
        job.PlanType,
        job.ScheduledTime,
        job.ScheduledDate,
        job.Status,
        job.RouteOrder,
        job.PanelCount,
        job.SystemSizeKw,
        job.RoofType,
        job.AccessShort,
        job.AccessNotes,
        job.HeroImageUrl,
        job.Instructions,
        job.Checklist.Select(ToChecklistDto).ToList(),
        job.PhotoSlots.Select(ToPhotoSlotDto).ToList(),
        job.BeforePhotos,
        job.AfterPhotos,
        job.BeforeKwhReading,
        job.AfterKwhReading,
        job.CheckedInAt,
        job.CheckInLatitude,
        job.CheckInLongitude,
        job.CheckInNote,
        job.CompletedAt,
        job.CompletionNotes,
        job.OnTheWay,
        job.Arrived,
        job.Issue is null ? null : ToIssueDto(job.Issue));

    public static StaffJobSummaryDto ToSummaryDto(StaffJobDocument job) => new(
        job.Id,
        job.BookingId,
        job.CustomerName,
        job.CustomerPhone,
        job.Address,
        job.City,
        job.Postcode,
        job.ServiceType,
        job.PlanType,
        job.ScheduledTime,
        job.ScheduledDate,
        job.Status,
        job.RouteOrder,
        job.PanelCount,
        job.SystemSizeKw,
        job.RoofType,
        job.AccessShort,
        job.HeroImageUrl,
        job.CheckedInAt,
        job.CompletedAt,
        job.OnTheWay,
        job.Arrived,
        job.Issue is null ? null : ToIssueDto(job.Issue),
        job.BeforePhotos.Count,
        job.AfterPhotos.Count,
        job.BeforeKwhReading,
        job.AfterKwhReading,
        job.Checklist.Select(ToChecklistDto).ToList());

    private static ChecklistItemDto ToChecklistDto(StaffChecklistItemDocument item) =>
        new(item.Id, item.Label, item.Completed, item.Required);

    private static JobPhotoSlotDto ToPhotoSlotDto(StaffPhotoSlotDocument slot) =>
        new(slot.Id, slot.Label, slot.Type, slot.Required, slot.PhotoUrl);

    private static JobIssueDto ToIssueDto(StaffJobIssueDocument issue) =>
        new(issue.IssueType, issue.Description, issue.ReportedAt);
}
