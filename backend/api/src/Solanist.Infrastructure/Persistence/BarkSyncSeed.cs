using Solanist.Application.Dtos;

namespace Solanist.Infrastructure.Persistence;

internal static class BarkSyncSeed
{
    private static readonly BarkTemplate[] Templates =
    [
        new("Thandiwe Dlamini", "Fourways", "2055", "Need solar panel cleaning before winter.", "urgent", 20),
        new("Marcus van der Merwe", "Randburg", "2194", "Panels dusty after construction next door.", "normal", 16),
        new("Priya Naidoo", "Kempton Park", "1619", "Looking for quarterly cleaning quote.", "normal", 18),
        new("Johan Steyn", "Sandton", "2196", "Urgent — wedding venue needs panels spotless.", "urgent", 24),
        new("Amanda Govender", "Midrand", "1686", "Annual maintenance for 14-panel system.", "normal", 14),
    ];

    public static CreateLeadRequestDto Next(int existingBarkCount) =>
        Templates[existingBarkCount % Templates.Length].ToRequest();

    private sealed record BarkTemplate(
        string Name,
        string City,
        string Postcode,
        string Snippet,
        string Urgency,
        int Panels)
    {
        public CreateLeadRequestDto ToRequest() => new(
            Name,
            $"{Name.Split(' ')[0].ToLowerInvariant()}@email.com",
            "082 555 0101",
            City,
            City,
            Postcode,
            Snippet,
            Source: "bark_email",
            Urgency: Urgency,
            PanelCount: Panels);
    }
}
