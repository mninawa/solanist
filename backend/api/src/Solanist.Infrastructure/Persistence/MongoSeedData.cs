using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class MongoSeedData
{
    public const string CustomerId = "cust-001";
    internal const string PropertyImageUrl =
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop";
    private const string ImageUrl = PropertyImageUrl;

    public static CustomerDocument Customer => new()
    {
        Id = CustomerId,
        Email = "nicolette.botha@email.com",
        FirstName = "Nicolette",
        LastName = "Botha",
        Phone = "082 123 4567",
        PreferredContact = "whatsapp",
        EmailReminders = true,
        WhatsAppReminders = true,
        BillingMode = "combined",
        ReportsPublished = true,
        Greeting = "Good morning",
        SystemStatus = "Your system is in great shape",
        ValueProps = [
            "Maximize energy output",
            "Protect your investment",
            "Longer panel lifespan",
            "Peace of mind",
        ],
    };

    public static IReadOnlyList<PropertyDocument> Properties => [
        new()
        {
            Id = "prop-001",
            CustomerId = CustomerId,
            Address = "Hurlingham View",
            City = "Sandton",
            Postcode = "2196",
            PanelCount = 12,
            RoofType = "Tile Roof",
            AccessNotes = "Side gate access — please use side entrance.",
            SystemSizeKw = 5.2,
            ImageUrl = ImageUrl,
            IsPrimary = true,
            SubscriptionStatus = "active",
            PlanName = "Quarterly Solar Care",
            PlanVariant = "purple",
            PlanFrequency = "Every 3 months",
            NextCleanDate = "2026-06-22",
            NextCleanTimeSlot = "10:00 AM – 02:00 PM",
            PricePerClean = 499,
            VisitsPerYear = 4,
            VisitsRemaining = 3,
            MonthlyBilling = 166,
        },
        new()
        {
            Id = "prop-002",
            CustomerId = CustomerId,
            Address = "Ridge Estate",
            City = "Johannesburg",
            Postcode = "2196",
            PanelCount = 16,
            RoofType = "Tile Roof",
            AccessNotes = "Front gate — call on arrival.",
            SystemSizeKw = 6.9,
            ImageUrl = "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=500&fit=crop",
            IsPrimary = false,
            SubscriptionStatus = "active",
            PlanName = "Quarterly Solar Care",
            PlanVariant = "blue",
            PlanFrequency = "Every 3 months",
            NextCleanDate = "2026-08-15",
            NextCleanTimeSlot = "08:00 AM – 12:00 PM",
            PricePerClean = 499,
            VisitsPerYear = 4,
            VisitsRemaining = 2,
            MonthlyBilling = 166,
        },
        new()
        {
            Id = "prop-003",
            CustomerId = CustomerId,
            Address = "Farmstead Lane",
            City = "Meyerton",
            Postcode = "1961",
            PanelCount = 24,
            RoofType = "Metal Roof",
            AccessNotes = "Farm road — 4x4 recommended in wet weather.",
            SystemSizeKw = 10.4,
            ImageUrl = "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop",
            IsPrimary = false,
            SubscriptionStatus = "setup_required",
            MonthlyBilling = 0,
        },
    ];

    public static SubscriptionDocument Subscription => new()
    {
        Id = "sub-001",
        CustomerId = CustomerId,
        PlanName = "Quarterly Solar Care",
        PlanDescription = "Clean every 3 months — our best value plan.",
        Status = "active",
        PricePerVisit = 499,
        AnnualPrice = 1996,
        BillingCycle = "Quarterly",
        NextBillingDate = "2026-06-15",
        NextCleanDate = "2026-06-22",
        VisitsRemaining = 3,
        PaymentMethod = "Mastercard •••• 4312",
        Features = ["Priority booking", "Photo report", "WhatsApp reminders", "Support"],
    };

    public static IReadOnlyList<PaymentDocument> Payments => [
        new() { Id = "pay-001", CustomerId = CustomerId, Date = "2026-03-15", Description = "Quarterly Solar Care", Amount = 499, Status = "paid" },
        new() { Id = "pay-002", CustomerId = CustomerId, Date = "2025-12-15", Description = "Quarterly Solar Care", Amount = 499, Status = "paid" },
        new() { Id = "pay-003", CustomerId = CustomerId, Date = "2025-09-15", Description = "Quarterly Solar Care", Amount = 499, Status = "paid" },
        new() { Id = "pay-004", CustomerId = CustomerId, Date = "2026-02-10", Description = "Ridge Estate — Bi-Annual Care", Amount = 399, Status = "paid" },
        new() { Id = "pay-005", CustomerId = CustomerId, Date = "2026-01-05", Description = "Quarterly Solar Care", Amount = 499, Status = "paid" },
    ];

    public static IReadOnlyList<BookingDocument> Bookings => [
        new()
        {
            Id = "booking-001", CustomerId = CustomerId, BookingRef = "BKG-2026-0622-0017",
            PropertyId = "prop-001", Date = "2026-06-22", TimeSlot = "10:00 AM – 02:00 PM",
            Status = "upcoming", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", StaffId = "staff-001", StaffName = "James M.", ConfirmationStatus = "confirmed",
            BookedOn = "2026-05-28", ServiceDuration = "~4 hours", PanelCount = 12, SystemSizeKw = 5.2,
            RoofType = "Tile Roof", AccessNotes = "Side access",
            SpecialInstructions = "Please ensure side gate is unlocked.",
            BillingNote = "subscription", IsNextBooking = true,
        },
        new()
        {
            Id = "booking-002", CustomerId = CustomerId, BookingRef = "BKG-2026-0922-0024",
            PropertyId = "prop-001", Date = "2026-09-22", TimeSlot = "08:00 AM – 12:00 PM",
            Status = "upcoming", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", ConfirmationStatus = "scheduled",
            BookedOn = "2026-06-01", ServiceDuration = "~4 hours", PanelCount = 12, SystemSizeKw = 5.2,
            RoofType = "Tile Roof", BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-003", CustomerId = CustomerId, BookingRef = "BKG-2026-0815-0031",
            PropertyId = "prop-002", Date = "2026-08-15", TimeSlot = "08:00 AM – 12:00 PM",
            Status = "upcoming", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Ridge Estate, Johannesburg", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", StaffId = "staff-002", StaffName = "Sipho N.", ConfirmationStatus = "confirmed",
            BookedOn = "2026-05-15", ServiceDuration = "~3 hours", PanelCount = 16, SystemSizeKw = 6.9,
            RoofType = "Tile Roof", BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-004", CustomerId = CustomerId, BookingRef = "BKG-2026-0322-0012",
            PropertyId = "prop-001", Date = "2026-03-22", TimeSlot = "10:00 AM – 02:00 PM",
            Status = "completed", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", StaffId = "staff-001", StaffName = "James M.", ConfirmationStatus = "confirmed",
            BookedOn = "2026-02-01", ServiceDuration = "~4 hours", PanelCount = 12, SystemSizeKw = 5.2,
            BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-005", CustomerId = CustomerId, BookingRef = "BKG-2026-0210-0008",
            PropertyId = "prop-002", Date = "2026-02-10", TimeSlot = "09:00 AM – 01:00 PM",
            Status = "completed", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Ridge Estate, Johannesburg", PropertyPostcode = "2196",
            PlanName = "Bi-Annual Care", StaffName = "Sipho N.", ConfirmationStatus = "confirmed",
            BookedOn = "2026-01-05", ServiceDuration = "~3 hours", PanelCount = 16, SystemSizeKw = 6.9,
            BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-006", CustomerId = CustomerId, BookingRef = "BKG-2025-1215-0005",
            PropertyId = "prop-001", Date = "2025-12-15", TimeSlot = "12:00 PM – 04:00 PM",
            Status = "completed", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", StaffName = "Sipho N.", ConfirmationStatus = "confirmed",
            BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-007", CustomerId = CustomerId, BookingRef = "BKG-2025-0915-0002",
            PropertyId = "prop-001", Date = "2025-09-15", TimeSlot = "08:00 AM – 12:00 PM",
            Status = "completed", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", StaffName = "Sipho N.", ConfirmationStatus = "confirmed",
            BillingNote = "subscription",
        },
        new()
        {
            Id = "booking-008", CustomerId = CustomerId, BookingRef = "BKG-2025-0620-0001",
            PropertyId = "prop-001", Date = "2025-06-20", TimeSlot = "10:00 AM – 02:00 PM",
            Status = "cancelled", ServiceType = "Solar Panel Cleaning",
            PropertyAddress = "Hurlingham View, Sandton", PropertyPostcode = "2196",
            PlanName = "Quarterly Solar Care", ConfirmationStatus = "confirmed",
            BillingNote = "subscription",
        },
    ];

    public static IReadOnlyList<ReportDocument> Reports => [
        new()
        {
            Id = "report-001",
            CustomerId = CustomerId,
            PropertyId = "prop-001",
            BookingId = "booking-004",
            CompletedAt = "2026-03-22",
            ServiceType = "Solar Panel Cleaning Report",
            PanelCount = 12,
            StaffName = "James M.",
            PropertyAddress = "Hurlingham View, Sandton, 2196",
            PlanName = "Quarterly Solar Care",
            SystemSizeKw = 5.2,
            RoofType = "Tile Roof",
            AccessNotes = "Side gate access",
            PropertyImageUrl = ImageUrl,
            BeforePhotos = [
                "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop",
                "https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=800&h=520&fit=crop",
                "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=520&fit=crop",
            ],
            AfterPhotos = [
                "https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=800&h=520&fit=crop",
                "https://images.unsplash.com/photo-1558449455-0aa211637b00?w=800&h=520&fit=crop",
                "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop",
            ],
            ChecklistSummary = [
                "Panels inspected for damage",
                "Debris removed",
                "Full rinse completed",
            ],
            StaffNotes =
                "Panels had moderate dust build-up. No visible cracks. Recommended next clean: 3 months.",
            BeforeKwhReading = 11842.5,
            AfterKwhReading = 12105.2,
            KwhGain = 262.7,
            Status = "completed",
        },
    ];

    public static IReadOnlyList<UserDocument> Users => [
        new()
        {
            Id = "user-001",
            Email = "nicolette.botha@email.com",
            Password = null,
            Role = "client",
            CustomerId = CustomerId,
            FirstName = "Nicolette",
            LastName = "Botha",
            Phone = "082 123 4567",
        },
        new()
        {
            Id = "user-staff-001",
            Email = "james.staff@solanist.co.za",
            Password = null,
            Role = "staff",
            StaffId = "staff-001",
            FirstName = "James",
            LastName = "Mitchell",
            Phone = "082 987 6543",
        },
        new()
        {
            Id = "user-staff-002",
            Email = "sipho.staff@solanist.co.za",
            Password = null,
            Role = "staff",
            StaffId = "staff-002",
            FirstName = "Sipho",
            LastName = "Ndlovu",
            Phone = "082 555 6677",
        },
        new()
        {
            Id = "user-staff-003",
            Email = "lerato.staff@solanist.co.za",
            Password = null,
            Role = "staff",
            StaffId = "staff-003",
            FirstName = "Lerato",
            LastName = "Khumalo",
            Phone = "083 666 7788",
        },
        new()
        {
            Id = "user-admin-001",
            Email = "admin@solanist.co.za",
            Password = null,
            Role = "admin",
            FirstName = "Sarah",
            LastName = "Nkosi",
        },
        new()
        {
            Id = "user-super-admin-001",
            Email = "mninawa@gmail.com",
            Password = null,
            Role = "admin",
            FirstName = "Mninawa",
            LastName = "Admin",
        },
    ];
}
