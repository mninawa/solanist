using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Mock;

public sealed class MockAdminService(
    IServicePlanCatalog servicePlans,
    IWhatsAppService whatsAppService,
    IOptions<AuthOptions> authOptions) : IAdminService
{
    private readonly AuthOptions _auth = authOptions.Value;
    private readonly List<LeadDocument> _leads = AdminSeedData.Leads.Select(CloneLead).ToList();

    public Task<AdminDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var openLeads = _leads.Count(l => l.Status is not ("converted" or "lost"));
        return Task.FromResult(new AdminDashboardDto(
            "Sarah",
            new AdminDashboardStatsDto(
                AdminSeedData.InboxStats.NewLeadsToday,
                AdminSeedData.InboxStats.NewLeadsTrend,
                AdminSeedData.InboxStats.QuotesSent,
                AdminSeedData.InboxStats.QuotesTrend,
                AdminSeedData.InboxStats.JobsBooked,
                AdminSeedData.InboxStats.JobsBookedTrend,
                142,
                "+18% vs last month",
                236450,
                "+18% vs last month"),
            AdminSeedData.Funnel,
            7.0,
            12.6,
            AdminSeedData.Hotspots,
            AdminSeedData.UpcomingJobs,
            AdminSeedData.BarkRequests,
            [
                "5 urgent leads need immediate follow-up.",
                "6 jobs scheduled today. Suggested route can save 1h 20m.",
                "You're on track! 78% of monthly revenue target achieved.",
            ],
            182300,
            54150,
            28831,
            openLeads,
            [],
            [
                new AdminRevenueTrendPointDto("Jan", 180000),
                new AdminRevenueTrendPointDto("Feb", 195000),
                new AdminRevenueTrendPointDto("Mar", 210000),
                new AdminRevenueTrendPointDto("Apr", 225000),
                new AdminRevenueTrendPointDto("May", 236450),
                new AdminRevenueTrendPointDto("Jun", 236450),
            ]));
    }

    public Task<AdminInboxStatsDto> GetInboxStatsAsync(CancellationToken ct = default)
    {
        var openLeads = _leads.Where(l => l.Status is not ("converted" or "lost")).ToList();
        var topLead = openLeads.OrderByDescending(l => l.LeadScore).FirstOrDefault();
        var seed = AdminSeedData.InboxStats;
        var hotspots = AdminInboxInsights.BuildHotspots(_leads);

        return Task.FromResult(seed with
        {
            NewLeadsToday = _leads.Count(l => l.CreatedAt.StartsWith(DateTime.UtcNow.ToString("yyyy-MM-dd"), StringComparison.Ordinal)),
            EmailLeadsCaptured = _leads.Count,
            UrgentLeads = openLeads.Count(l => l.Urgency == "urgent"),
            QuotesSent = _leads.Count(l => l.Status == "quote_sent"),
            TopLeadScore = topLead?.LeadScore ?? seed.TopLeadScore,
            TopLeadName = topLead?.CustomerName ?? seed.TopLeadName,
            Hotspots = hotspots.Count > 0 ? hotspots : seed.Hotspots,
            SuggestedSteps = AdminInboxInsights.BuildSuggestedSteps(_leads),
            LastSyncAt = AdminInboxInsights.LastBarkSync(_leads),
            EmailConnected = true,
        });
    }

    public Task<IReadOnlyList<AdminLeadDto>> GetLeadsAsync(
        string? status = null,
        string? urgency = null,
        CancellationToken ct = default)
    {
        IEnumerable<LeadDocument> query = _leads;

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(l => l.Status == status.Trim());

        if (!string.IsNullOrWhiteSpace(urgency))
            query = query.Where(l => l.Urgency == urgency.Trim());

        return Task.FromResult<IReadOnlyList<AdminLeadDto>>(query.Select(AdminMappers.ToLeadDto).ToList());
    }

    public Task<AdminLeadDto?> GetLeadAsync(string id, CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        return Task.FromResult(lead is null ? null : AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto?> UpdateLeadStatusAsync(string id, string status, CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        if (lead is null) return Task.FromResult<AdminLeadDto?>(null);
        LeadMutations.ApplyStatus(lead, status);
        return Task.FromResult<AdminLeadDto?>(AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto?> UpdateLeadContactAsync(
        string id,
        UpdateLeadContactRequest request,
        CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        if (lead is null) return Task.FromResult<AdminLeadDto?>(null);

        if (string.IsNullOrWhiteSpace(request.CustomerName) ||
            string.IsNullOrWhiteSpace(request.CustomerEmail) ||
            string.IsNullOrWhiteSpace(request.CustomerPhone) ||
            string.IsNullOrWhiteSpace(request.PropertyAddress) ||
            string.IsNullOrWhiteSpace(request.City))
            return Task.FromResult<AdminLeadDto?>(null);

        LeadMutations.ApplyContactUpdate(
            lead,
            request.CustomerName,
            request.CustomerEmail,
            request.CustomerPhone,
            request.PropertyAddress,
            request.City,
            request.BestTimeToContact,
            request.PreferredContact);
        return Task.FromResult<AdminLeadDto?>(AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto?> AddLeadTagAsync(
        string id,
        AddLeadTagRequest request,
        CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        if (lead is null || string.IsNullOrWhiteSpace(request.Label))
            return Task.FromResult<AdminLeadDto?>(null);

        LeadMutations.ApplyAddTag(lead, request.Label, NormalizeTagTone(request.Tone));
        return Task.FromResult<AdminLeadDto?>(AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto?> AddLeadNoteAsync(
        string id,
        AddLeadNoteRequest request,
        CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        if (lead is null || string.IsNullOrWhiteSpace(request.Note))
            return Task.FromResult<AdminLeadDto?>(null);

        LeadMutations.ApplyAddNote(lead, request.Note);
        return Task.FromResult<AdminLeadDto?>(AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto?> UpdatePipelineStageAsync(string id, string stage, CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == id);
        if (lead is null) return Task.FromResult<AdminLeadDto?>(null);
        LeadMutations.ApplyPipelineStage(lead, stage);
        if (stage == "signed_up")
            lead.Status = "converted";
        return Task.FromResult<AdminLeadDto?>(AdminMappers.ToLeadDto(lead));
    }

    public Task<IReadOnlyList<AdminBookingDto>> GetBookingsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AdminBookingDto>>([]);

    public Task<AdminBookingDto?> AssignStaffAsync(string bookingId, AssignStaffRequest request, CancellationToken ct = default) =>
        Task.FromResult<AdminBookingDto?>(null);

    public Task<AdminBookingDto?> UpdateBookingStatusAsync(string bookingId, UpdateBookingStatusRequest request, CancellationToken ct = default) =>
        Task.FromResult<AdminBookingDto?>(null);

    public Task<StaffJobDto?> UpdateJobStatusAsync(string jobId, UpdateAdminJobStatusRequest request, CancellationToken ct = default) =>
        Task.FromResult<StaffJobDto?>(null);

    public Task<IReadOnlyList<AdminCustomerDto>> GetCustomersAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AdminCustomerDto>>([]);

    public Task<AdminCustomerDetailDto?> GetCustomerAsync(string id, CancellationToken ct = default) =>
        Task.FromResult<AdminCustomerDetailDto?>(null);

    public Task<IReadOnlyList<AdminStaffMemberDto>> GetStaffAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AdminStaffMemberDto>>([]);

    public Task<AdminStaffMemberDto?> CreateStaffAsync(UpsertStaffRequest request, CancellationToken ct = default)
    {
        var role = (request.Role ?? "").Trim().ToLowerInvariant() == "admin" ? "admin" : "staff";
        var id = $"staff-{Guid.NewGuid():N}"[..16];
        return Task.FromResult<AdminStaffMemberDto?>(new AdminStaffMemberDto(
            id,
            $"{request.FirstName} {request.LastName}".Trim(),
            request.Phone ?? "",
            role == "staff" ? "Field Technician" : "Administrator",
            "off_duty",
            0,
            0,
            (request.Email ?? "").Trim().ToLowerInvariant(),
            role));
    }

    public Task<AdminStaffMemberDto?> UpdateStaffAsync(string id, UpsertStaffRequest request, CancellationToken ct = default)
    {
        var role = (request.Role ?? "").Trim().ToLowerInvariant() == "admin" ? "admin" : "staff";
        return Task.FromResult<AdminStaffMemberDto?>(new AdminStaffMemberDto(
            id,
            $"{request.FirstName} {request.LastName}".Trim(),
            request.Phone ?? "",
            role == "staff" ? "Field Technician" : "Administrator",
            "off_duty",
            0,
            0,
            (request.Email ?? "").Trim().ToLowerInvariant(),
            role));
    }

    public Task<bool> DeleteStaffAsync(string id, CancellationToken ct = default) =>
        Task.FromResult(true);

    public Task<IReadOnlyList<StaffJobDto>> GetJobsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<StaffJobDto>>([]);

    public Task<IReadOnlyList<StaffJobDto>> GetIssuesAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<StaffJobDto>>(
            StaffSeedData.Jobs
                .Where(j => j.Issue is not null && j.CompletedAt is null)
                .Select(StaffMappers.ToDto)
                .ToList());

    public Task<AdminReportStatsDto> GetReportStatsAsync(CancellationToken ct = default)
    {
        var reports = MockData.Reports;
        var withPerformance = reports.Where(r => r.KwhGain is not null).ToList();
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var monthStart = new DateOnly(now.Year, now.Month, 1);
        var thisMonth = reports.Count(r =>
            DateOnly.TryParse(r.CompletedAt, out var d) && d >= monthStart);

        return Task.FromResult(new AdminReportStatsDto(
            reports.Count,
            thisMonth,
            withPerformance.Count > 0 ? Math.Round(withPerformance.Average(r => r.KwhGain!.Value), 2) : null,
            withPerformance.Count));
    }

    public Task<IReadOnlyList<AdminReportListItemDto>> GetAdminReportsAsync(
        string? search = null,
        CancellationToken ct = default)
    {
        var items = MockData.Reports.Select(MockReportListItem).ToList();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            items = items.Where(r =>
                r.CustomerName.ToLowerInvariant().Contains(q)
                || r.PropertyAddress.ToLowerInvariant().Contains(q)
                || r.StaffName.ToLowerInvariant().Contains(q)
                || r.Id.ToLowerInvariant().Contains(q)).ToList();
        }

        return Task.FromResult<IReadOnlyList<AdminReportListItemDto>>(items);
    }

    public Task<AdminReportDetailDto?> GetAdminReportAsync(string id, CancellationToken ct = default)
    {
        var report = MockData.Reports.FirstOrDefault(r => r.Id == id);
        return Task.FromResult(report is null ? null : MockReportDetail(report));
    }

    public Task<AdminReportsExportDto> GetAdminReportsExportAsync(CancellationToken ct = default)
    {
        var details = MockData.Reports.Select(MockReportDetail).ToList();
        return Task.FromResult(new AdminReportsExportDto(
            AdminReportMappers.ExportSchemaVersion,
            DateTime.UtcNow.ToString("O"),
            details));
    }

    private static AdminReportListItemDto MockReportListItem(CleaningReportDto report)
    {
        var (line, city, _) = AdminReportMappers.ParseAddress(report.PropertyAddress);
        return new AdminReportListItemDto(
            report.Id,
            report.CompletedAt,
            "Nicolette Botha",
            "cust-001",
            line,
            city,
            report.PanelCount,
            report.SystemSizeKw,
            report.StaffName,
            AdminReportMappers.ToPerformance(MockReportDoc(report)),
            report.BeforePhotos.Count + report.AfterPhotos.Count,
            !string.IsNullOrWhiteSpace(report.StaffNotes),
            report.Status ?? "completed",
            report.BeforePhotos.FirstOrDefault() ?? report.PropertyImageUrl);
    }

    private static AdminReportDetailDto MockReportDetail(CleaningReportDto report) =>
        AdminReportMappers.ToDetail(MockReportDoc(report), new CustomerDocument
        {
            Id = "cust-001",
            FirstName = "Nicolette",
            LastName = "Botha",
            Email = "nicolette.botha@email.com",
        });

    private static ReportDocument MockReportDoc(CleaningReportDto report) => new()
    {
        Id = report.Id,
        CustomerId = "cust-001",
        PropertyId = report.PropertyId,
        BookingId = report.BookingId,
        CompletedAt = report.CompletedAt,
        ServiceType = report.ServiceType,
        PanelCount = report.PanelCount,
        StaffName = report.StaffName,
        PropertyAddress = report.PropertyAddress,
        PlanName = report.PlanName,
        SystemSizeKw = report.SystemSizeKw,
        RoofType = report.RoofType,
        AccessNotes = report.AccessNotes,
        PropertyImageUrl = report.PropertyImageUrl,
        BeforePhotos = report.BeforePhotos.ToList(),
        AfterPhotos = report.AfterPhotos.ToList(),
        ChecklistSummary = report.ChecklistSummary.ToList(),
        StaffNotes = report.StaffNotes,
        BeforeKwhReading = report.BeforeKwhReading,
        AfterKwhReading = report.AfterKwhReading,
        KwhGain = report.KwhGain,
        Status = report.Status ?? "completed",
    };

    public Task<AdminSubscriptionStatsDto> GetSubscriptionStatsAsync(CancellationToken ct = default) =>
        Task.FromResult(new AdminSubscriptionStatsDto(142, "+18% vs last month", 23, 128450, "+24% vs last month", 92, "+6% vs last month"));

    public Task<IReadOnlyList<AdminSubscriptionRowDto>> GetSubscriptionsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AdminSubscriptionRowDto>>([]);

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

    public Task<IReadOnlyList<AdminScheduleSlotDto>> GetScheduleSlotsAsync(CancellationToken ct = default) =>
        Task.FromResult(AdminSeedData.BuildScheduleFromJobs([]));

    public Task<IReadOnlyList<AdminInviteDto>> GetInvitesAsync(CancellationToken ct = default) =>
        Task.FromResult(AdminSeedData.Invites);

    public async Task<SendInviteResponseDto?> SendInviteFromLeadAsync(
        string leadId,
        SendInviteRequest? request = null,
        CancellationToken ct = default)
    {
        var lead = _leads.FirstOrDefault(l => l.Id == leadId);
        if (lead is null) return null;

        var sentBy = request?.SentBy ?? "Sarah N.";
        var expiryDays = request?.ExpiryDays is > 0 and <= 90 ? request.ExpiryDays : 14;
        if (string.IsNullOrWhiteSpace(lead.InviteCode))
        {
            lead.InviteCode = $"M{Random.Shared.Next(10000, 99999)}";
            lead.InviteLink = InviteFactory.BuildInviteLink(lead.InviteCode);
        }

        lead.PipelineStage = "invite_sent";
        lead.Activities.Insert(0, new LeadActivityDocument
        {
            Id = $"act-invite-{DateTime.UtcNow:yyyyMMddHHmmss}",
            Type = "invite",
            Title = "Invite sent via WhatsApp",
            Description = sentBy,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
        });

        var inviteDto = AdminSeedData.Invites.First();
        var inviteUrl = $"{_auth.AppBaseUrl.TrimEnd('/')}{InviteFactory.BuildInviteLink(lead.InviteCode)}";
        var firstName = lead.CustomerName.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()
            ?? lead.CustomerName;
        await whatsAppService.SendInviteAsync(
            lead.CustomerPhone,
            firstName,
            inviteUrl,
            lead.RecommendedPlan ?? "Quarterly Solar Care",
            DateTime.UtcNow.AddDays(expiryDays),
            ct);

        return new SendInviteResponseDto(
            AdminMappers.ToLeadDto(lead),
            inviteDto with { Code = lead.InviteCode });
    }

    public Task<AdminLeadDto> CreateLeadAsync(CreateLeadRequestDto request, CancellationToken ct = default)
    {
        var lead = LeadFactory.FromRequest(request);
        _leads.Insert(0, lead);
        return Task.FromResult(AdminMappers.ToLeadDto(lead));
    }

    public Task<AdminLeadDto> SyncBarkLeadAsync(CancellationToken ct = default)
    {
        var barkCount = _leads.Count(l => l.Source.Contains("bark", StringComparison.OrdinalIgnoreCase));
        return CreateLeadAsync(BarkSyncSeed.Next(barkCount), ct);
    }

    public Task<AdminSearchResultDto> SearchAsync(string query, CancellationToken ct = default) =>
        Task.FromResult(AdminSearch.SearchMock(_leads, [], query));

    public Task<AdminPortalSettingsDto> GetPortalSettingsAsync(CancellationToken ct = default) =>
        Task.FromResult(new AdminPortalSettingsDto(
            "Development",
            "solanist",
            "http://localhost:8080",
            PasswordResetDemoLinks: true,
            MongoConnected: false,
            Integrations:
            [
                new("mongo", "MongoDB", "demo", "Mock mode — in-memory admin data"),
                new("bark", "Bark webhooks", "demo", "Demo secret — configure Webhooks__BarkSecret for production"),
                new("paystack", "Paystack billing", "not_configured", "Set Paystack__SecretKey and Paystack__PublicKey"),
                new("s3", "Staff photo uploads", "demo", "Bucket solanist — AWS credentials not set (mock uploads)"),
                new("email", "Email (Postmark)", "not_configured", "Set Email__PostmarkServerToken and Email__FromAddress"),
                new("whatsapp", "WhatsApp (WasenderAPI)", "not_configured", "Set WhatsApp__ApiKey for live invite delivery"),
            ],
            Counts: new AdminPortalCountsDto(_leads.Count, 48, 3, 142)));

    private static LeadDocument CloneLead(LeadDocument source) => new()
    {
        Id = source.Id,
        Source = source.Source,
        Status = source.Status,
        PipelineStage = source.PipelineStage,
        CustomerName = source.CustomerName,
        CustomerEmail = source.CustomerEmail,
        CustomerPhone = source.CustomerPhone,
        PropertyAddress = source.PropertyAddress,
        City = source.City,
        Postcode = source.Postcode,
        Province = source.Province,
        PanelCount = source.PanelCount,
        EstimatedPanelsRange = source.EstimatedPanelsRange,
        RoofType = source.RoofType,
        AccessNotes = source.AccessNotes,
        PreferredServiceTime = source.PreferredServiceTime,
        PropertyType = source.PropertyType,
        Notes = source.Notes,
        RequestSnippet = source.RequestSnippet,
        CreatedAt = source.CreatedAt,
        Urgency = source.Urgency,
        LeadScore = source.LeadScore,
        ServiceType = source.ServiceType,
        BestTimeToContact = source.BestTimeToContact,
        PreferredContact = source.PreferredContact,
        QuoteRef = source.QuoteRef,
        InviteCode = source.InviteCode,
        InviteLink = source.InviteLink,
        RecommendedPlan = source.RecommendedPlan,
        ConversationNotes = source.ConversationNotes,
        Tags = source.Tags.Select(t => new LeadTagDocument { Label = t.Label, Tone = t.Tone }).ToList(),
        Activities = source.Activities.Select(a => new LeadActivityDocument
        {
            Id = a.Id,
            Type = a.Type,
            Title = a.Title,
            Description = a.Description,
            Timestamp = a.Timestamp,
        }).ToList(),
        Checklist = source.Checklist.Select(c => new LeadChecklistItemDocument
        {
            Label = c.Label,
            Done = c.Done,
            Date = c.Date,
        }).ToList(),
        NearbyLeads = source.NearbyLeads.Select(n => new LeadNearbyLeadDocument
        {
            Name = n.Name,
            Location = n.Location,
            Score = n.Score,
        }).ToList(),
        QuoteSummary = source.QuoteSummary is null
            ? null
            : new LeadQuoteSummaryDocument
            {
                Ref = source.QuoteSummary.Ref,
                PlanName = source.QuoteSummary.PlanName,
                Price = source.QuoteSummary.Price,
                PriceLabel = source.QuoteSummary.PriceLabel,
                Status = source.QuoteSummary.Status,
                FirstVisit = source.QuoteSummary.FirstVisit,
            },
    };

    private static string NormalizeTagTone(string? tone)
    {
        var t = (tone ?? "teal").Trim().ToLowerInvariant();
        return t is "teal" or "gold" or "red" or "purple" or "blue" ? t : "teal";
    }
}
