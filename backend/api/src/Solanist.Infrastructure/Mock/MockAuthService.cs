using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Auth;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Mock;

public sealed class MockAuthService(
    ITokenService tokenService,
    IOptions<AuthOptions> authOptions,
    IEmailService emailService) : IAuthService
{
    private readonly AuthOptions _auth = authOptions.Value;
    private static readonly IReadOnlyList<AuthUserDto> DemoUsers = [
        new("user-001", "nicolette.botha@email.com", "Nicolette", "Botha", "client", "082 123 4567", "cust-001"),
        new("user-staff-001", "james.staff@solanist.co.za", "James", "Mitchell", "staff", "082 987 6543", null, "staff-001"),
        new("user-admin-001", "admin@solanist.co.za", "Sarah", "Nkosi", "admin", null),
        new("user-super-admin-001", "mninawa@gmail.com", "Mninawa", "Admin", "admin", null),
    ];

    public Task<AuthSessionDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        if (_auth.GoogleOnly)
            return Task.FromResult<AuthSessionDto?>(null);

        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            return Task.FromResult<AuthSessionDto?>(null);

        var user = DemoUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase));
        if (user is null)
            user = ResolveFallbackUser(email);

        if (user is null)
            return Task.FromResult<AuthSessionDto?>(null);

        return Task.FromResult(new AuthSessionDto(user, tokenService.CreateToken(user)));
    }

    public AuthConfigDto GetAuthConfig() =>
        new(
            !string.IsNullOrWhiteSpace(_auth.GoogleClientId),
            string.IsNullOrWhiteSpace(_auth.GoogleClientId) ? null : _auth.GoogleClientId,
            _auth.GoogleOnly,
            _auth.AllowSelfSignup);

    public Task<GoogleAuthResultDto> GoogleLoginAsync(GoogleLoginRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_auth.GoogleClientId))
            return Task.FromResult(new GoogleAuthResultDto(null, "google_not_configured"));

        var token = request.IdToken?.Trim() ?? "";
        if (token.StartsWith("mock:", StringComparison.OrdinalIgnoreCase))
        {
            if (!_auth.AllowMockGoogleLogin)
                return Task.FromResult(new GoogleAuthResultDto(null, "invalid_token"));

            var email = token["mock:".Length..].Trim().ToLowerInvariant();
            var user = DemoUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
                ?? ResolveFallbackUser(email);
            if (user is null)
                return Task.FromResult(new GoogleAuthResultDto(null, "account_not_found"));

            if (!AuthPortal.MatchesRole(user.Role, request.Portal))
                return Task.FromResult(new GoogleAuthResultDto(null, "role_mismatch"));

            return Task.FromResult(new GoogleAuthResultDto(
                new AuthSessionDto(user, tokenService.CreateToken(user)),
                null));
        }

        return Task.FromResult(new GoogleAuthResultDto(null, "invalid_token"));
    }

    public Task<SignupResultDto> SignupAsync(SignupRequestDto request, CancellationToken ct = default)
    {
        if (_auth.GoogleOnly)
            return Task.FromResult(new SignupResultDto(null, "password_disabled"));
        var email = request.Email.Trim().ToLowerInvariant();
        var user = new AuthUserDto(
            $"user-{Guid.NewGuid():N}".Substring(0, 12),
            email,
            request.FirstName,
            request.LastName,
            "client",
            request.Phone,
            "cust-001");
        var session = new AuthSessionDto(user, tokenService.CreateToken(user));
        return Task.FromResult(new SignupResultDto(session, null));
    }

    public Task<SignupResultDto> GoogleSignupAsync(GoogleSignupRequestDto request, CancellationToken ct = default)
    {
        if (request.IdToken.StartsWith("mock:", StringComparison.OrdinalIgnoreCase))
        {
            var email = request.IdToken["mock:".Length..].Trim().ToLowerInvariant();
            return SignupAsync(
                new SignupRequestDto(
                    email,
                    "google-signup",
                    request.FirstName,
                    request.LastName,
                    request.Phone,
                    request.InviteCode,
                    request.SelectedPlanId,
                    request.PreferredServiceDate,
                    request.PreferredTimeSlot,
                    request.PanelCount,
                    request.RoofType,
                    request.AccessNotes),
                ct);
        }

        return Task.FromResult(new SignupResultDto(null, "invalid_token"));
    }

    public Task<SignupResultDto> GoogleSelfSignupAsync(GoogleSelfSignupRequestDto request, CancellationToken ct = default)
    {
        if (!_auth.AllowSelfSignup)
            return Task.FromResult(new SignupResultDto(null, "signup_disabled"));

        if (!request.IdToken.StartsWith("mock:", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(new SignupResultDto(null, "invalid_token"));

        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.City))
            return Task.FromResult(new SignupResultDto(null, "invalid_request"));

        var email = request.IdToken["mock:".Length..].Trim().ToLowerInvariant();
        var user = new AuthUserDto(
            $"user-{Guid.NewGuid():N}".Substring(0, 12),
            email,
            request.FirstName,
            request.LastName,
            "client",
            request.Phone,
            "cust-001");
        var session = new AuthSessionDto(user, tokenService.CreateToken(user));
        return Task.FromResult(new SignupResultDto(session, null));
    }

    public async Task<ForgotPasswordResultDto> RequestPasswordResetAsync(
        ForgotPasswordRequestDto request,
        CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return new ForgotPasswordResultDto(true);

        var user = DemoUsers.FirstOrDefault(u => u.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
            ?? (email.Contains("admin") || email.Contains("staff") ? ResolveFallbackUser(email) : null);

        if (user is null)
            return new ForgotPasswordResultDto(true);

        var token = MockPasswordResetStore.Issue(email);
        var resetUrl = $"{_auth.AppBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(token)}";
        var sent = await emailService.SendPasswordResetAsync(email, resetUrl, user.FirstName, ct);
        var devUrl = _auth.ExposeResetLinks && !sent ? resetUrl : null;
        return new ForgotPasswordResultDto(true, devUrl);
    }

    public Task<ResetPasswordResultDto> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return Task.FromResult(new ResetPasswordResultDto(false, "invalid_token"));

        if (string.IsNullOrWhiteSpace(request.NewPassword) || string.IsNullOrWhiteSpace(request.ConfirmPassword))
            return Task.FromResult(new ResetPasswordResultDto(false, "invalid_request"));

        if (request.NewPassword.Length < 8)
            return Task.FromResult(new ResetPasswordResultDto(false, "password_too_short"));

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            return Task.FromResult(new ResetPasswordResultDto(false, "password_mismatch"));

        if (!MockPasswordResetStore.TryConsume(request.Token, out _))
            return Task.FromResult(new ResetPasswordResultDto(false, "invalid_token"));

        return Task.FromResult(new ResetPasswordResultDto(true));
    }

    private static AuthUserDto? ResolveFallbackUser(string email)
    {
        if (email.Contains("admin"))
            return DemoUsers.First(u => u.Role == "admin");

        if (email.Contains("staff"))
            return DemoUsers.First(u => u.Role == "staff");

        var localPart = email.Split('@')[0];
        return new AuthUserDto(
            $"user-{Guid.NewGuid():N}".Substring(0, 12),
            email,
            localPart,
            "User",
            "client",
            null,
            "cust-001");
    }
}
