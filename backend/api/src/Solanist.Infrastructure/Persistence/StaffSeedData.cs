using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class StaffSeedData
{
    internal const string DemoToday = "2026-06-16";

    private static readonly string[] BeforeImgs = [
        "https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop",
    ];

    private static readonly string[] AfterImgs = [
        "https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1558449455-0aa211637b00?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop",
    ];

    public static IReadOnlyList<StaffJobDocument> Jobs
    {
        get
        {
            var completedChecklist = DefaultChecklist().Select(c => new StaffChecklistItemDocument
            {
                Id = c.Id,
                Label = c.Label,
                Completed = true,
                Required = c.Required,
            }).ToList();

            var completedSlots = BeforeSlots().Concat(AfterSlots()).Select((s, i) => new StaffPhotoSlotDocument
            {
                Id = s.Id,
                Label = s.Label,
                Type = s.Type,
                Required = s.Required,
                PhotoUrl = i < 3 ? BeforeImgs[i % 3] : i < 6 ? AfterImgs[i - 3] : null,
            }).ToList();

            return [
                new StaffJobDocument
                {
                    Id = "job-001",
                    StaffId = StaffJobQueries.DefaultStaffId,
                    BookingId = "booking-linda-001",
                    PropertyId = "prop-linda-001",
                    CustomerId = "cust-003",
                    CustomerName = "Linda Pretorius",
                    CustomerPhone = "082 456 7890",
                    CustomerEmail = "linda.pretorius@email.com",
                    Address = "Parkhurst Villa",
                    City = "Parkhurst",
                    Postcode = "2193",
                    ServiceType = "Solar Panel Cleaning",
                    PlanType = "Quarterly Solar Care",
                    ScheduledTime = "08:00 AM – 10:00 AM",
                    ScheduledDate = DemoToday,
                    Status = "completed",
                    RouteOrder = 1,
                    PanelCount = 10,
                    SystemSizeKw = 4.2,
                    RoofType = "Tile Roof",
                    AccessShort = "Front gate",
                    AccessNotes = "Front gate code: 8821",
                    HeroImageUrl =
                        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop",
                    Instructions = "Ring bell on arrival.",
                    Checklist = completedChecklist,
                    PhotoSlots = completedSlots,
                    BeforePhotos = BeforeImgs.ToList(),
                    AfterPhotos = AfterImgs.ToList(),
                    BeforeKwhReading = 12450.2,
                    AfterKwhReading = 12452.8,
                    CheckedInAt = "2026-06-16T08:05:00",
                    CheckInLatitude = -26.12,
                    CheckInLongitude = 28.04,
                    CompletedAt = "2026-06-16T09:45:00",
                    CompletionNotes = "Routine quarterly clean. Panels in good condition.",
                    OnTheWay = true,
                    Arrived = true,
                },
                BuildOpenJob(
                    "job-002",
                    "booking-001",
                    "prop-001",
                    "cust-001",
                    "Nicolette Botha",
                    "082 123 4567",
                    "nicolette.botha@email.com",
                    "Hurlingham View",
                    "Sandton",
                    "2196",
                    12,
                    5.2,
                    "Tile Roof",
                    "Side gate",
                    "Side gate access — please use side entrance.",
                    MongoSeedData.PropertyImageUrl,
                    "Please use side gate. Dog in yard.",
                    "Quarterly Solar Care",
                    2,
                    "10:00 AM – 12:00 PM"),
                BuildOpenJob(
                    "job-003",
                    "booking-david-001",
                    "prop-david-001",
                    "cust-002",
                    "David Khumalo",
                    "083 234 5678",
                    "david.khumalo@email.com",
                    "Ridge Estate",
                    "Johannesburg",
                    "2196",
                    16,
                    6.9,
                    "Tile Roof",
                    "Front gate",
                    "Front gate — call on arrival.",
                    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=500&fit=crop",
                    "Front gate code: 4521. Metal roof — use harness.",
                    "Quarterly Solar Care",
                    3,
                    "12:30 PM – 02:30 PM",
                    new StaffJobIssueDocument
                    {
                        IssueType = "no_access",
                        Description = "Gate code not working — customer unreachable.",
                        ReportedAt = "2026-06-16T12:05:00",
                    }),
                BuildOpenJob(
                    "job-004",
                    "booking-farm-001",
                    "prop-003",
                    "cust-001",
                    "Sarah van der Merwe",
                    "084 345 6789",
                    "sarah.vdm@email.com",
                    "Sunrise Farm",
                    "Midrand",
                    "1685",
                    20,
                    8.6,
                    "Metal Roof",
                    "Call on arrival",
                    "Gravel driveway — call on arrival.",
                    "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop",
                    "Call on arrival — gravel driveway.",
                    "Bi-Annual Care",
                    4,
                    "03:00 PM – 05:00 PM"),
            ];
        }
    }

    private static StaffJobDocument BuildOpenJob(
        string id,
        string bookingId,
        string propertyId,
        string customerId,
        string customerName,
        string phone,
        string email,
        string address,
        string city,
        string postcode,
        int panelCount,
        double systemSizeKw,
        string roofType,
        string accessShort,
        string accessNotes,
        string heroImageUrl,
        string instructions,
        string planType,
        int routeOrder,
        string scheduledTime,
        StaffJobIssueDocument? issue = null) => new()
    {
        Id = id,
        StaffId = id == "job-003" ? "staff-002" : StaffJobQueries.DefaultStaffId,
        BookingId = bookingId,
        PropertyId = propertyId,
        CustomerId = customerId,
        CustomerName = customerName,
        CustomerPhone = phone,
        CustomerEmail = email,
        Address = address,
        City = city,
        Postcode = postcode,
        ServiceType = "Solar Panel Cleaning",
        PlanType = planType,
        ScheduledTime = scheduledTime,
        ScheduledDate = DemoToday,
        Status = "scheduled",
        RouteOrder = routeOrder,
        PanelCount = panelCount,
        SystemSizeKw = systemSizeKw,
        RoofType = roofType,
        AccessShort = accessShort,
        AccessNotes = accessNotes,
        HeroImageUrl = heroImageUrl,
        Instructions = instructions,
        Checklist = DefaultChecklist(),
        PhotoSlots = BeforeSlots().Concat(AfterSlots()).ToList(),
        Issue = issue,
        OnTheWay = issue is not null,
        Arrived = issue is not null,
        CheckedInAt = issue is not null ? "2026-06-16T12:00:00" : null,
    };

    private static List<StaffChecklistItemDocument> DefaultChecklist() => [
        new() { Id = "c1", Label = "Roof access confirmed", Completed = false, Required = true },
        new() { Id = "c2", Label = "Safety check completed", Completed = false, Required = true },
        new() { Id = "c3", Label = "Panels inspected", Completed = false, Required = true },
        new() { Id = "c4", Label = "Loose debris removed", Completed = false, Required = true },
        new() { Id = "c5", Label = "Dust and grime cleaned", Completed = false, Required = true },
        new() { Id = "c6", Label = "Bird droppings removed", Completed = false, Required = true },
        new() { Id = "c7", Label = "Frame edges cleaned", Completed = false, Required = true },
        new() { Id = "c8", Label = "Water runoff checked", Completed = false, Required = true },
        new() { Id = "c9", Label = "Visual damage check completed", Completed = false, Required = true },
        new() { Id = "c10", Label = "Work area left clean", Completed = false, Required = true },
    ];

    private static List<StaffPhotoSlotDocument> BeforeSlots() => [
        new() { Id = "bf1", Label = "Full panel array", Type = "before", Required = true },
        new() { Id = "bf2", Label = "Close-up of panels (condition)", Type = "before", Required = true },
        new() { Id = "bf3", Label = "Access/roof area", Type = "before", Required = true },
        new() { Id = "bf4", Label = "Any visible issues (if any)", Type = "before", Required = true },
    ];

    private static List<StaffPhotoSlotDocument> AfterSlots() => [
        new() { Id = "af1", Label = "Full clean panel array", Type = "after", Required = true },
        new() { Id = "af2", Label = "Close-up clean panel", Type = "after", Required = true },
        new() { Id = "af3", Label = "Final work area", Type = "after", Required = true },
    ];

    internal const string DemoFieldJobId = "job-004";

    internal static void ResetWorkflowState(StaffJobDocument job, string scheduledDate)
    {
        job.ScheduledDate = scheduledDate;
        job.Status = "scheduled";
        job.CompletedAt = null;
        job.CompletionNotes = null;
        job.CheckedInAt = null;
        job.CheckInNote = null;
        job.CheckInLatitude = null;
        job.CheckInLongitude = null;
        job.BeforePhotos = [];
        job.AfterPhotos = [];
        job.BeforeKwhReading = null;
        job.AfterKwhReading = null;
        job.OnTheWay = false;
        job.Arrived = false;
        job.Issue = null;
        job.Checklist = DefaultChecklist();
        job.PhotoSlots = BeforeSlots()
            .Concat(AfterSlots())
            .Select(s => new StaffPhotoSlotDocument
            {
                Id = s.Id,
                Label = s.Label,
                Type = s.Type,
                Required = s.Required,
                PhotoUrl = null,
            })
            .ToList();
    }
}
