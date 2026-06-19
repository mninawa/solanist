using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoAdminService(
    IMongoDatabase db,
    ICurrentUser currentUser,
    IServicePlanCatalog servicePlans,
    IFileStorageService fileStorage,
    IWhatsAppService whatsAppService,
    IOptions<MongoOptions> mongoOptions,
    IOptions<AuthOptions> authOptions,
    IOptions<WebhookOptions> webhookOptions,
    IOptions<S3Options> s3Options,
    IOptions<PaystackOptions> paystackOptions,
    IOptions<EmailOptions> emailOptions,
    IOptions<WhatsAppOptions> whatsAppOptions,
    IHostEnvironment hostEnvironment) : IAdminService
{
    private IMongoCollection<LeadDocument> Leads =>
        db.GetCollection<LeadDocument>(MongoCollections.Leads);

    private IMongoCollection<CustomerDocument> Customers =>
        db.GetCollection<CustomerDocument>(MongoCollections.Customers);

    private IMongoCollection<PropertyDocument> Properties =>
        db.GetCollection<PropertyDocument>(MongoCollections.Properties);

    private IMongoCollection<BookingDocument> Bookings =>
        db.GetCollection<BookingDocument>(MongoCollections.Bookings);

    private IMongoCollection<UserDocument> Users =>
        db.GetCollection<UserDocument>(MongoCollections.Users);

    private IMongoCollection<StaffJobDocument> StaffJobs =>
        db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);

    private IMongoCollection<ReportDocument> Reports =>
        db.GetCollection<ReportDocument>(MongoCollections.Reports);

    private IMongoCollection<SubscriptionDocument> Subscriptions =>
        db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions);

    private IMongoCollection<InviteDocument> Invites =>
        db.GetCollection<InviteDocument>(MongoCollections.Invites);

    private IMongoCollection<PaymentDocument> Payments =>
        db.GetCollection<PaymentDocument>(MongoCollections.Payments);

    private IMongoCollection<NotificationDocument> Notifications =>
        db.GetCollection<NotificationDocument>(MongoCollections.Notifications);

    public async Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var leads = await Leads.Find(FilterDefinition<LeadDocument>.Empty).ToListAsync(ct);
        var (_, todayJobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        var jobDtos = todayJobs.Select(StaffMappers.ToDto).ToList();
        var payments = await Payments.Find(FilterDefinition<PaymentDocument>.Empty).ToListAsync(ct);
        var properties = await Properties.Find(FilterDefinition<PropertyDocument>.Empty).ToListAsync(ct);
        var upcomingBookings = await Bookings
            .Find(b => b.Status == "upcoming")
            .SortBy(b => b.Date)
            .Limit(5)
            .ToListAsync(ct);
        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var customerMap = customers.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}");

        var todayDate = DateOnly.FromDateTime(DateTime.UtcNow);
        var today = todayDate.ToString("yyyy-MM-dd");
        var openLeads = leads.Count(l => l.Status is not ("converted" or "lost"));
        var funnel = BuildFunnel(leads);
        var hotspots = BuildHotspots(leads);
        var stats = AdminDashboardMetrics.BuildStats(
            leads, upcomingBookings, properties, payments, todayDate);
        var (revenuePaid, revenuePending, avgDealSize) =
            AdminDashboardMetrics.RevenueBreakdown(payments);
        var revenueTrend = AdminDashboardMetrics.BuildRevenueTrend(payments, todayDate);
        var barkRequests = AdminDashboardMetrics.BuildBarkRequests(leads);

        return new AdminDashboardDto(
            currentUser.FirstName ?? "Admin",
            stats,
            funnel,
            AdminDashboardMetrics.ConversionRate(leads),
            AdminDashboardMetrics.AvgTimeToWin(leads),
            hotspots,
            BuildUpcomingJobs(upcomingBookings, customerMap),
            barkRequests.Count > 0 ? barkRequests : AdminSeedData.BarkRequests,
            AdminDashboardMetrics.BuildAiSummary(leads, todayJobs.Count, stats.RevenueMtd, openLeads),
            revenuePaid,
            revenuePending,
            avgDealSize,
            openLeads,
            jobDtos,
            revenueTrend);
    }

    public async Task<AdminInboxStatsDto> GetInboxStatsAsync(CancellationToken ct = default)
    {
        var leads = await Leads.Find(FilterDefinition<LeadDocument>.Empty).ToListAsync(ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd");
        var yesterday = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)).ToString("yyyy-MM-dd");
        var seed = AdminSeedData.InboxStats;
        var openLeads = leads.Where(l => l.Status is not ("converted" or "lost")).ToList();
        var topLead = openLeads.OrderByDescending(l => l.LeadScore).FirstOrDefault();
        var upcomingJobs = (int)await Bookings.CountDocumentsAsync(
            b => b.Status == "upcoming",
            cancellationToken: ct);
        var newToday = leads.Count(l => l.CreatedAt.StartsWith(today, StringComparison.Ordinal));
        var newYesterday = leads.Count(l => l.CreatedAt.StartsWith(yesterday, StringComparison.Ordinal));
        var hotspots = AdminInboxInsights.BuildHotspots(leads);

        return seed with
        {
            NewLeadsToday = newToday,
            NewLeadsTrend = AdminDashboardMetrics.FormatCountTrendPublic(newToday, newYesterday, "yesterday"),
            UrgentLeads = leads.Count(l => l.Urgency == "urgent" && l.Status is not ("converted" or "lost")),
            QuotesSent = leads.Count(l => l.Status == "quote_sent"),
            EmailLeadsCaptured = leads.Count,
            InvitesSent = leads.Count(l =>
                l.PipelineStage == "invite_sent"
                || !string.IsNullOrWhiteSpace(l.InviteCode)),
            JobsBooked = upcomingJobs,
            TopLeadScore = topLead?.LeadScore ?? 0,
            TopLeadName = topLead?.CustomerName,
            Hotspots = hotspots.Count > 0 ? hotspots : seed.Hotspots,
            SuggestedSteps = AdminInboxInsights.BuildSuggestedSteps(leads),
            LastSyncAt = AdminInboxInsights.LastBarkSync(leads),
            EmailConnected = true,
        };
    }

    public async Task<IReadOnlyList<AdminLeadDto>> GetLeadsAsync(
        string? status = null,
        string? urgency = null,
        CancellationToken ct = default)
    {
        var filter = BuildLeadFilter(status, urgency);
        var leads = await Leads.Find(filter)
            .SortByDescending(l => l.CreatedAt)
            .ToListAsync(ct);
        return leads.Select(AdminMappers.ToLeadDto).ToList();
    }

    private static FilterDefinition<LeadDocument> BuildLeadFilter(string? status, string? urgency)
    {
        var builder = Builders<LeadDocument>.Filter;
        var filters = new List<FilterDefinition<LeadDocument>>();

        if (!string.IsNullOrWhiteSpace(status))
            filters.Add(builder.Eq(l => l.Status, status.Trim()));

        if (!string.IsNullOrWhiteSpace(urgency))
            filters.Add(builder.Eq(l => l.Urgency, urgency.Trim()));

        return filters.Count == 0 ? builder.Empty : builder.And(filters);
    }

    public async Task<AdminLeadDto?> GetLeadAsync(string id, CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        return lead is null ? null : AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto?> UpdateLeadStatusAsync(string id, string status, CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        if (lead is null) return null;

        LeadMutations.ApplyStatus(lead, status);
        await Leads.ReplaceOneAsync(l => l.Id == id, lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto?> UpdateLeadContactAsync(
        string id,
        UpdateLeadContactRequest request,
        CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        if (lead is null) return null;

        if (string.IsNullOrWhiteSpace(request.CustomerName) ||
            string.IsNullOrWhiteSpace(request.CustomerEmail) ||
            string.IsNullOrWhiteSpace(request.CustomerPhone) ||
            string.IsNullOrWhiteSpace(request.PropertyAddress) ||
            string.IsNullOrWhiteSpace(request.City))
            return null;

        LeadMutations.ApplyContactUpdate(
            lead,
            request.CustomerName,
            request.CustomerEmail,
            request.CustomerPhone,
            request.PropertyAddress,
            request.City,
            request.BestTimeToContact,
            request.PreferredContact);
        await Leads.ReplaceOneAsync(l => l.Id == id, lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto?> AddLeadTagAsync(
        string id,
        AddLeadTagRequest request,
        CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        if (lead is null || string.IsNullOrWhiteSpace(request.Label)) return null;

        LeadMutations.ApplyAddTag(lead, request.Label, NormalizeTagTone(request.Tone));
        await Leads.ReplaceOneAsync(l => l.Id == id, lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto?> AddLeadNoteAsync(
        string id,
        AddLeadNoteRequest request,
        CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        if (lead is null || string.IsNullOrWhiteSpace(request.Note)) return null;

        LeadMutations.ApplyAddNote(lead, request.Note);
        await Leads.ReplaceOneAsync(l => l.Id == id, lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto?> UpdatePipelineStageAsync(string id, string stage, CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == id).FirstOrDefaultAsync(ct);
        if (lead is null) return null;

        LeadMutations.ApplyPipelineStage(lead, stage);
        if (stage == "signed_up")
            lead.Status = "converted";
        await Leads.ReplaceOneAsync(l => l.Id == id, lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<IReadOnlyList<AdminBookingDto>> GetBookingsAsync(CancellationToken ct = default)
    {
        var bookings = await Bookings.Find(FilterDefinition<BookingDocument>.Empty)
            .SortByDescending(b => b.Date)
            .ToListAsync(ct);
        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var customerMap = customers.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}");

        return bookings.Select(b => AdminMappers.ToBookingDto(
            b,
            customerMap.GetValueOrDefault(b.CustomerId, "Customer"))).ToList();
    }

    public async Task<AdminBookingDto?> AssignStaffAsync(
        string bookingId,
        AssignStaffRequest request,
        CancellationToken ct = default)
    {
        var booking = await Bookings.Find(b => b.Id == bookingId).FirstOrDefaultAsync(ct);
        if (booking is null) return null;

        var previousStaffId = booking.StaffId;
        var previousStaffName = booking.StaffName;

        booking.StaffId = request.StaffId;
        booking.StaffName = request.StaffName;
        await Bookings.ReplaceOneAsync(b => b.Id == bookingId, booking, cancellationToken: ct);

        var staffJob = await StaffJobs.Find(j => j.BookingId == bookingId).FirstOrDefaultAsync(ct);
        if (staffJob is not null)
        {
            staffJob.StaffId = request.StaffId;
            await StaffJobs.ReplaceOneAsync(j => j.Id == staffJob.Id, staffJob, cancellationToken: ct);
        }

        var customer = await Customers.Find(c => c.Id == booking.CustomerId).FirstOrDefaultAsync(ct);
        var customerName = customer is null ? "Customer" : $"{customer.FirstName} {customer.LastName}";

        var assignmentChanged = !string.IsNullOrWhiteSpace(request.StaffId) && request.StaffId != previousStaffId;
        if (assignmentChanged)
        {
            var isReassignment = !string.IsNullOrWhiteSpace(previousStaffId);
            await NotifyStaffAssignmentAsync(booking, customerName, previousStaffId, previousStaffName, isReassignment, ct);
        }

        return AdminMappers.ToBookingDto(booking, customerName);
    }

    private async Task NotifyStaffAssignmentAsync(
        BookingDocument booking,
        string customerName,
        string? previousStaffId,
        string? previousStaffName,
        bool isReassignment,
        CancellationToken ct)
    {
        var when = $"{booking.Date} · {booking.TimeSlot}".Trim(' ', '·');
        var location = string.IsNullOrWhiteSpace(booking.PropertyAddress) ? customerName : booking.PropertyAddress;

        // In-app notification to the newly assigned technician.
        await CreateNotificationAsync(new NotificationDocument
        {
            Id = $"ntf-{Guid.NewGuid():N}"[..20],
            RecipientStaffId = booking.StaffId!,
            Title = isReassignment ? "Job reassigned to you" : "New job assigned",
            Body = $"{customerName} — {location} on {when}.",
            Type = "job_assigned",
            BookingId = booking.Id,
            BookingRef = booking.BookingRef,
        }, ct);

        if (!isReassignment)
            return;

        // Reassignment: notify the removed technician in-app...
        if (!string.IsNullOrWhiteSpace(previousStaffId))
        {
            await CreateNotificationAsync(new NotificationDocument
            {
                Id = $"ntf-{Guid.NewGuid():N}"[..20],
                RecipientStaffId = previousStaffId!,
                Title = "Job reassigned",
                Body = $"{customerName} — {location} on {when} has been reassigned to {booking.StaffName}.",
                Type = "job_removed",
                BookingId = booking.Id,
                BookingRef = booking.BookingRef,
            }, ct);
        }

        // ...and send the newly assigned technician an urgent WhatsApp.
        var newStaffUser = await Users
            .Find(u => u.StaffId == booking.StaffId)
            .FirstOrDefaultAsync(ct);

        if (newStaffUser is not null && !string.IsNullOrWhiteSpace(newStaffUser.Phone))
        {
            var firstName = string.IsNullOrWhiteSpace(newStaffUser.FirstName) ? "there" : newStaffUser.FirstName;
            var message =
                $"Hi {firstName}, you've been assigned a solar cleaning job: {customerName} at {location} on {when}. " +
                "Please open the Solanist app to view the details.";
            try
            {
                await whatsAppService.SendTextAsync(newStaffUser.Phone!, message, ct);
            }
            catch
            {
                // WhatsApp delivery is best-effort; the in-app notification still stands.
            }
        }
    }

    private async Task CreateNotificationAsync(NotificationDocument notification, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(notification.RecipientStaffId))
            return;
        notification.CreatedAt = DateTime.UtcNow;
        await Notifications.InsertOneAsync(notification, cancellationToken: ct);
    }

    public async Task<AdminBookingDto?> UpdateBookingStatusAsync(
        string bookingId,
        UpdateBookingStatusRequest request,
        CancellationToken ct = default)
    {
        var booking = await Bookings.Find(b => b.Id == bookingId).FirstOrDefaultAsync(ct);
        if (booking is null) return null;

        booking.Status = request.Status.Trim().ToLowerInvariant();
        await Bookings.ReplaceOneAsync(b => b.Id == bookingId, booking, cancellationToken: ct);

        var customer = await Customers.Find(c => c.Id == booking.CustomerId).FirstOrDefaultAsync(ct);
        var customerName = customer is null ? "Customer" : $"{customer.FirstName} {customer.LastName}";
        return AdminMappers.ToBookingDto(booking, customerName);
    }

    public async Task<StaffJobDto?> UpdateJobStatusAsync(
        string jobId,
        UpdateAdminJobStatusRequest request,
        CancellationToken ct = default)
    {
        var job = await StaffJobs.Find(j => j.Id == jobId).FirstOrDefaultAsync(ct);
        if (job is null) return null;

        StaffJobMutations.ApplyOperationalStatus(job, request.OperationalStatus);
        await StaffJobs.ReplaceOneAsync(j => j.Id == jobId, job, cancellationToken: ct);
        return StaffMappers.ToDto(job);
    }

    public async Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(CancellationToken ct = default)
    {
        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var properties = await Properties.Find(FilterDefinition<PropertyDocument>.Empty).ToListAsync(ct);
        var subscriptions = await Subscriptions.Find(FilterDefinition<SubscriptionDocument>.Empty).ToListAsync(ct);

        return customers.Select(c =>
        {
            var props = properties.Where(p => p.CustomerId == c.Id).ToList();
            var primary = props.FirstOrDefault(p => p.IsPrimary) ?? props.FirstOrDefault();
            var sub = subscriptions.FirstOrDefault(s => s.CustomerId == c.Id);
            var address = primary is null ? "" : $"{primary.Address}, {primary.City}";
            return AdminMappers.ToCustomerDto(c, props.Count, sub?.PlanName ?? primary?.PlanName, address);
        }).ToList();
    }

    public async Task<AdminCustomerDetailDto?> GetCustomerAsync(string id, CancellationToken ct = default)
    {
        var customer = await Customers.Find(c => c.Id == id).FirstOrDefaultAsync(ct);
        if (customer is null) return null;

        var properties = await Properties.Find(p => p.CustomerId == id).ToListAsync(ct);
        var subscription = await Subscriptions.Find(s => s.CustomerId == id).FirstOrDefaultAsync(ct);

        var bookingDocs = await Bookings.Find(b => b.CustomerId == id).ToListAsync(ct);
        var customerName = $"{customer.FirstName} {customer.LastName}";
        var bookings = bookingDocs
            .OrderByDescending(b => b.Date)
            .Select(b => AdminMappers.ToBookingDto(b, customerName))
            .ToList();

        return AdminMappers.ToCustomerDetailDto(customer, properties, subscription, bookings);
    }

    public async Task<IReadOnlyList<AdminStaffMemberDto>> GetStaffAsync(CancellationToken ct = default)
    {
        var staffUsers = await Users.Find(u => u.Role == "staff").ToListAsync(ct);
        var (_, todayJobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        var jobsByStaff = todayJobs.GroupBy(j => j.StaffId).ToDictionary(g => g.Key, g => g.ToList());

        return staffUsers.Select(u =>
        {
            var staffId = u.StaffId ?? u.Id;
            var jobs = jobsByStaff.GetValueOrDefault(staffId, []);
            var completed = jobs.Count(j => j.CompletedAt is not null);
            return AdminMappers.ToStaffDto(u, jobs.Count, completed);
        }).ToList();
    }

    public async Task<AdminStaffMemberDto?> CreateStaffAsync(UpsertStaffRequest request, CancellationToken ct = default)
    {
        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName))
            return null;

        var existing = await Users.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
        if (existing is not null)
            return null;

        var role = NormalizeStaffRole(request.Role);
        var id = $"staff-{Guid.NewGuid():N}"[..16];
        var user = new UserDocument
        {
            Id = id,
            Email = email,
            Role = role,
            StaffId = id,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone?.Trim(),
        };

        await Users.InsertOneAsync(user, cancellationToken: ct);
        return AdminMappers.ToStaffDto(user, 0, 0);
    }

    public async Task<AdminStaffMemberDto?> UpdateStaffAsync(string id, UpsertStaffRequest request, CancellationToken ct = default)
    {
        var user = await Users.Find(u => u.StaffId == id || u.Id == id).FirstOrDefaultAsync(ct);
        if (user is null) return null;

        if (!string.IsNullOrWhiteSpace(request.FirstName)) user.FirstName = request.FirstName.Trim();
        if (!string.IsNullOrWhiteSpace(request.LastName)) user.LastName = request.LastName.Trim();
        if (request.Phone is not null) user.Phone = request.Phone.Trim();

        var email = (request.Email ?? "").Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(email) && email != user.Email)
        {
            var clash = await Users.Find(u => u.Email == email && u.Id != user.Id).FirstOrDefaultAsync(ct);
            if (clash is not null) return null;
            user.Email = email;
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
            user.Role = NormalizeStaffRole(request.Role);

        await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);

        var (_, todayJobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        var staffId = user.StaffId ?? user.Id;
        var jobs = todayJobs.Where(j => j.StaffId == staffId).ToList();
        return AdminMappers.ToStaffDto(user, jobs.Count, jobs.Count(j => j.CompletedAt is not null));
    }

    public async Task<bool> DeleteStaffAsync(string id, CancellationToken ct = default)
    {
        var result = await Users.DeleteOneAsync(u => (u.StaffId == id || u.Id == id) && u.Role != "client", ct);
        return result.DeletedCount > 0;
    }

    private static string NormalizeStaffRole(string? role)
    {
        var r = (role ?? "").Trim().ToLowerInvariant();
        return r == "admin" ? "admin" : "staff";
    }

    public async Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default)
    {
        var (_, jobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        return jobs.Select(StaffMappers.ToDto).ToList();
    }

    public async Task<IReadOnlyList<StaffJobDto>> GetIssuesAsync(CancellationToken ct = default)
    {
        var (_, jobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        return jobs
            .Where(j => j.Issue is not null && j.CompletedAt is null)
            .OrderBy(j => j.RouteOrder)
            .Select(StaffMappers.ToDto)
            .ToList();
    }

    public async Task<AdminReportStatsDto> GetReportStatsAsync(CancellationToken ct = default)
    {
        var reports = await Reports.Find(FilterDefinition<ReportDocument>.Empty).ToListAsync(ct);
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(now.Year, now.Month, 1);

        var withPerformance = reports.Where(r => r.KwhGain is not null).ToList();
        var thisMonth = reports.Count(r =>
            DateOnly.TryParse(r.CompletedAt, out var d) && d >= monthStart);

        double? avgGain = withPerformance.Count > 0
            ? Math.Round(withPerformance.Average(r => r.KwhGain!.Value), 2)
            : null;

        return new AdminReportStatsDto(
            reports.Count,
            thisMonth,
            avgGain,
            withPerformance.Count);
    }

    public async Task<IReadOnlyList<AdminReportListItemDto>> GetAdminReportsAsync(
        string? search = null,
        CancellationToken ct = default)
    {
        var reports = await Reports.Find(FilterDefinition<ReportDocument>.Empty)
            .SortByDescending(r => r.CompletedAt)
            .ToListAsync(ct);

        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var customerMap = customers.ToDictionary(c => c.Id);

        var query = search?.Trim();
        IEnumerable<ReportDocument> filtered = reports;
        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.ToLowerInvariant();
            filtered = reports.Where(r =>
            {
                var customer = customerMap.GetValueOrDefault(r.CustomerId);
                var name = customer is null ? "" : $"{customer.FirstName} {customer.LastName}".ToLowerInvariant();
                return r.PropertyAddress.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || r.StaffName.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || name.Contains(q, StringComparison.OrdinalIgnoreCase)
                    || r.Id.Contains(q, StringComparison.OrdinalIgnoreCase);
            });
        }

        return filtered
            .Select(r => AdminReportMappers.ToListItem(r, customerMap.GetValueOrDefault(r.CustomerId)))
            .ToList();
    }

    public async Task<AdminReportDetailDto?> GetAdminReportAsync(string id, CancellationToken ct = default)
    {
        var report = await Reports.Find(r => r.Id == id).FirstOrDefaultAsync(ct);
        if (report is null) return null;

        var customer = await Customers.Find(c => c.Id == report.CustomerId).FirstOrDefaultAsync(ct);
        return AdminReportMappers.ToDetail(report, customer);
    }

    public async Task<AdminReportsExportDto> GetAdminReportsExportAsync(CancellationToken ct = default)
    {
        var reports = await Reports.Find(FilterDefinition<ReportDocument>.Empty)
            .SortByDescending(r => r.CompletedAt)
            .ToListAsync(ct);
        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var customerMap = customers.ToDictionary(c => c.Id);

        var details = reports
            .Select(r => AdminReportMappers.ToDetail(r, customerMap.GetValueOrDefault(r.CustomerId)))
            .ToList();

        return new AdminReportsExportDto(
            AdminReportMappers.ExportSchemaVersion,
            DateTime.UtcNow.ToString("O"),
            details);
    }

    public async Task<AdminSubscriptionStatsDto> GetSubscriptionStatsAsync(CancellationToken ct = default)
    {
        var properties = await Properties.Find(p => p.SubscriptionStatus == "active").ToListAsync(ct);
        var mrr = properties.Sum(p => (decimal)(p.MonthlyBilling ?? 0));
        var weekEnd = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(7);
        var dueThisWeek = properties.Count(p =>
            DateOnly.TryParse(p.NextCleanDate, out var d) && d <= weekEnd);

        return new AdminSubscriptionStatsDto(
            properties.Count > 0 ? properties.Count : 142,
            "+18% vs last month",
            dueThisWeek > 0 ? dueThisWeek : 23,
            mrr > 0 ? mrr : 128450,
            "+24% vs last month",
            92,
            "+6% vs last month");
    }

    public async Task<IReadOnlyList<AdminSubscriptionRowDto>> GetSubscriptionsAsync(CancellationToken ct = default)
    {
        var properties = await Properties
            .Find(p => p.SubscriptionStatus == "active" || p.SubscriptionStatus == "paused")
            .ToListAsync(ct);
        var customers = await Customers.Find(FilterDefinition<CustomerDocument>.Empty).ToListAsync(ct);
        var customerMap = customers.ToDictionary(c => c.Id, c => $"{c.FirstName} {c.LastName}");

        return properties.Select(p =>
        {
            var name = customerMap.GetValueOrDefault(p.CustomerId, "Customer");
            var paymentStatus = DateOnly.TryParse(p.NextCleanDate, out var d) && d < DateOnly.FromDateTime(DateTime.UtcNow)
                ? "overdue"
                : d <= DateOnly.FromDateTime(DateTime.UtcNow).AddDays(7) ? "due_soon" : "paid";
            return AdminMappers.ToSubscriptionRow(p, name, paymentStatus);
        }).ToList();
    }

    public Task<IReadOnlyList<AdminSubscriptionPlanDto>> GetSubscriptionPlansAsync(CancellationToken ct = default) =>
        servicePlans.GetAdminPlansAsync(ct);

    public Task<AdminSubscriptionPlanDto?> CreateServicePlanAsync(UpsertServicePlanRequest request, CancellationToken ct = default) =>
        servicePlans.CreatePlanAsync(request, ct);

    public Task<AdminSubscriptionPlanDto?> UpdateServicePlanAsync(string id, UpsertServicePlanRequest request, CancellationToken ct = default) =>
        servicePlans.UpdatePlanAsync(id, request, ct);

    public Task<bool> DeactivateServicePlanAsync(string id, CancellationToken ct = default) =>
        servicePlans.DeactivatePlanAsync(id, ct);

    public Task<SyncPaystackPlanResponseDto?> SyncServicePlanPaystackAsync(string id, CancellationToken ct = default) =>
        servicePlans.SyncPaystackPlanAsync(id, ct);

    public async Task<IReadOnlyList<AdminScheduleSlotDto>> GetScheduleSlotsAsync(CancellationToken ct = default)
    {
        var (_, jobs) = await StaffJobQueries.GetAllTodayJobsAsync(StaffJobs, ct);
        if (jobs.Count == 0)
            return AdminSeedData.BuildScheduleFromJobs([]);

        return AdminSeedData.BuildScheduleFromJobs(jobs);
    }

    public async Task<IReadOnlyList<AdminInviteDto>> GetInvitesAsync(CancellationToken ct = default)
    {
        var invites = await db.GetCollection<InviteDocument>(MongoCollections.Invites)
            .Find(FilterDefinition<InviteDocument>.Empty)
            .SortByDescending(i => i.SentAt)
            .ToListAsync(ct);
        return invites.Count > 0
            ? invites.Select(InviteMappers.ToAdminDto).ToList()
            : AdminSeedData.Invites;
    }

    public async Task<SendInviteResponseDto?> SendInviteFromLeadAsync(
        string leadId,
        SendInviteRequest? request = null,
        CancellationToken ct = default)
    {
        var lead = await Leads.Find(l => l.Id == leadId).FirstOrDefaultAsync(ct);
        if (lead is null) return null;

        var sentBy = request?.SentBy ?? currentUser.DisplayName;
        var expiryDays = request?.ExpiryDays is > 0 and <= 90 ? request.ExpiryDays : 14;
        var catalogPlans = await servicePlans.GetActiveCatalogAsync(ct);

        InviteDocument invite;
        if (!string.IsNullOrWhiteSpace(lead.InviteCode))
        {
            var existing = await Invites.Find(i => i.Code == lead.InviteCode.ToUpperInvariant())
                .FirstOrDefaultAsync(ct);
            if (existing is not null)
                invite = existing;
            else
            {
                var code = lead.InviteCode.ToUpperInvariant();
                invite = InviteFactory.BuildFromLead(
                    lead,
                    code,
                    DateTime.UtcNow.AddDays(expiryDays),
                    sentBy,
                    catalogPlans);
                await Invites.InsertOneAsync(invite, cancellationToken: ct);
            }
        }
        else
        {
            var code = await InviteFactory.GenerateUniqueCodeAsync(Invites, ct);
            invite = InviteFactory.BuildFromLead(
                lead,
                code,
                DateTime.UtcNow.AddDays(expiryDays),
                sentBy,
                catalogPlans);
            await Invites.InsertOneAsync(invite, cancellationToken: ct);

            lead.InviteCode = code;
            lead.InviteLink = InviteFactory.BuildInviteLink(code);
        }

        lead.PipelineStage = "invite_sent";
        if (lead.Status is "new" or "contacted" or "interested" or "quote_sent")
            lead.Status = "quote_sent";

        lead.Activities.Insert(0, new LeadActivityDocument
        {
            Id = $"act-invite-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Type = "invite",
            Title = "Invite sent via WhatsApp",
            Description = sentBy,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
        });

        foreach (var item in lead.Checklist.Where(c => c.Label.Contains("Invite", StringComparison.OrdinalIgnoreCase)))
            item.Done = true;

        if (lead.QuoteSummary is not null)
            lead.QuoteSummary.Status = "sent";

        await Leads.ReplaceOneAsync(l => l.Id == leadId, lead, cancellationToken: ct);

        var inviteUrl = $"{authOptions.Value.AppBaseUrl.TrimEnd('/')}{InviteFactory.BuildInviteLink(invite.Code)}";
        var firstName = invite.CustomerName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
            ?? invite.CustomerName;
        var offerName = invite.Plans.FirstOrDefault(p => p.Recommended)?.Name
            ?? invite.Plans.FirstOrDefault()?.Name
            ?? "Quarterly Solar Care";
        try
        {
            await whatsAppService.SendInviteAsync(
                lead.CustomerPhone,
                firstName,
                inviteUrl,
                offerName,
                invite.ExpiresAt,
                ct);
        }
        catch
        {
            // Invite is persisted; WhatsApp delivery is best-effort.
        }

        return new SendInviteResponseDto(
            AdminMappers.ToLeadDto(lead),
            InviteMappers.ToAdminDto(invite));
    }

    public async Task<AdminLeadDto> CreateLeadAsync(CreateLeadRequestDto request, CancellationToken ct = default)
    {
        var lead = LeadFactory.FromRequest(request);
        await Leads.InsertOneAsync(lead, cancellationToken: ct);
        return AdminMappers.ToLeadDto(lead);
    }

    public async Task<AdminLeadDto> SyncBarkLeadAsync(CancellationToken ct = default)
    {
        var barkCount = (int)await Leads.CountDocumentsAsync(
            l => l.Source.Contains("bark"),
            cancellationToken: ct);
        var request = BarkSyncSeed.Next(barkCount);
        return await CreateLeadAsync(request, ct);
    }

    public Task<AdminSearchResultDto> SearchAsync(string query, CancellationToken ct = default) =>
        AdminSearch.SearchLeadsAndCustomersAsync(Leads, Customers, Properties, query, ct);

    private static IReadOnlyList<AdminFunnelStageDto> BuildFunnel(IReadOnlyList<LeadDocument> leads)
    {
        var stages = new (string Label, string Stage)[]
        {
            ("New", "new"),
            ("Contacted", "contacted"),
            ("Interested", "interested"),
            ("Quote Sent", "quote_sent"),
            ("Invite Sent", "invite_sent"),
            ("Signed Up", "signed_up"),
        };

        return stages
            .Select(s => new AdminFunnelStageDto(
                s.Label,
                leads.Count(l => l.PipelineStage == s.Stage),
                s.Stage))
            .ToList();
    }

    private static IReadOnlyList<AdminHotspotDto> BuildHotspots(IReadOnlyList<LeadDocument> leads) =>
        leads.GroupBy(l => l.City)
            .Select(g => new AdminHotspotDto(g.Key, g.Count()))
            .OrderByDescending(h => h.Leads)
            .Take(5)
            .ToList();

    private static IReadOnlyList<AdminUpcomingJobDto> BuildUpcomingJobs(
        IReadOnlyList<BookingDocument> bookings,
        IReadOnlyDictionary<string, string> customerMap)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return bookings.Select(b =>
        {
            var dateLabel = DateOnly.TryParse(b.Date, out var d)
                ? d == today ? "Today" : d == today.AddDays(1) ? "Tomorrow" : d.ToString("MMM d")
                : b.Date;
            var time = b.TimeSlot.Split('–', '-')[0].Trim();
            return new AdminUpcomingJobDto(
                b.Id,
                dateLabel,
                time,
                b.ServiceType,
                customerMap.GetValueOrDefault(b.CustomerId, "Customer"),
                b.PropertyAddress,
                b.Status == "upcoming" ? "scheduled" : b.Status);
        }).ToList();
    }

    public async Task<AdminPortalSettingsDto> GetPortalSettingsAsync(CancellationToken ct = default)
    {
        var leadCount = await Leads.CountDocumentsAsync(FilterDefinition<LeadDocument>.Empty, cancellationToken: ct);
        var customerCount = await Customers.CountDocumentsAsync(FilterDefinition<CustomerDocument>.Empty, cancellationToken: ct);
        var staffCount = await Users.CountDocumentsAsync(u => u.Role == "staff", cancellationToken: ct);
        var activeSubs = await Properties.CountDocumentsAsync(p => p.SubscriptionStatus == "active", cancellationToken: ct);

        var counts = new AdminPortalCountsDto((int)leadCount, (int)customerCount, (int)staffCount, (int)activeSubs);
        var linkedPaystackPlans = await servicePlans.CountPaystackLinkedPlansAsync(ct);
        bool? s3Connected = null;
        if (S3Options.HasAwsCredentials(s3Options.Value))
            s3Connected = await fileStorage.CheckHealthAsync(ct);

        return AdminPortalSettingsBuilder.Build(
            hostEnvironment,
            mongoOptions.Value,
            authOptions.Value,
            webhookOptions.Value,
            s3Options.Value,
            paystackOptions.Value,
            emailOptions.Value,
            whatsAppOptions.Value,
            counts,
            mongoConnected: true,
            paystackLinkedPlanCount: linkedPaystackPlans,
            s3Connected: s3Connected);
    }

    private static string NormalizeTagTone(string? tone)
    {
        var t = (tone ?? "teal").Trim().ToLowerInvariant();
        return t is "teal" or "gold" or "red" or "purple" or "blue" ? t : "teal";
    }
}
