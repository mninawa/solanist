namespace Solanist.Infrastructure.Auth;

internal static class AuthPortal
{
    public static bool MatchesRole(string userRole, string? portal)
    {
        if (string.IsNullOrWhiteSpace(portal))
            return true;

        return string.Equals(userRole, portal.Trim(), StringComparison.OrdinalIgnoreCase);
    }
}
