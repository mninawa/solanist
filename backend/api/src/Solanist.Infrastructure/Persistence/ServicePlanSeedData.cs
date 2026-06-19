using Solanist.Application.Dtos;
using Solanist.Infrastructure.Mock;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class ServicePlanSeedData
{
    public static IReadOnlyList<ServicePlanDocument> Build(PaystackOptions? paystack = null) =>
    [
        FromCatalogPlan(MockData.Plans[0], "once", sortOrder: 0, paystack),
        FromCatalogPlan(MockData.Plans[1], "quarterly", sortOrder: 1, paystack, popular: true),
        FromCatalogPlan(MockData.Plans[2], "biannually", sortOrder: 2, paystack),
    ];

    private static ServicePlanDocument FromCatalogPlan(
        ServicePlanDto plan,
        string paystackInterval,
        int sortOrder,
        PaystackOptions? paystack,
        bool? popular = null)
    {
        var code = paystack?.ResolvePlanCode(plan.Id) ?? paystack?.ResolvePlanCode(plan.Name);
        return new ServicePlanDocument
        {
            Id = plan.Id,
            Name = plan.Name,
            Description = plan.Description,
            PricePerVisit = plan.PricePerVisit,
            VisitsPerYear = plan.VisitsPerYear,
            AnnualPrice = plan.AnnualPrice,
            IntervalLabel = ServicePlanMappers.BuildIntervalLabel(plan.VisitsPerYear),
            Features = plan.Features.ToList(),
            Popular = popular ?? plan.Recommended,
            Active = true,
            PaystackPlanCode = code,
            PaystackInterval = paystackInterval,
            SortOrder = sortOrder,
        };
    }
}
