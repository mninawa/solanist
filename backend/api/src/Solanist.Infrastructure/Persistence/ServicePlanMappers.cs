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

    /// <summary>Human-friendly cleaning cadence shown to clients (e.g. "Every 3 months", "Daily").</summary>
    public static string FrequencyLabel(string? paystackInterval, int visitsPerYear)
    {
        var interval = (paystackInterval ?? "").Trim().ToLowerInvariant();
        return interval switch
        {
            "daily" => "Daily",
            "weekly" => "Weekly",
            "monthly" => "Monthly",
            "quarterly" => "Every 3 months",
            "biannually" => "Every 6 months",
            "annually" => "Annual",
            "hourly" => "Hourly",
            "once" => "Once-off",
            _ => visitsPerYear switch
            {
                >= 300 => "Daily",
                >= 50 => "Weekly",
                12 => "Monthly",
                6 => "Every 2 months",
                4 => "Every 3 months",
                3 => "Every 4 months",
                2 => "Every 6 months",
                1 => "Annual",
                <= 0 => "Once-off",
                _ => $"{visitsPerYear} visits / year",
            },
        };
    }

    /// <summary>Monthly-equivalent billing for the combined-billing summary. Once-off plans return 0.</summary>
    public static decimal MonthlyEquivalent(
        decimal pricePerVisit,
        decimal annualPrice,
        int visitsPerYear,
        string? paystackInterval)
    {
        var interval = (paystackInterval ?? "").Trim().ToLowerInvariant();
        if (interval == "once") return 0m;
        if (annualPrice > 0) return Math.Round(annualPrice / 12m, 0);
        if (visitsPerYear > 0) return Math.Round(pricePerVisit * visitsPerYear / 12m, 0);
        return 0m;
    }

    /// <summary>
    /// Backfills plan-derived fields (frequency, price, visits, monthly billing) on a property
    /// from its assigned plan when they are missing. Returns true when the document changed.
    /// </summary>
    public static bool ApplyPlanFields(PropertyDocument property, AdminSubscriptionPlanDto plan)
    {
        var changed = false;
        if (string.IsNullOrWhiteSpace(property.PlanFrequency))
        {
            property.PlanFrequency = FrequencyLabel(plan.PaystackInterval, plan.VisitsPerYear);
            changed = true;
        }
        if ((property.PricePerClean ?? 0m) <= 0m && plan.Price > 0)
        {
            property.PricePerClean = plan.Price;
            changed = true;
        }
        if ((property.VisitsPerYear ?? 0) <= 0 && plan.VisitsPerYear > 0)
        {
            property.VisitsPerYear = plan.VisitsPerYear;
            changed = true;
        }
        if (property.VisitsRemaining is null && plan.VisitsPerYear > 0)
        {
            property.VisitsRemaining = plan.VisitsPerYear;
            changed = true;
        }
        if (property.MonthlyBilling is null)
        {
            property.MonthlyBilling = MonthlyEquivalent(
                plan.Price, plan.AnnualPrice, plan.VisitsPerYear, plan.PaystackInterval);
            changed = true;
        }
        return changed;
    }

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
