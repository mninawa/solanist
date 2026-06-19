using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoStaffService(IMongoDatabase db, ICurrentUser currentUser) : IStaffService
{
    private IMongoCollection<StaffJobDocument> Jobs =>
        db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);

    private IMongoCollection<UserDocument> Users =>
        db.GetCollection<UserDocument>(MongoCollections.Users);

    private IMongoCollection<NotificationDocument> Notifications =>
        db.GetCollection<NotificationDocument>(MongoCollections.Notifications);

    public async Task<StaffDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var (date, jobs) = await StaffJobQueries.GetDashboardJobsAsync(Jobs, currentUser.StaffId, ct);
        return StaffJobMutations.BuildDashboard(await GetStaffNameAsync(ct), date, jobs);
    }

    public async Task<StaffScheduleDto> GetScheduleAsync(
        string? from = null,
        string? to = null,
        CancellationToken ct = default)
    {
        var (fromDate, toDate) = StaffJobQueries.ResolveScheduleRange(from, to);
        var filter = StaffJobQueries.ForStaffInDateRange(currentUser.StaffId, fromDate, toDate);
        var jobs = await Jobs.Find(filter)
            .SortBy(j => j.ScheduledDate)
            .ThenBy(j => j.RouteOrder)
            .ToListAsync(ct);

        return new StaffScheduleDto(fromDate, toDate, jobs.Select(StaffMappers.ToDto).ToList());
    }

    public async Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default)
    {
        var jobs = await Jobs.Find(StaffJobQueries.ForStaff(currentUser.StaffId)).ToListAsync(ct);
        return jobs.Select(StaffMappers.ToDto).ToList();
    }

    public async Task<StaffJobDto?> GetJobAsync(string id, CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        return job is null ? null : StaffMappers.ToDto(job);
    }

    public async Task<StaffProfileDto?> GetProfileAsync(CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(currentUser.UserId))
            return null;

        var user = await Users.Find(u => u.Id == currentUser.UserId).FirstOrDefaultAsync(ct);
        if (user is null)
        {
            return new StaffProfileDto(
                currentUser.UserId,
                currentUser.Email ?? "",
                currentUser.FirstName ?? "",
                currentUser.LastName ?? "",
                null,
                currentUser.Role ?? "staff",
                currentUser.StaffId);
        }

        return new StaffProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Phone,
            user.Role,
            user.StaffId);
    }

    public async Task<StaffJobDto?> CheckInAsync(string id, CheckInRequest? request = null, CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.CheckIn(job, request);
        if (result is null) return null;
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<StaffJobDto?> AddPhotosAsync(
        string id,
        string type,
        IReadOnlyList<string> photos,
        CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.AddPhotos(job, type, photos);
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<StaffJobDto?> UpdateChecklistAsync(
        string id,
        IReadOnlyList<ChecklistItemDto> checklist,
        CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.UpdateChecklist(job, checklist);
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<StaffJobDto?> UpdateJobAsync(string id, UpdateStaffJobRequest request, CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.UpdateJob(job, request);
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<StaffJobDto?> ReportIssueAsync(
        string id,
        ReportJobIssueRequest request,
        CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.ReportIssue(job, request);
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<StaffJobDto?> CompleteJobAsync(string id, string notes, CancellationToken ct = default)
    {
        var job = await FindForStaffAsync(id, ct);
        if (job is null) return null;
        var result = StaffJobMutations.Complete(job, notes);
        if (result is null) return null;
        await SaveAsync(job, ct);
        return result;
    }

    public async Task<IReadOnlyList<StaffNotificationDto>> GetNotificationsAsync(CancellationToken ct = default)
    {
        var staffId = currentUser.StaffId;
        if (string.IsNullOrWhiteSpace(staffId))
            return [];

        var notifications = await Notifications
            .Find(n => n.RecipientStaffId == staffId)
            .SortByDescending(n => n.CreatedAt)
            .Limit(30)
            .ToListAsync(ct);

        return notifications
            .Select(n => new StaffNotificationDto(n.Id, n.Title, n.Body, n.Type, n.BookingRef, n.Read, n.CreatedAt))
            .ToList();
    }

    public async Task<int> MarkNotificationsReadAsync(CancellationToken ct = default)
    {
        var staffId = currentUser.StaffId;
        if (string.IsNullOrWhiteSpace(staffId))
            return 0;

        var result = await Notifications.UpdateManyAsync(
            n => n.RecipientStaffId == staffId && !n.Read,
            Builders<NotificationDocument>.Update.Set(n => n.Read, true),
            cancellationToken: ct);

        return (int)result.ModifiedCount;
    }

    private async Task<StaffJobDocument?> FindForStaffAsync(string id, CancellationToken ct)
    {
        var filter = Builders<StaffJobDocument>.Filter.And(
            Builders<StaffJobDocument>.Filter.Eq(j => j.Id, id),
            StaffJobQueries.ForStaff(currentUser.StaffId));
        return await Jobs.Find(filter).FirstOrDefaultAsync(ct);
    }

    private async Task<string> GetStaffNameAsync(CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(currentUser.DisplayName) &&
            currentUser.DisplayName != "Solanist User")
            return currentUser.DisplayName;

        if (!string.IsNullOrWhiteSpace(currentUser.UserId))
        {
            var user = await Users.Find(u => u.Id == currentUser.UserId).FirstOrDefaultAsync(ct);
            if (user is not null)
                return $"{user.FirstName} {user.LastName}".Trim();
        }

        return "James Mitchell";
    }

    private async Task SaveAsync(StaffJobDocument job, CancellationToken ct) =>
        await Jobs.ReplaceOneAsync(j => j.Id == job.Id, job, cancellationToken: ct);
}
