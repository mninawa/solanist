using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Paystack;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal sealed class ServicePlanService(
    IMongoDatabase db,
    IOptions<PaystackOptions> paystackOptions,
    IServiceProvider services,
    ILogger<ServicePlanService> logger) : IServicePlanCatalog
{
    private readonly PaystackOptions _paystackOptions = paystackOptions.Value;

    private IMongoCollection<ServicePlanDocument> Plans =>
        db.GetCollection<ServicePlanDocument>(MongoCollections.ServicePlans);

    public async Task<IReadOnlyList<AdminSubscriptionPlanDto>> GetAdminPlansAsync(CancellationToken ct = default)
    {
        var docs = await Plans.Find(FilterDefinition<ServicePlanDocument>.Empty)
            .SortBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .ToListAsync(ct);
        return docs.Select(ServicePlanMappers.ToAdminDto).ToList();
    }

    public async Task<IReadOnlyList<ServicePlanDto>> GetActiveCatalogAsync(CancellationToken ct = default)
    {
        var docs = await Plans.Find(p => p.Active)
            .SortBy(p => p.SortOrder)
            .ThenBy(p => p.Name)
            .ToListAsync(ct);
        return docs.Select(ServicePlanMappers.ToCatalogDto).ToList();
    }

    public async Task<AdminSubscriptionPlanDto?> CreatePlanAsync(
        UpsertServicePlanRequest request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return null;

        var sortOrder = (int)await Plans.CountDocumentsAsync(FilterDefinition<ServicePlanDocument>.Empty, cancellationToken: ct);
        var baseId = ServicePlanMappers.SlugifyId(request.Name);
        var id = baseId;
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var exists = await Plans.Find(p => p.Id == id).AnyAsync(ct);
            if (!exists) break;
            id = $"{baseId}-{Random.Shared.Next(100, 999)}";
        }

        var doc = ServicePlanMappers.FromUpsert(id, request, sortOrder);
        await Plans.InsertOneAsync(doc, cancellationToken: ct);
        return ServicePlanMappers.ToAdminDto(doc);
    }

    public async Task<AdminSubscriptionPlanDto?> UpdatePlanAsync(
        string id,
        UpsertServicePlanRequest request,
        CancellationToken ct = default)
    {
        var existing = await Plans.Find(p => p.Id == id).FirstOrDefaultAsync(ct);
        if (existing is null) return null;

        var doc = ServicePlanMappers.FromUpsert(id, request, existing.SortOrder);
        await Plans.ReplaceOneAsync(p => p.Id == id, doc, cancellationToken: ct);
        return ServicePlanMappers.ToAdminDto(doc);
    }

    public async Task<bool> DeactivatePlanAsync(string id, CancellationToken ct = default)
    {
        var result = await Plans.UpdateOneAsync(
            p => p.Id == id,
            Builders<ServicePlanDocument>.Update.Set(p => p.Active, false),
            cancellationToken: ct);
        return result.ModifiedCount > 0 || result.MatchedCount > 0;
    }

    public async Task<SyncPaystackPlanResponseDto?> SyncPaystackPlanAsync(string id, CancellationToken ct = default)
    {
        var doc = await Plans.Find(p => p.Id == id).FirstOrDefaultAsync(ct);
        if (doc is null) return null;

        if (!_paystackOptions.IsEnabled)
            return new SyncPaystackPlanResponseDto(
                ServicePlanMappers.ToAdminDto(doc),
                "Paystack is not configured — set Paystack__SecretKey and Paystack__PublicKey.");

        var paystackApi = services.GetService<PaystackApiClient>();
        if (paystackApi is null)
            return new SyncPaystackPlanResponseDto(
                ServicePlanMappers.ToAdminDto(doc),
                "Paystack API client is not available.");

        if (string.Equals(doc.PaystackInterval, "once", StringComparison.OrdinalIgnoreCase))
            return new SyncPaystackPlanResponseDto(
                ServicePlanMappers.ToAdminDto(doc),
                "Once-off plans do not use Paystack recurring plans.");

        if (!string.IsNullOrWhiteSpace(doc.PaystackPlanCode))
            return new SyncPaystackPlanResponseDto(
                ServicePlanMappers.ToAdminDto(doc),
                "Plan already linked to Paystack.");

        var amountCents = (int)Math.Round(doc.PricePerVisit * 100, MidpointRounding.AwayFromZero);
        var (created, paystackError) = await paystackApi.CreatePlanAsync(doc.Name, doc.PaystackInterval, amountCents, ct);
        if (created?.PlanCode is null)
            return new SyncPaystackPlanResponseDto(
                ServicePlanMappers.ToAdminDto(doc),
                paystackError ?? "Paystack could not create the plan — check API keys and interval.");

        doc.PaystackPlanCode = created.PlanCode;
        await Plans.ReplaceOneAsync(p => p.Id == id, doc, cancellationToken: ct);
        logger.LogInformation("Linked service plan {PlanId} to Paystack plan {PlanCode}", id, created.PlanCode);

        return new SyncPaystackPlanResponseDto(
            ServicePlanMappers.ToAdminDto(doc),
            $"Created Paystack plan {created.PlanCode}.");
    }

    public async Task<string?> ResolvePaystackPlanCodeAsync(string? planKey, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(planKey)) return null;

        var doc = await Plans.Find(p =>
                p.Active &&
                (p.Id == planKey || p.Name == planKey))
            .FirstOrDefaultAsync(ct);

        if (!string.IsNullOrWhiteSpace(doc?.PaystackPlanCode))
            return doc.PaystackPlanCode;

        return _paystackOptions.ResolvePlanCode(planKey);
    }

    public async Task<int> CountPaystackLinkedPlansAsync(CancellationToken ct = default)
    {
        return (int)await Plans.CountDocumentsAsync(
            p => p.Active && p.PaystackPlanCode != null && p.PaystackPlanCode != "",
            cancellationToken: ct);
    }
}
