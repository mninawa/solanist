using MongoDB.Driver;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class StaffJobQueries
{
    internal const string DefaultStaffId = "staff-001";

    public static FilterDefinition<StaffJobDocument> ForStaff(string? staffId)
    {
        if (string.IsNullOrWhiteSpace(staffId))
            return FilterDefinition<StaffJobDocument>.Empty;

        return Builders<StaffJobDocument>.Filter.Eq(j => j.StaffId, staffId);
    }

    public static async Task<(string Date, List<StaffJobDocument> Jobs)> GetDashboardJobsAsync(
        IMongoCollection<StaffJobDocument> collection,
        string? staffId,
        CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var jobs = await FindByDateAsync(collection, staffId, today, ct);
        if (jobs.Count > 0)
            return (today, jobs);

        jobs = await FindByDateAsync(collection, staffId, StaffSeedData.DemoToday, ct);
        if (jobs.Count > 0)
            return (StaffSeedData.DemoToday, jobs);

        return (today, jobs);
    }

    private static async Task<List<StaffJobDocument>> FindByDateAsync(
        IMongoCollection<StaffJobDocument> collection,
        string? staffId,
        string date,
        CancellationToken ct)
    {
        var filter = Builders<StaffJobDocument>.Filter.And(
            ForStaff(staffId),
            Builders<StaffJobDocument>.Filter.Eq(j => j.ScheduledDate, date));

        return await collection.Find(filter).SortBy(j => j.RouteOrder).ToListAsync(ct);
    }

    public static FilterDefinition<StaffJobDocument> ForStaffInDateRange(
        string? staffId,
        string from,
        string to) =>
        Builders<StaffJobDocument>.Filter.And(
            ForStaff(staffId),
            Builders<StaffJobDocument>.Filter.Gte(j => j.ScheduledDate, from),
            Builders<StaffJobDocument>.Filter.Lte(j => j.ScheduledDate, to));

    public static (string From, string To) ResolveScheduleRange(string? from, string? to)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var fromDate = DateOnly.TryParse(from, out var parsedFrom) ? parsedFrom : today;
        var toDate = DateOnly.TryParse(to, out var parsedTo) ? parsedTo : today.AddDays(13);
        if (toDate < fromDate)
            toDate = fromDate.AddDays(13);
        return (fromDate.ToString("yyyy-MM-dd"), toDate.ToString("yyyy-MM-dd"));
    }

    public static async Task<(string Date, List<StaffJobDocument> Jobs)> GetAllTodayJobsAsync(
        IMongoCollection<StaffJobDocument> collection,
        CancellationToken ct)
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var filter = Builders<StaffJobDocument>.Filter.Eq(j => j.ScheduledDate, today);
        var jobs = await collection.Find(filter).SortBy(j => j.RouteOrder).ToListAsync(ct);
        if (jobs.Count > 0)
            return (today, jobs);

        filter = Builders<StaffJobDocument>.Filter.Eq(j => j.ScheduledDate, StaffSeedData.DemoToday);
        jobs = await collection.Find(filter).SortBy(j => j.RouteOrder).ToListAsync(ct);
        return (jobs.Count > 0 ? StaffSeedData.DemoToday : today, jobs);
    }
}
