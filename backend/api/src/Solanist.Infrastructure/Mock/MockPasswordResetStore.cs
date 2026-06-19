namespace Solanist.Infrastructure.Mock;

internal static class MockPasswordResetStore
{
    private static readonly Dictionary<string, (string Email, DateTime ExpiresAt)> Tokens = new(StringComparer.Ordinal);

    public static string Issue(string email)
    {
        var token = Guid.NewGuid().ToString("N");
        Tokens[token] = (email.Trim().ToLowerInvariant(), DateTime.UtcNow.AddHours(1));
        return token;
    }

    public static bool TryConsume(string token, out string email)
    {
        email = "";
        if (!Tokens.TryGetValue(token.Trim(), out var entry))
            return false;

        if (entry.ExpiresAt < DateTime.UtcNow)
        {
            Tokens.Remove(token.Trim());
            return false;
        }

        email = entry.Email;
        Tokens.Remove(token.Trim());
        return true;
    }
}
