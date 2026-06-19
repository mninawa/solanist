using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class StaffJobMutations
{
    public static StaffJobDto? CheckIn(StaffJobDocument job, CheckInRequest? request)
    {
        if (job.CompletedAt is not null) return null;

        job.CheckedInAt = DateTime.UtcNow.ToString("O");
        job.CheckInNote = string.IsNullOrWhiteSpace(request?.Note) ? null : request.Note.Trim();
        job.CheckInLatitude = request?.Latitude ?? -26.1076;
        job.CheckInLongitude = request?.Longitude ?? 28.0567;
        job.OnTheWay = true;
        job.Arrived = true;
        job.Status = "in_progress";
        return StaffMappers.ToDto(job);
    }

    public static StaffJobDto? AddPhotos(StaffJobDocument job, string type, IReadOnlyList<string> photos)
    {
        if (photos.Count == 0) return StaffMappers.ToDto(job);

        if (type == "before")
        {
            job.BeforePhotos.AddRange(photos);
            var slots = job.PhotoSlots.Where(s => s.Type == "before" && s.PhotoUrl is null).ToList();
            for (var i = 0; i < photos.Count && i < slots.Count; i++)
                slots[i].PhotoUrl = photos[i];
        }
        else
        {
            job.AfterPhotos.AddRange(photos);
            var slots = job.PhotoSlots.Where(s => s.Type == "after" && s.PhotoUrl is null).ToList();
            for (var i = 0; i < photos.Count && i < slots.Count; i++)
                slots[i].PhotoUrl = photos[i];
        }

        return StaffMappers.ToDto(job);
    }

    public static StaffJobDto UpdateChecklist(StaffJobDocument job, IReadOnlyList<ChecklistItemDto> checklist)
    {
        job.Checklist = checklist.Select(c => new StaffChecklistItemDocument
        {
            Id = c.Id,
            Label = c.Label,
            Completed = c.Completed,
            Required = c.Required,
        }).ToList();
        return StaffMappers.ToDto(job);
    }

    public static StaffJobDto? UpdateJob(StaffJobDocument job, UpdateStaffJobRequest request)
    {
        if (request.OnTheWay is not null) job.OnTheWay = request.OnTheWay.Value;
        if (request.Arrived is not null) job.Arrived = request.Arrived.Value;
        if (request.CompletionNotes is not null) job.CompletionNotes = request.CompletionNotes;
        if (request.BeforeKwhReading is not null) job.BeforeKwhReading = request.BeforeKwhReading;
        if (request.AfterKwhReading is not null) job.AfterKwhReading = request.AfterKwhReading;
        if (request.BeforePhotos is not null)
        {
            job.BeforePhotos = request.BeforePhotos.ToList();
            SyncPhotoSlots(job, "before");
        }

        if (request.AfterPhotos is not null)
        {
            job.AfterPhotos = request.AfterPhotos.ToList();
            SyncPhotoSlots(job, "after");
        }

        if (request.Checklist is not null) UpdateChecklist(job, request.Checklist);
        return StaffMappers.ToDto(job);
    }

    private static void SyncPhotoSlots(StaffJobDocument job, string type)
    {
        var photos = type == "before" ? job.BeforePhotos : job.AfterPhotos;
        var slots = job.PhotoSlots.Where(s => s.Type == type).ToList();
        for (var i = 0; i < slots.Count; i++)
            slots[i].PhotoUrl = i < photos.Count ? photos[i] : null;
    }

    public static StaffJobDto ReportIssue(StaffJobDocument job, ReportJobIssueRequest request)
    {
        job.Issue = new StaffJobIssueDocument
        {
            IssueType = request.IssueType,
            Description = request.Description,
            ReportedAt = DateTime.UtcNow.ToString("O"),
        };
        return StaffMappers.ToDto(job);
    }

    public static StaffJobDto ApplyOperationalStatus(StaffJobDocument job, string targetStatus)
    {
        job.Issue = null;
        job.CompletedAt = null;
        job.CompletionNotes = null;
        job.CheckedInAt = null;
        job.CheckInNote = null;
        job.OnTheWay = false;
        job.Arrived = false;
        job.Status = "scheduled";

        switch (targetStatus.Trim().ToLowerInvariant())
        {
            case "on_the_way":
                job.OnTheWay = true;
                break;
            case "arrived":
                job.OnTheWay = true;
                job.Arrived = true;
                break;
            case "checked_in":
            case "before_photos_required":
            case "cleaning_in_progress":
            case "checklist_required":
            case "after_photos_required":
            case "ready_to_complete":
                job.OnTheWay = true;
                job.Arrived = true;
                job.CheckedInAt = DateTime.UtcNow.ToString("O");
                job.Status = "in_progress";
                break;
            case "issue_reported":
                job.Issue = new StaffJobIssueDocument
                {
                    IssueType = "other",
                    Description = "Flagged from admin jobs board.",
                    ReportedAt = DateTime.UtcNow.ToString("O"),
                };
                break;
            case "completed":
                job.Status = "completed";
                job.CompletedAt = DateTime.UtcNow.ToString("O");
                job.CompletionNotes = "Completed from admin jobs board.";
                job.OnTheWay = true;
                job.Arrived = true;
                break;
            case "cancelled":
                job.Status = "cancelled";
                break;
            default:
                break;
        }

        return StaffMappers.ToDto(job);
    }

    public static StaffJobDto? Complete(StaffJobDocument job, string notes)
    {
        if (job.CompletedAt is not null) return StaffMappers.ToDto(job);

        job.Status = "completed";
        job.CompletedAt = DateTime.UtcNow.ToString("O");
        job.CompletionNotes = notes;
        return StaffMappers.ToDto(job);
    }

    public static StaffDashboardDto BuildDashboard(string staffName, string today, IReadOnlyList<StaffJobDocument> jobs)
    {
        var todayJobs = jobs
            .Where(j => j.ScheduledDate == today)
            .OrderBy(j => j.RouteOrder)
            .ToList();

        var completedCount = todayJobs.Count(j => j.CompletedAt is not null);
        return new StaffDashboardDto(
            staffName,
            today,
            todayJobs.Select(StaffMappers.ToDto).ToList(),
            completedCount,
            todayJobs.Count);
    }
}
