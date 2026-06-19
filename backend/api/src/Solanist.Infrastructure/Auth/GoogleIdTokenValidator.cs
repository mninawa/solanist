using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Auth;

public sealed record GoogleTokenPayload(string Subject, string Email, string? FirstName, string? LastName);

public interface IGoogleIdTokenValidator
{
    Task<GoogleTokenPayload?> ValidateAsync(string idToken, CancellationToken ct = default);
}

public sealed class GoogleIdTokenValidator(IOptions<AuthOptions> options) : IGoogleIdTokenValidator
{
    private readonly AuthOptions _options = options.Value;

    public async Task<GoogleTokenPayload?> ValidateAsync(string idToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_options.GoogleClientId))
            return null;

        if (string.IsNullOrWhiteSpace(idToken))
            return null;

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [_options.GoogleClientId],
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
                return null;

            return new GoogleTokenPayload(
                payload.Subject,
                payload.Email.Trim().ToLowerInvariant(),
                payload.GivenName,
                payload.FamilyName);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}

public sealed class DisabledGoogleIdTokenValidator : IGoogleIdTokenValidator
{
    public Task<GoogleTokenPayload?> ValidateAsync(string idToken, CancellationToken ct = default) =>
        Task.FromResult<GoogleTokenPayload?>(null);
}
