using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminDashboardMetrics
{
    public static AdminDashboardStatsDto BuildStats(
        IReadOnlyList<LeadDocument> leads,
        IReadOnlyList<BookingDocument> upcomingBookings,
        IReadOnlyList<PropertyDocument> properties,
        IReadOnlyList<PaymentDocument> payments,
        DateOnly today)
    {
        var todayStr = today.ToString("yyyy-MM-dd");
        var yesterdayStr = today.AddDays(-1).ToString("yyyy-MM-dd");
        var monthPrefix = todayStr[..7];
        var prevMonth = today.AddMonths(-1);
        var prevMonthPrefix = prevMonth.ToString("yyyy-MM");

        var newLeadsToday = leads.Count(l => l.CreatedAt.StartsWith(todayStr, StringComparison.Ordinal));
        var newLeadsYesterday = leads.Count(l => l.CreatedAt.StartsWith(yesterdayStr, StringComparison.Ordinal));
        var quotesSent = leads.Count(l => l.Status == "quote_sent");
        var quotesLastWeek = CountInRange(leads, today.AddDays(-14), today.AddDays(-7),
            l => l.Status == "quote_sent");
        var quotesThisWeek = CountInRange(leads, today.AddDays(-7), today,
            l => l.Status == "quote_sent");
        var activeSubscriptions = properties.Count(p => p.SubscriptionStatus == "active");
        var totalProperties = properties.Count;

        var revenueMtd = SumPaid(payments, monthPrefix);
        var revenuePrevMonth = SumPaid(payments, prevMonthPrefix);

        return new AdminDashboardStatsDto(
            newLeadsToday,
            FormatCountTrend(newLeadsToday, newLeadsYesterday, "yesterday"),
            quotesSent,
            FormatCountTrend(quotesThisWeek, quotesLastWeek, "last week"),
            upcomingBookings.Count,
            FormatCountTrend(upcomingBookings.Count, Math.Max(upcomingBookings.Count - 1, 0), "prior"),
            activeSubscriptions,
            totalProperties > 0
                ? $"{Pct(activeSubscriptions, totalProperties)}% of properties"
                : "—",
            revenueMtd,
            FormatRevenueTrend(revenueMtd, revenuePrevMonth));
    }

    public static (decimal Paid, decimal Pending, decimal AvgDeal) RevenueBreakdown(
        IReadOnlyList<PaymentDocument> payments)
    {
        var paid = payments.Where(p => p.Status == "paid").ToList();
        var pending = payments.Where(p => p.Status == "pending").Sum(p => p.Amount);
        var avg = paid.Count > 0 ? paid.Average(p => p.Amount) : 0m;
        return (paid.Sum(p => p.Amount), pending, avg);
    }

    public static IReadOnlyList<AdminRevenueTrendPointDto> BuildRevenueTrend(
        IReadOnlyList<PaymentDocument> payments,
        DateOnly today,
        int months = 6)
    {
        var paid = payments.Where(p => p.Status == "paid").ToList();
        var points = new List<AdminRevenueTrendPointDto>();

        for (var i = months - 1; i >= 0; i--)
        {
            var month = today.AddMonths(-i);
            var prefix = month.ToString("yyyy-MM");
            var amount = paid
                .Where(p => p.Date.StartsWith(prefix, StringComparison.Ordinal))
                .Sum(p => p.Amount);
            points.Add(new AdminRevenueTrendPointDto(month.ToString("MMM"), amount));
        }

        return points;
    }

    public static double ConversionRate(IReadOnlyList<LeadDocument> leads)
    {
        var eligible = leads.Count(l => l.Status is not "lost");
        if (eligible == 0) return 0;
        var converted = leads.Count(l => l.Status == "converted");
        return Math.Round(converted * 100.0 / eligible, 1);
    }

    public static double AvgTimeToWin(IReadOnlyList<LeadDocument> leads)
    {
        var wins = leads.Where(l => l.Status == "converted").ToList();
        if (wins.Count == 0) return 0;

        var totalDays = 0.0;
        foreach (var lead in wins)
        {
            if (!DateTime.TryParse(lead.CreatedAt, out var created)) continue;
            var wonAt = lead.Activities
                .Select(a => DateTime.TryParse(a.Timestamp, out var t) ? t : (DateTime?)null)
                .Where(t => t.HasValue)
                .Select(t => t!.Value)
                .DefaultIfEmpty(DateTime.UtcNow)
                .Max();
            totalDays += (wonAt - created).TotalDays;
        }

        return Math.Round(totalDays / wins.Count, 1);
    }

    public static IReadOnlyList<AdminBarkRequestDto> BuildBarkRequests(IReadOnlyList<LeadDocument> leads)
    {
        var now = DateTime.UtcNow;
        return leads
            .Where(l => l.Source.Contains("bark", StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(l => l.CreatedAt)
            .Take(5)
            .Select(l =>
            {
                var minutes = DateTime.TryParse(l.CreatedAt, out var created)
                    ? Math.Max(1, (int)(now - created).TotalMinutes)
                    : 0;
                return new AdminBarkRequestDto(
                    l.Id,
                    l.CustomerName,
                    l.City,
                    minutes,
                    l.Urgency,
                    FormatLeadStatusLabel(l.Status));
            })
            .ToList();
    }

    public static IReadOnlyList<string> BuildAiSummary(
        IReadOnlyList<LeadDocument> leads,
        int todayJobCount,
        decimal revenueMtd,
        int openLeads)
    {
        var urgent = leads.Count(l =>
            l.Urgency == "urgent" && l.Status is not ("converted" or "lost"));
        var inviteReady = leads.Count(l =>
            l.Status is "interested" or "quote_sent" && string.IsNullOrWhiteSpace(l.InviteCode));

        return
        [
            urgent > 0
                ? $"{urgent} urgent lead{(urgent == 1 ? "" : "s")} need immediate follow-up."
                : "No urgent leads — inbox is under control.",
            todayJobCount > 0
                ? $"{todayJobCount} job{(todayJobCount == 1 ? "" : "s")} scheduled today across all technicians."
                : "No jobs on today's schedule.",
            revenueMtd > 0
                ? $"R{revenueMtd:N0} collected this month from {openLeads} open pipeline lead{(openLeads == 1 ? "" : "s")}."
                : inviteReady > 0
                    ? $"Send platform invites to {inviteReady} ready lead{(inviteReady == 1 ? "" : "s")}."
                    : $"{openLeads} open lead{(openLeads == 1 ? "" : "s")} in the pipeline.",
        ];
    }

    private static decimal SumPaid(IReadOnlyList<PaymentDocument> payments, string monthPrefix) =>
        payments
            .Where(p => p.Status == "paid" && p.Date.StartsWith(monthPrefix, StringComparison.Ordinal))
            .Sum(p => p.Amount);

    private static int CountInRange(
        IReadOnlyList<LeadDocument> leads,
        DateOnly from,
        DateOnly to,
        Func<LeadDocument, bool> predicate)
    {
        return leads.Count(l =>
        {
            if (!predicate(l)) return false;
            if (!DateOnly.TryParse(l.CreatedAt.AsSpan(0, Math.Min(10, l.CreatedAt.Length)), out var d))
                return false;
            return d >= from && d < to;
        });
    }

    internal static string FormatCountTrendPublic(int current, int previous, string label) =>
        FormatCountTrend(current, previous, label);

    private static string FormatCountTrend(int current, int previous, string label)
    {
        if (previous == 0)
            return current == 0 ? "—" : $"Up from 0 {label}";
        var delta = current - previous;
        if (delta == 0) return $"Same as {label}";
        return delta > 0 ? $"+{delta} vs {label}" : $"{delta} vs {label}";
    }

    private static string FormatRevenueTrend(decimal current, decimal previous)
    {
        if (previous == 0)
            return current == 0 ? "—" : "New this month";
        var pct = (double)((current - previous) / previous * 100);
        return pct >= 0 ? $"+{pct:0}% vs last month" : $"{pct:0}% vs last month";
    }

    private static int Pct(int part, int whole) =>
        whole == 0 ? 0 : (int)Math.Round(part * 100.0 / whole);

    private static string FormatLeadStatusLabel(string status) => status switch
    {
        "new" => "New",
        "contacted" => "Contacted",
        "quote_sent" => "Quote sent",
        "converted" => "Won",
        "lost" => "Lost",
        _ => status,
    };
}
