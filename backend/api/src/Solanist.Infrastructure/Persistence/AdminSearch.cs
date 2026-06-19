using System.Text.RegularExpressions;
using MongoDB.Bson;
using MongoDB.Driver;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminSearch
{
    private const int MaxHits = 10;

    public static async Task<AdminSearchResultDto> SearchLeadsAndCustomersAsync(
        IMongoCollection<LeadDocument> leads,
        IMongoCollection<CustomerDocument> customers,
        IMongoCollection<PropertyDocument> properties,
        string query,
        CancellationToken ct)
    {
        var term = query.Trim();
        if (term.Length == 0)
            return new AdminSearchResultDto(query, []);

        var re = new BsonRegularExpression(Regex.Escape(term), "i");
        var leadBuilder = Builders<LeadDocument>.Filter;
        var leadFilter = leadBuilder.Or(
            leadBuilder.Regex(l => l.CustomerName, re),
            leadBuilder.Regex(l => l.CustomerEmail, re),
            leadBuilder.Regex(l => l.CustomerPhone, re),
            leadBuilder.Regex(l => l.City, re),
            leadBuilder.Regex(l => l.PropertyAddress, re),
            leadBuilder.Regex(l => l.Postcode, re),
            leadBuilder.Regex(l => l.RequestSnippet, re));

        var customerBuilder = Builders<CustomerDocument>.Filter;
        var customerFilter = customerBuilder.Or(
            customerBuilder.Regex(c => c.FirstName, re),
            customerBuilder.Regex(c => c.LastName, re),
            customerBuilder.Regex(c => c.Email, re),
            customerBuilder.Regex(c => c.Phone, re));

        var leadDocs = await leads.Find(leadFilter)
            .SortByDescending(l => l.CreatedAt)
            .Limit(MaxHits)
            .ToListAsync(ct);

        var customerDocs = await customers.Find(customerFilter)
            .Limit(MaxHits)
            .ToListAsync(ct);

        var propertyMap = await LoadPrimaryAddressesAsync(properties, customerDocs, ct);

        var hits = new List<AdminSearchHitDto>();
        hits.AddRange(leadDocs.Select(l => new AdminSearchHitDto(
            l.Id,
            "lead",
            l.CustomerName,
            $"{l.City} · {l.Status}")));

        foreach (var customer in customerDocs)
        {
            if (hits.Any(h =>
                    h.Type == "lead"
                    && leadDocs.Any(l =>
                        l.Id == h.Id
                        && l.CustomerEmail.Equals(customer.Email, StringComparison.OrdinalIgnoreCase))))
                continue;

            var name = $"{customer.FirstName} {customer.LastName}".Trim();
            hits.Add(new AdminSearchHitDto(
                customer.Id,
                "customer",
                name,
                $"{customer.Email} · {propertyMap.GetValueOrDefault(customer.Id, "Customer")}"));
        }

        return new AdminSearchResultDto(term, hits.Take(MaxHits).ToList());
    }

    public static AdminSearchResultDto SearchMock(
        IEnumerable<LeadDocument> leads,
        IEnumerable<AdminCustomerDto> customers,
        string query)
    {
        var term = query.Trim();
        if (term.Length == 0)
            return new AdminSearchResultDto(query, []);

        var leadHits = leads
            .Where(l => Matches(term, l.CustomerName, l.CustomerEmail, l.CustomerPhone, l.City, l.PropertyAddress, l.Postcode, l.RequestSnippet))
            .Take(MaxHits)
            .Select(l => new AdminSearchHitDto(l.Id, "lead", l.CustomerName, $"{l.City} · {l.Status}"))
            .ToList();

        var customerHits = customers
            .Where(c => Matches(term, c.Name, c.Email, c.Phone, c.PrimaryAddress))
            .Take(MaxHits)
            .Select(c => new AdminSearchHitDto(c.Id, "customer", c.Name, $"{c.Email} · {c.PrimaryAddress}"))
            .ToList();

        return new AdminSearchResultDto(term, leadHits.Concat(customerHits).Take(MaxHits).ToList());
    }

    private static async Task<Dictionary<string, string>> LoadPrimaryAddressesAsync(
        IMongoCollection<PropertyDocument> properties,
        IReadOnlyList<CustomerDocument> customers,
        CancellationToken ct)
    {
        if (customers.Count == 0)
            return [];

        var ids = customers.Select(c => c.Id).ToList();
        var props = await properties
            .Find(p => ids.Contains(p.CustomerId))
            .ToListAsync(ct);

        return props
            .GroupBy(p => p.CustomerId)
            .ToDictionary(g => g.Key, g => g.First().Address);
    }

    private static bool Matches(string term, params string?[] values) =>
        values.Any(v => v?.Contains(term, StringComparison.OrdinalIgnoreCase) == true);
}
