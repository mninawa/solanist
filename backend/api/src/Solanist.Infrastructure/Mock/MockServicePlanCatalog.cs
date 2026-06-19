using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence;

namespace Solanist.Infrastructure.Mock;

public sealed class MockServicePlanCatalog : IServicePlanCatalog
{
    private readonly List<AdminSubscriptionPlanDto> _plans;

    public MockServicePlanCatalog()
    {
        _plans = MockData.Plans.Select((p, index) => new AdminSubscriptionPlanDto(
            p.Id,
            p.Name,
            p.PricePerVisit,
            ServicePlanMappers.BuildIntervalLabel(p.VisitsPerYear),
            p.Features,
            p.Recommended,
            p.Description,
            p.VisitsPerYear,
            p.AnnualPrice,
            Active: true,
            PaystackPlanCode: null,
            PaystackInterval: p.VisitsPerYear switch
            {
                1 => "once",
                2 => "biannually",
                4 => "quarterly",
                12 => "monthly",
                _ => "quarterly",
            },
            PaystackLinked: false)).ToList();
    }

    public Task<IReadOnlyList<AdminSubscriptionPlanDto>> GetAdminPlansAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<AdminSubscriptionPlanDto>>(_plans.ToList());

    public Task<IReadOnlyList<ServicePlanDto>> GetActiveCatalogAsync(CancellationToken ct = default) =>
        Task.FromResult(MockData.Plans);

    public Task<AdminSubscriptionPlanDto?> CreatePlanAsync(UpsertServicePlanRequest request, CancellationToken ct = default)
    {
        var id = ServicePlanMappers.SlugifyId(request.Name);
        if (_plans.Any(p => p.Id == id))
            id = $"{id}-{Random.Shared.Next(100, 999)}";

        var annualPrice = request.PricePerVisit * request.VisitsPerYear;
        var plan = new AdminSubscriptionPlanDto(
            id,
            request.Name.Trim(),
            request.PricePerVisit,
            ServicePlanMappers.BuildIntervalLabel(request.VisitsPerYear),
            request.Features.Where(f => !string.IsNullOrWhiteSpace(f)).Select(f => f.Trim()).ToList(),
            request.Popular,
            request.Description?.Trim() ?? "",
            request.VisitsPerYear,
            annualPrice,
            request.Active,
            string.IsNullOrWhiteSpace(request.PaystackPlanCode) ? null : request.PaystackPlanCode.Trim(),
            ServicePlanMappers.NormalizePaystackInterval(request.PaystackInterval),
            !string.IsNullOrWhiteSpace(request.PaystackPlanCode));

        _plans.Add(plan);
        return Task.FromResult<AdminSubscriptionPlanDto?>(plan);
    }

    public Task<AdminSubscriptionPlanDto?> UpdatePlanAsync(string id, UpsertServicePlanRequest request, CancellationToken ct = default)
    {
        var index = _plans.FindIndex(p => p.Id == id);
        if (index < 0) return Task.FromResult<AdminSubscriptionPlanDto?>(null);

        var annualPrice = request.PricePerVisit * request.VisitsPerYear;
        var updated = new AdminSubscriptionPlanDto(
            id,
            request.Name.Trim(),
            request.PricePerVisit,
            ServicePlanMappers.BuildIntervalLabel(request.VisitsPerYear),
            request.Features.Where(f => !string.IsNullOrWhiteSpace(f)).Select(f => f.Trim()).ToList(),
            request.Popular,
            request.Description?.Trim() ?? "",
            request.VisitsPerYear,
            annualPrice,
            request.Active,
            string.IsNullOrWhiteSpace(request.PaystackPlanCode) ? null : request.PaystackPlanCode.Trim(),
            ServicePlanMappers.NormalizePaystackInterval(request.PaystackInterval),
            !string.IsNullOrWhiteSpace(request.PaystackPlanCode));

        _plans[index] = updated;
        return Task.FromResult<AdminSubscriptionPlanDto?>(updated);
    }

    public Task<bool> DeactivatePlanAsync(string id, CancellationToken ct = default)
    {
        var index = _plans.FindIndex(p => p.Id == id);
        if (index < 0) return Task.FromResult(false);

        var existing = _plans[index];
        _plans[index] = existing with { Active = false };
        return Task.FromResult(true);
    }

    public Task<SyncPaystackPlanResponseDto?> SyncPaystackPlanAsync(string id, CancellationToken ct = default)
    {
        var plan = _plans.FirstOrDefault(p => p.Id == id);
        if (plan is null) return Task.FromResult<SyncPaystackPlanResponseDto?>(null);

        return Task.FromResult<SyncPaystackPlanResponseDto?>(
            new SyncPaystackPlanResponseDto(plan, "Paystack sync requires MongoDB and configured API keys."));
    }

    public Task<string?> ResolvePaystackPlanCodeAsync(string? planKey, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(planKey)) return Task.FromResult<string?>(null);
        var plan = _plans.FirstOrDefault(p => p.Id == planKey || p.Name == planKey);
        return Task.FromResult(plan?.PaystackPlanCode);
    }

    public Task<int> CountPaystackLinkedPlansAsync(CancellationToken ct = default) =>
        Task.FromResult(_plans.Count(p => p.Active && p.PaystackLinked));
}
