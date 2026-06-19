namespace Solanist.Application.Abstractions;

using Solanist.Application.Dtos;

public interface IServicePlanCatalog
{
    Task<IReadOnlyList<AdminSubscriptionPlanDto>> GetAdminPlansAsync(CancellationToken ct = default);

    Task<IReadOnlyList<ServicePlanDto>> GetActiveCatalogAsync(CancellationToken ct = default);

    Task<AdminSubscriptionPlanDto?> CreatePlanAsync(UpsertServicePlanRequest request, CancellationToken ct = default);

    Task<AdminSubscriptionPlanDto?> UpdatePlanAsync(string id, UpsertServicePlanRequest request, CancellationToken ct = default);

    Task<bool> DeactivatePlanAsync(string id, CancellationToken ct = default);

    Task<SyncPaystackPlanResponseDto?> SyncPaystackPlanAsync(string id, CancellationToken ct = default);

    Task<string?> ResolvePaystackPlanCodeAsync(string? planKey, CancellationToken ct = default);

    Task<int> CountPaystackLinkedPlansAsync(CancellationToken ct = default);
}
