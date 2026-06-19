using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Mock;

public sealed class MockStaffService(ICurrentUser currentUser) : IStaffService
{
    private readonly List<StaffJobDocument> _jobs = StaffSeedData.Jobs
        .Select(Clone)
        .ToList();

    public Task<StaffDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var jobs = FilteredJobs().Where(j => j.ScheduledDate == today).ToList();
        var date = today;
        if (jobs.Count == 0)
        {
            jobs = FilteredJobs().Where(j => j.ScheduledDate == StaffSeedData.DemoToday).ToList();
            if (jobs.Count > 0) date = StaffSeedData.DemoToday;
        }

        return Task.FromResult(StaffJobMutations.BuildDashboard(currentUser.DisplayName, date, jobs));
    }

    public Task<StaffScheduleDto> GetScheduleAsync(string? from = null, string? to = null, CancellationToken ct = default)
    {
        var (fromDate, toDate) = StaffJobQueries.ResolveScheduleRange(from, to);
        var jobs = FilteredJobs()
            .Where(j => string.CompareOrdinal(j.ScheduledDate, fromDate) >= 0 &&
                        string.CompareOrdinal(j.ScheduledDate, toDate) <= 0)
            .OrderBy(j => j.ScheduledDate)
            .ThenBy(j => j.RouteOrder)
            .Select(StaffMappers.ToDto)
            .ToList();

        return Task.FromResult(new StaffScheduleDto(fromDate, toDate, jobs));
    }

    public Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<StaffJobDto>>(FilteredJobs().Select(StaffMappers.ToDto).ToList());

    public Task<StaffJobDto?> GetJobAsync(string id, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        return Task.FromResult(job is null ? null : StaffMappers.ToDto(job));
    }

    public Task<StaffProfileDto?> GetProfileAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(currentUser.UserId))
            return Task.FromResult<StaffProfileDto?>(null);

        return Task.FromResult<StaffProfileDto?>(new StaffProfileDto(
            currentUser.UserId,
            currentUser.Email ?? "james.staff@solanist.co.za",
            currentUser.FirstName ?? "James",
            currentUser.LastName ?? "Mitchell",
            "082 987 6543",
            currentUser.Role ?? "staff",
            currentUser.StaffId ?? StaffJobQueries.DefaultStaffId));
    }

    public Task<IReadOnlyList<StaffNotificationDto>> GetNotificationsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<StaffNotificationDto>>([]);

    public Task<int> MarkNotificationsReadAsync(CancellationToken ct = default) =>
        Task.FromResult(0);

    public Task<StaffJobDto?> CheckInAsync(string id, CheckInRequest? request = null, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.CheckIn(job, request));
    }

    public Task<StaffJobDto?> AddPhotosAsync(string id, string type, IReadOnlyList<string> photos, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.AddPhotos(job, type, photos));
    }

    public Task<StaffJobDto?> UpdateChecklistAsync(string id, IReadOnlyList<ChecklistItemDto> checklist, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.UpdateChecklist(job, checklist));
    }

    public Task<StaffJobDto?> UpdateJobAsync(string id, UpdateStaffJobRequest request, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.UpdateJob(job, request));
    }

    public Task<StaffJobDto?> ReportIssueAsync(string id, ReportJobIssueRequest request, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.ReportIssue(job, request));
    }

    public Task<StaffJobDto?> CompleteJobAsync(string id, string notes, CancellationToken ct = default)
    {
        var job = FindForStaff(id);
        if (job is null) return Task.FromResult<StaffJobDto?>(null);
        return Task.FromResult(StaffJobMutations.Complete(job, notes));
    }

    private IEnumerable<StaffJobDocument> FilteredJobs()
    {
        if (string.IsNullOrWhiteSpace(currentUser.StaffId))
            return _jobs;
        return _jobs.Where(j => j.StaffId == currentUser.StaffId);
    }

    private StaffJobDocument? FindForStaff(string id) =>
        FilteredJobs().FirstOrDefault(j => j.Id == id);

    private static StaffJobDocument Clone(StaffJobDocument source) => new()
    {
        Id = source.Id,
        StaffId = source.StaffId,
        BookingId = source.BookingId,
        PropertyId = source.PropertyId,
        CustomerId = source.CustomerId,
        CustomerName = source.CustomerName,
        CustomerPhone = source.CustomerPhone,
        CustomerEmail = source.CustomerEmail,
        Address = source.Address,
        City = source.City,
        Postcode = source.Postcode,
        ServiceType = source.ServiceType,
        PlanType = source.PlanType,
        ScheduledTime = source.ScheduledTime,
        ScheduledDate = source.ScheduledDate,
        Status = source.Status,
        RouteOrder = source.RouteOrder,
        PanelCount = source.PanelCount,
        SystemSizeKw = source.SystemSizeKw,
        RoofType = source.RoofType,
        AccessShort = source.AccessShort,
        AccessNotes = source.AccessNotes,
        HeroImageUrl = source.HeroImageUrl,
        Instructions = source.Instructions,
        Checklist = source.Checklist.Select(c => new StaffChecklistItemDocument
        {
            Id = c.Id,
            Label = c.Label,
            Completed = c.Completed,
            Required = c.Required,
        }).ToList(),
        PhotoSlots = source.PhotoSlots.Select(s => new StaffPhotoSlotDocument
        {
            Id = s.Id,
            Label = s.Label,
            Type = s.Type,
            Required = s.Required,
            PhotoUrl = s.PhotoUrl,
        }).ToList(),
        BeforePhotos = source.BeforePhotos.ToList(),
        AfterPhotos = source.AfterPhotos.ToList(),
        BeforeKwhReading = source.BeforeKwhReading,
        AfterKwhReading = source.AfterKwhReading,
        CheckedInAt = source.CheckedInAt,
        CheckInLatitude = source.CheckInLatitude,
        CheckInLongitude = source.CheckInLongitude,
        CheckInNote = source.CheckInNote,
        CompletedAt = source.CompletedAt,
        CompletionNotes = source.CompletionNotes,
        OnTheWay = source.OnTheWay,
        Arrived = source.Arrived,
        Issue = source.Issue is null
            ? null
            : new StaffJobIssueDocument
            {
                IssueType = source.Issue.IssueType,
                Description = source.Issue.Description,
                ReportedAt = source.Issue.ReportedAt,
            },
    };
}
