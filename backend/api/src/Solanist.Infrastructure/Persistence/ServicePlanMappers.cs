using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class ServicePlanMappers
{
    public static AdminSubscriptionPlanDto ToAdminDto(ServicePlanDocument doc) => new(
        doc.Id,
        doc.Name,
        doc.PricePerVisit,
        doc.IntervalLabel,
        doc.Features,
        doc.Popular,
        doc.Description,
        doc.VisitsPerYear,
        doc.AnnualPrice,
        doc.Active,
        doc.PaystackPlanCode,
        doc.PaystackInterval,
        !string.IsNullOrWhiteSpace(doc.PaystackPlanCode));

    public static ServicePlanDto ToCatalogDto(ServicePlanDocument doc) => new(
        doc.Id,
        doc.Name,
        doc.Description,
        doc.PricePerVisit,
        doc.VisitsPerYear,
        doc.AnnualPrice,
        doc.Features,
        doc.Popular);

    public static ServicePlanDocument FromUpsert(string id, UpsertServicePlanRequest request, int sortOrder)
    {
        var annualPrice = request.PricePerVisit * request.VisitsPerYear;
        return new ServicePlanDocument
        {
            Id = id,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? "",
            PricePerVisit = request.PricePerVisit,
            VisitsPerYear = request.VisitsPerYear,
            AnnualPrice = annualPrice,
            IntervalLabel = BuildIntervalLabel(request.VisitsPerYear),
            Features = request.Features.Where(f => !string.IsNullOrWhiteSpace(f)).Select(f => f.Trim()).ToList(),
            Popular = request.Popular,
            Active = request.Active,
            PaystackPlanCode = string.IsNullOrWhiteSpace(request.PaystackPlanCode)
                ? null
                : request.PaystackPlanCode.Trim(),
            PaystackInterval = NormalizePaystackInterval(request.PaystackInterval),
            SortOrder = sortOrder,
        };
    }

    public static string BuildIntervalLabel(int visitsPerYear) => visitsPerYear switch
    {
        <= 1 => "per visit",
        2 => "per visit (bi-annual)",
        4 => "per visit (quarterly)",
        12 => "per visit (monthly)",
        _ => "per visit",
    };

    public static string NormalizePaystackInterval(string? interval)
    {
        var normalized = (interval ?? "quarterly").Trim().ToLowerInvariant();
        return normalized switch
        {
            "monthly" or "quarterly" or "biannually" or "annually" or "weekly" or "daily" or "hourly" or "once" => normalized,
            _ => "quarterly",
        };
    }

    public static string SlugifyId(string name)
    {
        var slug = new string(name.ToLowerInvariant()
            .Select(c => char.IsLetterOrDigit(c) ? c : '-')
            .ToArray())
            .Trim('-');
        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);
        return string.IsNullOrWhiteSpace(slug) ? $"plan-{Guid.NewGuid():N}"[..12] : $"plan-{slug}";
    }
}
