using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class LeadFactory
{
    private static readonly AdminNearbyLeadDto[] NearbyLeads =
    [
        new("Sonia", "Sandton", 78),
        new("Ja", "Randburg", 74),
        new("Annalie", "Meyerton", 71),
    ];

    public static LeadDocument FromRequest(CreateLeadRequestDto request, string? id = null)
    {
        var leadId = id ?? $"lead-{Guid.NewGuid():N}"[..12];
        var createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss");
        var score = ComputeScore(request);

        return new LeadDocument
        {
            Id = leadId,
            Source = request.Source,
            Status = "new",
            PipelineStage = "new",
            CustomerName = request.CustomerName.Trim(),
            CustomerEmail = request.CustomerEmail.Trim().ToLowerInvariant(),
            CustomerPhone = request.CustomerPhone.Trim(),
            PropertyAddress = request.PropertyAddress.Trim(),
            City = request.City.Trim(),
            Postcode = request.Postcode,
            Province = request.Province ?? "Gauteng",
            PanelCount = request.PanelCount,
            EstimatedPanelsRange = $"{request.PanelCount}–{request.PanelCount + 4}",
            RoofType = request.RoofType,
            Notes = request.Notes ?? request.RequestSnippet,
            RequestSnippet = request.RequestSnippet.Trim(),
            CreatedAt = createdAt,
            Urgency = request.Urgency,
            LeadScore = score,
            ServiceType = request.ServiceType ?? "Solar Panel Cleaning",
            Tags = [new LeadTagDocument { Label = "Residential", Tone = "teal" }],
            Activities =
            [
                new LeadActivityDocument
                {
                    Id = $"{leadId}-act-created",
                    Type = "created",
                    Title = request.Source == "bark_email" ? "New lead from Bark Email" : "New lead created",
                    Description = request.Source,
                    Timestamp = createdAt,
                },
            ],
            Checklist = [],
            NearbyLeads = NearbyLeads.Select(n => new LeadNearbyLeadDocument
            {
                Name = n.Name,
                Location = n.Location,
                Score = n.Score,
            }).ToList(),
        };
    }

    private static int ComputeScore(CreateLeadRequestDto request)
    {
        var score = 68;
        if (request.Urgency == "urgent") score += 10;
        if (request.PanelCount >= 20) score += 4;
        if (request.PanelCount >= 12) score += 2;
        return Math.Min(score, 95);
    }
}
