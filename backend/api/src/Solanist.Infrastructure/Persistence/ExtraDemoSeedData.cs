using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal sealed class DemoCustomerBundle
{
    public required CustomerDocument Customer { get; init; }
    public required IReadOnlyList<PropertyDocument> Properties { get; init; }
    public required SubscriptionDocument Subscription { get; init; }
    public required UserDocument User { get; init; }
}

internal static class ExtraDemoSeedData
{
    private const string ImageUrl =
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop";

    public static IReadOnlyList<DemoCustomerBundle> Bundles =>
    [
        DavidKhumalo(),
        LindaPretorius(),
    ];

    public static IReadOnlyList<UserDocument> ExtraStaffUsers =>
        MongoSeedData.Users.Where(u => u.StaffId is "staff-002" or "staff-003").ToList();

    private static DemoCustomerBundle DavidKhumalo() => new()
    {
        Customer = new CustomerDocument
        {
            Id = "cust-002",
            Email = "david.khumalo@email.com",
            FirstName = "David",
            LastName = "Khumalo",
            Phone = "083 234 5678",
            PreferredContact = "whatsapp",
            EmailReminders = true,
            WhatsAppReminders = true,
            BillingMode = "combined",
            ReportsPublished = true,
            Greeting = "Good morning",
            SystemStatus = "Your system is performing well",
            ValueProps = ["Maximize energy output", "Protect your investment", "Peace of mind"],
        },
        Properties =
        [
            new PropertyDocument
            {
                Id = "prop-david-001",
                CustomerId = "cust-002",
                Address = "Sandton Ridge",
                City = "Sandton",
                Postcode = "2196",
                PanelCount = 16,
                RoofType = "Tile Roof",
                AccessNotes = "Front gate — call on arrival.",
                SystemSizeKw = 6.9,
                ImageUrl = ImageUrl,
                IsPrimary = true,
                SubscriptionStatus = "active",
                PlanName = "Quarterly Solar Care",
                PlanVariant = "blue",
                PlanFrequency = "Every 3 months",
                NextCleanDate = "2026-07-10",
                NextCleanTimeSlot = "12:30 PM – 02:30 PM",
                PricePerClean = 499,
                VisitsPerYear = 4,
                VisitsRemaining = 3,
                MonthlyBilling = 166,
            },
        ],
        Subscription = new SubscriptionDocument
        {
            Id = "sub-002",
            CustomerId = "cust-002",
            PlanName = "Quarterly Solar Care",
            PlanDescription = "Clean every 3 months — our best value plan.",
            Status = "active",
            PricePerVisit = 499,
            AnnualPrice = 1996,
            BillingCycle = "Quarterly",
            NextBillingDate = "2026-07-01",
            NextCleanDate = "2026-07-10",
            VisitsRemaining = 3,
            PaymentMethod = "Visa •••• 8821",
            Features = ["Priority booking", "Photo report", "WhatsApp reminders"],
        },
        User = new UserDocument
        {
            Id = "user-david-001",
            Email = "david.khumalo@email.com",
            Role = "client",
            CustomerId = "cust-002",
            FirstName = "David",
            LastName = "Khumalo",
            Phone = "083 234 5678",
        },
    };

    private static DemoCustomerBundle LindaPretorius() => new()
    {
        Customer = new CustomerDocument
        {
            Id = "cust-003",
            Email = "linda.pretorius@email.com",
            FirstName = "Linda",
            LastName = "Pretorius",
            Phone = "082 456 7890",
            PreferredContact = "phone",
            EmailReminders = true,
            WhatsAppReminders = false,
            BillingMode = "combined",
            ReportsPublished = false,
            Greeting = "Hello",
            SystemStatus = "Annual clean completed",
            ValueProps = ["Longer panel lifespan", "Better return on investment"],
        },
        Properties =
        [
            new PropertyDocument
            {
                Id = "prop-linda-001",
                CustomerId = "cust-003",
                Address = "Parkhurst Villa",
                City = "Parkhurst",
                Postcode = "2193",
                PanelCount = 10,
                RoofType = "Tile Roof",
                AccessNotes = "Front gate code: 8821",
                SystemSizeKw = 4.2,
                ImageUrl = ImageUrl,
                IsPrimary = true,
                SubscriptionStatus = "active",
                PlanName = "Bi-Annual Care",
                PlanVariant = "teal",
                PlanFrequency = "Every 6 months",
                NextCleanDate = "2026-12-01",
                NextCleanTimeSlot = "08:00 AM – 10:00 AM",
                PricePerClean = 399,
                VisitsPerYear = 2,
                VisitsRemaining = 1,
                MonthlyBilling = 67,
            },
        ],
        Subscription = new SubscriptionDocument
        {
            Id = "sub-003",
            CustomerId = "cust-003",
            PlanName = "Bi-Annual Care",
            PlanDescription = "Two thorough cleans per year.",
            Status = "active",
            PricePerVisit = 399,
            AnnualPrice = 798,
            BillingCycle = "Bi-Annual",
            NextBillingDate = "2026-12-01",
            NextCleanDate = "2026-12-01",
            VisitsRemaining = 1,
            PaymentMethod = "Mastercard •••• 1190",
            Features = ["Photo reports", "Flexible rescheduling"],
        },
        User = new UserDocument
        {
            Id = "user-linda-001",
            Email = "linda.pretorius@email.com",
            Role = "client",
            CustomerId = "cust-003",
            FirstName = "Linda",
            LastName = "Pretorius",
            Phone = "082 456 7890",
        },
    };
}
