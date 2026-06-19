using Solanist.Application.Dtos;
using Solanist.Infrastructure.Mock;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminSeedData
{
    private static readonly AdminNearbyLeadDto[] NearbyLeads =
    [
        new("Sonia", "Sandton", 78),
        new("Ja", "Randburg", 74),
        new("Annalie", "Meyerton", 71),
    ];

    public static IReadOnlyList<LeadDocument> Leads =>
    [
        NicoletteLead(),
        InboxLead("lead-001", "Annalie", "Need solar panel cleaning before winter.", "Meyerton", "Meyerton", "1961", "new", "normal", "2026-06-15T09:42:00", 71),
        InboxLead("lead-002", "Sonia Mokoena", "Panels dusty after construction next door.", "Kempton Park", "Kempton Park", "1619", "contacted", "urgent", "2026-06-15T08:30:00", 78),
        InboxLead("lead-003", "Ja Nel", "Looking for quarterly maintenance plan.", "Fourways", "Fourways", "2055", "interested", "normal", "2026-06-14T16:00:00", 74),
        InboxLead("lead-004", "Thabo Molefe", "Bark lead — wants quote for quarterly clean.", "Bryanston Estate", "Sandton", "2191", "quote_sent", "normal", "2026-06-16T07:30:00", 69),
        InboxLead("lead-005", "Amanda Govender", "Referred by Linda Pretorius. Interested in bi-annual.", "Waterfall Estate", "Midrand", "1686", "contacted", "normal", "2026-06-15T14:20:00", 72),
        InboxLead("lead-006", "Peter van Wyk", "Metal roof — harness required.", "Kyalami Hills", "Kyalami", "1684", "quote_sent", "urgent", "2026-06-14T09:00:00", 76),
        InboxLead("lead-007", "Linda Pretorius", "Annual clean due — prefers mornings.", "Parkhurst", "Parkhurst", "2193", "contacted", "normal", "2026-06-15T11:00:00", 70),
    ];

    public static AdminInboxStatsDto InboxStats => new(
        NewLeadsToday: 4,
        NewLeadsTrend: "+2 vs yesterday",
        EmailLeadsCaptured: 12,
        EmailLeadsTrend: "+18% vs last week",
        UrgentLeads: 3,
        InvitesSent: 8,
        InvitesTrend: "+3 this week",
        QuotesSent: 6,
        QuotesTrend: "+1 vs last week",
        JobsBooked: 6,
        JobsBookedTrend: "+2 vs last week",
        TopLeadScore: 82,
        TopLeadName: "Sonia Mokoena",
        Hotspots:
        [
            new("Kempton Park", 6),
            new("Fourways", 5),
            new("Randburg", 4),
        ],
        SuggestedSteps:
        [
            "Respond to 5 urgent leads",
            "Send platform invites to 8 leads",
            "Create quotes for 2 ready leads",
        ],
        LastSyncAt: "2026-06-16T10:30:00",
        EmailConnected: true);

    public static IReadOnlyList<AdminFunnelStageDto> Funnel =>
    [
        new("New", 18, "new"),
        new("Contacted", 12, "contacted"),
        new("Interested", 8, "interested"),
        new("Quote Sent", 5, "quote_sent"),
        new("Invite Sent", 3, "invite_sent"),
        new("Signed Up", 2, "signed_up"),
    ];

    public static IReadOnlyList<AdminHotspotDto> Hotspots =>
    [
        new("Sandton", 14),
        new("Midrand", 9),
        new("Randburg", 7),
        new("Meyerton", 5),
        new("Kempton Park", 4),
    ];

    public static IReadOnlyList<AdminBarkRequestDto> BarkRequests =>
    [
        new("bark-001", "Sonia Mokoena", "Kempton Park", 45, "urgent", "Awaiting callback"),
        new("bark-002", "Thabo Molefe", "Bryanston", 120, "normal"),
        new("bark-003", "Peter van Wyk", "Kyalami", 180, "urgent", "Quote sent"),
    ];

    public static IReadOnlyList<AdminUpcomingJobDto> UpcomingJobs =>
    [
        new("up-001", "Today", "08:00", "Solar Panel Cleaning", "David Khumalo", "Bryanston", "scheduled"),
        new("up-002", "Today", "10:30", "Solar Panel Cleaning", "Linda Pretorius", "Parkhurst", "scheduled"),
        new("up-003", "Tomorrow", "09:00", "Solar Panel Cleaning", "Nicolette Botha", "Sandton", "pending"),
    ];

    public static IReadOnlyList<AdminSubscriptionPlanDto> SubscriptionPlans =>
    [
        new("plan-basic", "Basic Clean", 349, "per visit", ["Standard clean", "Photo report"], false),
        new("plan-plus", "Quarterly Solar Care", 499, "per visit", ["Priority booking", "Photo report", "WhatsApp reminders"], true),
        new("plan-premium", "Premium Care", 649, "per visit", ["Priority booking", "Photo report", "Performance check", "Support"], false),
    ];

    public static IReadOnlyList<AdminInviteDto> Invites =>
    [
        new(
            "invite-001",
            "N7K2XP",
            "Nicolette Botha",
            "nicolette.botha@email.com",
            "082 345 6789",
            new InviteQuoteDto(499, 12, "Solar Panel Cleaning", "SOL-2026-0052", "Quarterly plan recommended."),
            new PropertyDetailsDto("Hurlingham View", "Sandton", "2196", 12, "Tile Roof", "Side gate access", 5.2, null),
            MockData.Plans,
            new DateTime(2026, 7, 15, 23, 59, 59, DateTimeKind.Utc),
            "pending",
            "2026-06-10T10:00:00",
            "Sarah N."),
        new(
            "invite-002",
            "PK9M4R",
            "Peter van Wyk",
            "peter.vw@email.com",
            "084 333 4455",
            new InviteQuoteDto(849, 14, "Solar Panel Cleaning", "SOL-2026-0048", "Metal roof — harness required."),
            new PropertyDetailsDto("Kyalami Hills", "Kyalami", "1684", 14, "Metal Roof", "Front gate code: 7721", null, null),
            MockData.Plans,
            new DateTime(2026, 7, 1, 23, 59, 59, DateTimeKind.Utc),
            "pending",
            "2026-06-14T15:30:00",
            "Sarah N."),
    ];

    private static LeadDocument NicoletteLead() => new()
    {
        Id = "lead-nicolette",
        Source = "bark_email",
        Status = "new",
        PipelineStage = "invite_sent",
        CustomerName = "Nicolette Botha",
        CustomerEmail = "nicolette.botha@email.com",
        CustomerPhone = "082 345 6789",
        PropertyAddress = "Hurlingham View",
        City = "Sandton",
        Postcode = "2196",
        Province = "Gauteng",
        PanelCount = 12,
        EstimatedPanelsRange = "10–12",
        RoofType = "Tile",
        AccessNotes = "Easy – Side Access",
        PreferredServiceTime = "Weekends",
        PropertyType = "Residential",
        Notes = "Looking for cleaning & maintenance plan. Customer mentioned performance drop on inverter readings.",
        RequestSnippet = "Hi, I need my solar panels cleaned — output has dropped noticeably.",
        CreatedAt = "2026-06-15T08:47:00",
        Urgency = "urgent",
        LeadScore = 82,
        ServiceType = "Solar Panel Cleaning",
        BestTimeToContact = "Weekdays after 4pm",
        PreferredContact = "WhatsApp",
        QuoteRef = "SOL-2026-0052",
        InviteCode = MockData.InviteCode,
        InviteLink = $"https://solanist.co.za/invite/{MockData.InviteCode}",
        RecommendedPlan = "Quarterly Solar Care",
        ConversationNotes =
            "Call Summary (Jun 15): Customer wants quarterly maintenance. Confirmed side gate access. Prefers weekend visits.",
        Tags =
        [
            new LeadTagDocument { Label = "Residential", Tone = "teal" },
            new LeadTagDocument { Label = "Solar Cleaning", Tone = "gold" },
            new LeadTagDocument { Label = "High Intent", Tone = "red" },
        ],
        Activities =
        [
            new LeadActivityDocument { Id = "act-1", Type = "invite", Title = "Invite sent via WhatsApp", Timestamp = "2026-06-15T14:20:00" },
            new LeadActivityDocument { Id = "act-2", Type = "call", Title = "Outbound call", Description = "6m 32s — discussed quarterly plan", Timestamp = "2026-06-15T11:15:00" },
            new LeadActivityDocument { Id = "act-3", Type = "created", Title = "Lead captured from email", Description = "Bark Email", Timestamp = "2026-06-15T08:47:00" },
        ],
        Checklist =
        [
            new LeadChecklistItemDocument { Label = "Invite Sent", Done = true, Date = "Jun 15" },
            new LeadChecklistItemDocument { Label = "Awaiting Signup", Done = false },
            new LeadChecklistItemDocument { Label = "Follow-up Reminder", Done = false, Date = "Jun 17" },
        ],
        NearbyLeads = NearbyLeads.Select(n => new LeadNearbyLeadDocument { Name = n.Name, Location = n.Location, Score = n.Score }).ToList(),
        QuoteSummary = new LeadQuoteSummaryDocument
        {
            Ref = "SOL-2026-0052",
            PlanName = "Quarterly Solar Care",
            Price = 399,
            PriceLabel = "R399 / month",
            Status = "sent",
            FirstVisit = "Within 7 days",
        },
    };

    private static LeadDocument InboxLead(
        string id,
        string name,
        string snippet,
        string location,
        string city,
        string postcode,
        string status,
        string urgency,
        string createdAt,
        int score)
    {
        var firstName = name.Split(' ')[0].ToLowerInvariant();
        var pipelineStage = status switch
        {
            "new" => "new",
            "contacted" => "contacted",
            "interested" => "interested",
            "quote_sent" => "quote_sent",
            _ => "new",
        };

        return new LeadDocument
        {
            Id = id,
            Source = "bark_email",
            Status = status,
            PipelineStage = pipelineStage,
            CustomerName = name,
            CustomerEmail = $"{firstName}@email.com",
            CustomerPhone = "082 000 0000",
            PropertyAddress = location,
            City = city,
            Postcode = postcode,
            Province = "Gauteng",
            PanelCount = 16,
            EstimatedPanelsRange = "16–20",
            RoofType = "Tile",
            Notes = snippet,
            RequestSnippet = snippet,
            CreatedAt = createdAt,
            Urgency = urgency,
            LeadScore = score,
            ServiceType = "Solar Panel Cleaning",
            Tags = [new LeadTagDocument { Label = "Residential", Tone = "teal" }],
            Activities =
            [
                new LeadActivityDocument
                {
                    Id = $"{id}-act",
                    Type = "created",
                    Title = "New lead created",
                    Description = "Bark Email",
                    Timestamp = createdAt,
                },
            ],
            Checklist = [],
            NearbyLeads = NearbyLeads.Select(n => new LeadNearbyLeadDocument { Name = n.Name, Location = n.Location, Score = n.Score }).ToList(),
        };
    }

    public static IReadOnlyList<AdminScheduleSlotDto> BuildScheduleFromJobs(IReadOnlyList<StaffJobDocument> jobs)
    {
        if (jobs.Count == 0)
        {
            return
            [
                new("Sandton", [
                    new("08:00", "JM", "completed"),
                    new("10:30", "SN", "scheduled"),
                    new("14:00", "JM", "pending"),
                ]),
                new("Midrand", [
                    new("09:00", "LK", "scheduled"),
                ]),
            ];
        }

        return jobs
            .GroupBy(j => j.City)
            .Select(g => new AdminScheduleSlotDto(
                g.Key,
                g.OrderBy(j => j.RouteOrder)
                    .Select(j => new AdminScheduleSlotEntryDto(
                        j.ScheduledTime.Split('–', '-')[0].Trim(),
                        Initials(j.CustomerName),
                        j.CompletedAt is not null
                            ? "completed"
                            : j.CheckedInAt is not null ? "scheduled" : "pending"))
                    .ToList()))
            .ToList();
    }

    private static string Initials(string name)
    {
        var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return string.Concat(parts.Take(2).Select(p => char.ToUpperInvariant(p[0])));
    }
}
