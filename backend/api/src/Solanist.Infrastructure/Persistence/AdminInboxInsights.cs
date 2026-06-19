using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminInboxInsights
{
    public static IReadOnlyList<string> BuildSuggestedSteps(IReadOnlyList<LeadDocument> leads)
    {
        var open = leads.Where(l => l.Status is not ("converted" or "lost")).ToList();
        var urgent = open.Count(l => l.Urgency == "urgent");
        var inviteReady = open.Count(l =>
            l.Status is "interested" or "quote_sent" && string.IsNullOrWhiteSpace(l.InviteCode));
        var quoteReady = open.Count(l => l.Status is "new" or "contacted");

        var steps = new List<string>();
        if (urgent > 0)
            steps.Add($"Respond to {urgent} urgent lead{(urgent == 1 ? "" : "s")}");
        if (inviteReady > 0)
            steps.Add($"Send platform invites to {inviteReady} lead{(inviteReady == 1 ? "" : "s")}");
        if (quoteReady > 0)
            steps.Add($"Create quotes for {quoteReady} ready lead{(quoteReady == 1 ? "" : "s")}");

        if (steps.Count == 0)
            steps.Add("Inbox is clear — follow up on open conversations.");

        return steps;
    }

    public static string LastBarkSync(IReadOnlyList<LeadDocument> leads)
    {
        var latest = leads
            .Where(l => l.Source.Contains("bark", StringComparison.OrdinalIgnoreCase))
            .Select(l => l.CreatedAt)
            .OrderByDescending(c => c)
            .FirstOrDefault();

        return latest ?? DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
    }

    public static IReadOnlyList<AdminHotspotDto> BuildHotspots(IReadOnlyList<LeadDocument> leads) =>
        leads.GroupBy(l => l.City)
            .Select(g => new AdminHotspotDto(g.Key, g.Count()))
            .OrderByDescending(h => h.Leads)
            .Take(5)
            .ToList();
}
