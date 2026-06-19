using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class DashboardPaymentsSeed
{
    public static IReadOnlyList<PaymentDocument> Payments(DateOnly today) =>
    [
        new()
        {
            Id = "pay-dash-001",
            CustomerId = "cust-001",
            Date = today.AddDays(-2).ToString("yyyy-MM-dd"),
            Description = "Quarterly Solar Care",
            Amount = 499,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-002",
            CustomerId = "cust-002",
            Date = today.AddDays(-1).ToString("yyyy-MM-dd"),
            Description = "Bi-Annual Solar Care",
            Amount = 399,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-003",
            CustomerId = "cust-003",
            Date = today.ToString("yyyy-MM-dd"),
            Description = "Quarterly Solar Care",
            Amount = 499,
            Status = "pending",
        },
        new()
        {
            Id = "pay-dash-004",
            CustomerId = "cust-001",
            Date = today.AddMonths(-1).AddDays(5).ToString("yyyy-MM-dd"),
            Description = "Quarterly Solar Care",
            Amount = 499,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-005",
            CustomerId = "cust-002",
            Date = today.AddMonths(-2).AddDays(8).ToString("yyyy-MM-dd"),
            Description = "Bi-Annual Solar Care",
            Amount = 399,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-006",
            CustomerId = "cust-001",
            Date = today.AddMonths(-3).AddDays(12).ToString("yyyy-MM-dd"),
            Description = "Quarterly Solar Care",
            Amount = 499,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-007",
            CustomerId = "cust-003",
            Date = today.AddMonths(-4).AddDays(3).ToString("yyyy-MM-dd"),
            Description = "Quarterly Solar Care",
            Amount = 499,
            Status = "paid",
        },
        new()
        {
            Id = "pay-dash-008",
            CustomerId = "cust-002",
            Date = today.AddMonths(-5).AddDays(15).ToString("yyyy-MM-dd"),
            Description = "Bi-Annual Solar Care",
            Amount = 399,
            Status = "paid",
        },
    ];
}
