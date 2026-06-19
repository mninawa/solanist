using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Solanist.Application.Abstractions;

namespace Solanist.Infrastructure.Auth;

public sealed class CurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public string? UserId => ClaimValue(Principal, ClaimTypes.NameIdentifier)
        ?? ClaimValue(Principal, "sub");

    public string? Email => ClaimValue(Principal, ClaimTypes.Email)
        ?? ClaimValue(Principal, "email");

    public string? Role => ClaimValue(Principal, ClaimTypes.Role);

    public string? CustomerId => ClaimValue(Principal, "customer_id");

    public string? StaffId => ClaimValue(Principal, "staff_id");

    public string? FirstName => ClaimValue(Principal, ClaimTypes.GivenName)
        ?? ClaimValue(Principal, "given_name");

    public string? LastName => ClaimValue(Principal, ClaimTypes.Surname)
        ?? ClaimValue(Principal, "family_name");

    public string DisplayName
    {
        get
        {
            var name = $"{FirstName} {LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(name)) return name;
            if (!string.IsNullOrWhiteSpace(Email))
            {
                var local = Email.Split('@')[0];
                if (local.Contains('.'))
                {
                    var parts = local.Split('.');
                    return $"{Capitalize(parts[0])} {Capitalize(parts[1])}";
                }
                return Capitalize(local);
            }
            return "Solanist User";
        }
    }

    public string RequireCustomerId()
    {
        if (string.IsNullOrWhiteSpace(CustomerId))
            throw new InvalidOperationException("Authenticated user has no linked customer account.");
        return CustomerId;
    }

    private static string? ClaimValue(ClaimsPrincipal? principal, string type) =>
        principal?.FindFirst(type)?.Value;

    private static string Capitalize(string value) =>
        string.IsNullOrWhiteSpace(value)
            ? value
            : value.Length == 1
                ? value.ToUpperInvariant()
                : char.ToUpperInvariant(value[0]) + value[1..];
}
