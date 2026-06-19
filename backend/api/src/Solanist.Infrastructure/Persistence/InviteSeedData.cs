using Solanist.Infrastructure.Mock;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class InviteSeedData
{
    private const string ImageUrl =
        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop";

    public static IReadOnlyList<InviteDocument> Invites =>
    [
        FromMockInvite(),
        PeterVanWykInvite(),
    ];

    private static InviteDocument FromMockInvite() => new()
    {
        Id = "invite-nb7xk2",
        Code = MockData.InviteCode,
        CustomerName = "Nicolette Botha",
        CustomerEmail = "nicolette.botha@email.com",
        CustomerPhone = "082 123 4567",
        Quote = new InviteQuoteDocument
        {
            BasePrice = 699,
            EstimatedPanelCount = 12,
            ServiceType = "Solar Panel Cleaning",
            QuoteRef = "SOL-2026-0042",
            Notes = "Quote based on 12-panel array, tile roof, standard access.",
        },
        Property = new InvitePropertyDocument
        {
            Address = "Hurlingham View",
            City = "Sandton",
            Postcode = "2196",
            PanelCount = 12,
            RoofType = "Tile Roof",
            AccessNotes = "Side gate access — please use side entrance.",
            SystemSizeKw = 5.2,
            ImageUrl = ImageUrl,
        },
        Plans = ToPlanDocs(MockData.Plans),
        ExpiresAt = new DateTime(2026, 7, 16, 23, 59, 59, DateTimeKind.Utc),
        Status = "pending",
        SentAt = "2026-06-10T10:00:00",
        SentBy = "Sarah N.",
        LeadId = "lead-nicolette",
    };

    private static InviteDocument PeterVanWykInvite() => new()
    {
        Id = "invite-pk9m4r",
        Code = "PK9M4R",
        CustomerName = "Peter van Wyk",
        CustomerEmail = "peter.vw@email.com",
        CustomerPhone = "084 333 4455",
        Quote = new InviteQuoteDocument
        {
            BasePrice = 849,
            EstimatedPanelCount = 14,
            ServiceType = "Solar Panel Cleaning",
            QuoteRef = "SOL-2026-0048",
            Notes = "Metal roof — harness required.",
        },
        Property = new InvitePropertyDocument
        {
            Address = "Kyalami Hills",
            City = "Kyalami",
            Postcode = "1684",
            PanelCount = 14,
            RoofType = "Metal Roof",
            AccessNotes = "Front gate code: 7721",
            SystemSizeKw = 6.1,
            ImageUrl = ImageUrl,
        },
        Plans = ToPlanDocs(MockData.Plans),
        ExpiresAt = new DateTime(2026, 7, 1, 23, 59, 59, DateTimeKind.Utc),
        Status = "pending",
        SentAt = "2026-06-14T15:30:00",
        SentBy = "Sarah N.",
        LeadId = "lead-006",
    };

    private static List<InvitePlanDocument> ToPlanDocs(
        IReadOnlyList<Solanist.Application.Dtos.ServicePlanDto> plans) =>
        plans.Select(p => new InvitePlanDocument
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            PricePerVisit = p.PricePerVisit,
            VisitsPerYear = p.VisitsPerYear,
            AnnualPrice = p.AnnualPrice,
            Features = p.Features.ToList(),
            Recommended = p.Recommended,
        }).ToList();
}
