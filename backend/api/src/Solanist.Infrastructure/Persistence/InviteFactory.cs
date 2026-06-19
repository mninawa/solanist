using MongoDB.Driver;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Mock;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class InviteFactory
{
    private const string CodeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    public static async Task<string> GenerateUniqueCodeAsync(
        IMongoCollection<InviteDocument> invites,
        CancellationToken ct)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var code = GenerateCode();
            var exists = await invites.Find(i => i.Code == code).AnyAsync(ct);
            if (!exists) return code;
        }

        return GenerateCode() + Random.Shared.Next(10, 99);
    }

    public static InviteDocument BuildFromLead(
        LeadDocument lead,
        string code,
        DateTime expiresAt,
        string sentBy,
        IReadOnlyList<ServicePlanDto>? plans = null)
    {
        var catalog = plans is { Count: > 0 } ? plans : MockData.Plans;
        var plan = catalog.FirstOrDefault(p => p.Recommended) ?? catalog[0];
        var quotePrice = lead.QuoteSummary?.Price ?? plan.PricePerVisit;

        return new InviteDocument
        {
            Id = $"invite-{code.ToLowerInvariant()}",
            Code = code,
            CustomerName = lead.CustomerName,
            CustomerEmail = lead.CustomerEmail,
            CustomerPhone = lead.CustomerPhone,
            Quote = new InviteQuoteDocument
            {
                BasePrice = quotePrice,
                EstimatedPanelCount = lead.PanelCount,
                ServiceType = lead.ServiceType,
                QuoteRef = lead.QuoteRef ?? lead.QuoteSummary?.Ref,
                Notes = lead.Notes,
            },
            Property = new InvitePropertyDocument
            {
                Address = lead.PropertyAddress,
                City = lead.City,
                Postcode = lead.Postcode ?? "",
                PanelCount = lead.PanelCount,
                RoofType = lead.RoofType,
                AccessNotes = lead.AccessNotes,
                SystemSizeKw = Math.Round(lead.PanelCount * 0.43, 1),
            },
            Plans = catalog.Select(p => new InvitePlanDocument
            {
                Id = p.Id,
                Name = p.Name,
                Description = p.Description,
                PricePerVisit = p.PricePerVisit,
                VisitsPerYear = p.VisitsPerYear,
                AnnualPrice = p.AnnualPrice,
                Features = p.Features.ToList(),
                Recommended = p.Recommended,
            }).ToList(),
            ExpiresAt = expiresAt,
            Status = "pending",
            SentAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
            SentBy = sentBy,
            LeadId = lead.Id,
        };
    }

    public static string BuildInviteLink(string code) => $"/invite/{code}";

    private static string GenerateCode() =>
        new string(Enumerable.Range(0, 6).Select(_ => CodeChars[Random.Shared.Next(CodeChars.Length)]).ToArray());
}
