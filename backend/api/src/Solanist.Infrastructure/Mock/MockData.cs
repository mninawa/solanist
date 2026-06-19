using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;

namespace Solanist.Infrastructure.Mock;

public static class MockData
{
    public const string InviteCode = "NB7XK2";

    public static readonly PropertyDetailsDto Property = new(
        "Hurlingham View", "Sandton", "2196", 12, "Tile Roof",
        "Side gate access — please use side entrance.", 5.2,
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop");

    public static readonly IReadOnlyList<ServicePlanDto> Plans =
    [
        new("plan-once", "Once-off Clean", "Single deep clean for immediate performance boost.", 699, 1, 699,
            ["Full panel wash", "Visual inspection", "Photo report"]),
        new("plan-quarterly", "Quarterly Solar Care", "Clean every 3 months — our best value plan.", 499, 4, 1996,
            ["4 cleans per year", "Priority booking", "WhatsApp reminders", "Before & after photo report"], true),
        new("plan-biannual", "Bi-Annual Care", "Two thorough cleans per year for steady maintenance.", 399, 2, 798,
            ["2 cleans per year", "Photo reports", "Flexible rescheduling"]),
    ];

    public static InviteDto Invite => new(
        InviteCode, "Nicolette Botha", "nicolette.botha@email.com", "082 123 4567",
        new InviteQuoteDto(699, 12, "Solar Panel Cleaning", "SOL-2026-0042",
            "Quote based on 12-panel array, tile roof, standard access."),
        Property, Plans, new DateTime(2026, 7, 16, 23, 59, 59, DateTimeKind.Utc), "pending", "email_exists");

    public static ClientDashboardDto Dashboard(bool reportAvailable) => new(
        "Nicolette", "Nicolette Botha", "Good morning",
        new PlanSummaryDto("Quarterly Solar Care", 499, 4, new DateOnly(2026, 6, 15)),
        new NextServiceDto("2026-06-22", "10:00 AM – 02:00 PM", 7, "confirmed"),
        Property, 5.2,
        reportAvailable ? ToSummary(Reports[0]) : null,
        new SubscriptionSummaryDto("active", "Quarterly Solar Care", 1996, 3),
        ["Improved energy production", "Longer panel lifespan", "Better return on investment", "Peace of mind"],
        "Your system is in great shape");

    public static readonly IReadOnlyList<BookingDto> Bookings =
    [
        new("booking-001", "2026-06-22", "10:00 AM – 02:00 PM", "upcoming", "Solar Panel Cleaning",
            "Hurlingham View, Sandton", "James M.", "confirmed"),
        new("booking-002", "2026-09-22", "08:00 AM – 12:00 PM", "upcoming", "Solar Panel Cleaning",
            "Hurlingham View, Sandton", null, "scheduled"),
        new("booking-003", "2026-03-22", "10:00 AM – 02:00 PM", "completed", "Solar Panel Cleaning",
            "Hurlingham View, Sandton", "James M.", "confirmed"),
        new("booking-004", "2025-12-15", "12:00 PM – 04:00 PM", "completed", "Solar Panel Cleaning",
            "Hurlingham View, Sandton", "Sipho N.", "confirmed"),
        new("booking-005", "2025-09-15", "08:00 AM – 12:00 PM", "completed", "Solar Panel Cleaning",
            "Hurlingham View, Sandton", "Sipho N.", "confirmed"),
    ];

    public static readonly IReadOnlyList<CleaningReportDto> Reports =
    [
        new("report-001", "2026-03-22", "Solar Panel Cleaning Report", 12, "James M.",
            "Hurlingham View, Sandton, 2196",
            ["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=260&fit=crop",
             "https://images.unsplash.com/photo-1497441173707-f25a2e1d4a65?w=400&h=260&fit=crop"],
            ["https://images.unsplash.com/photo-1613665813447-82a78c468a4d?w=400&h=260&fit=crop"],
            ["Panels inspected for damage", "Debris removed", "Full rinse completed"],
            "All 12 panels cleaned successfully. No damage observed."),
    ];

    public static CleaningReportSummaryDto ToSummary(CleaningReportDto r) =>
        new(r.Id, r.CompletedAt, r.ServiceType, r.PanelCount, r.StaffName,
            r.BeforePhotos.FirstOrDefault());

    public static readonly SubscriptionDto Subscription = new(
        "Quarterly Solar Care", "Clean every 3 months", "active", 499, 1996, "Quarterly",
        "2026-06-15", "2026-06-22", 3, "Mastercard •••• 4312",
        ["Priority booking", "Photo report", "WhatsApp reminders", "Support"]);

    public static readonly IReadOnlyList<PaymentDto> Payments =
    [
        new("pay-001", "2026-03-15", "Quarterly Solar Care", 499, "paid"),
        new("pay-002", "2025-12-15", "Quarterly Solar Care", 499, "paid"),
        new("pay-003", "2025-09-15", "Quarterly Solar Care", 499, "paid"),
    ];

    public static readonly IReadOnlyList<PropertySummaryDto> Properties =
    [
        new("prop-001", Property.Address, Property.City, Property.Postcode, Property.PanelCount,
            Property.RoofType, Property.AccessNotes, Property.SystemSizeKw, Property.ImageUrl, true,
            "active", "Quarterly Solar Care", "purple", "Every 3 months", "2026-06-22",
            "10:00 AM – 02:00 PM", 499, 4, 3, 166),
    ];

    public static readonly ClientProfileDto Profile = new(
        "Nicolette", "Botha", "nicolette.botha@email.com", "082 123 4567", "whatsapp", true, true);

    public static readonly IReadOnlyList<ChecklistItemDto> DefaultChecklist =
    [
        new("c1", "Arrive on site and confirm access", false, true),
        new("c2", "Take before photos (all arrays)", false, true),
        new("c3", "Inspect panels for damage or faults", false, true),
        new("c4", "Remove debris and organic buildup", false, true),
        new("c5", "Clean all panels with purified water", false, true),
        new("c6", "Take after photos (all arrays)", false, true),
        new("c7", "Verify system is operational", false, true),
    ];
}
