namespace Solanist.Infrastructure.Options;

public sealed class AuthOptions
{
    public const string SectionName = "Auth";

    public string SecretKey { get; set; } =
        "solanist-dev-secret-change-in-production-min-32-chars!!";

    public string Issuer { get; set; } = "solanist";

    public string Audience { get; set; } = "solanist-portal";

    public int ExpiryHours { get; set; } = 72;

    /// <summary>Public app URL used to build password reset links (e.g. http://localhost:8080).</summary>
    public string AppBaseUrl { get; set; } = "http://localhost:8080";

    /// <summary>When true, forgot-password responses include DevResetUrl for local/demo testing.</summary>
    public bool ExposeResetLinks { get; set; } = true;

    /// <summary>Google OAuth client ID (Web) for Sign in with Google.</summary>
    public string? GoogleClientId { get; set; }

    /// <summary>Allow mock:idToken values for automated tests (never enable in production).</summary>
    public bool AllowMockGoogleLogin { get; set; }

    /// <summary>When true, password sign-in is disabled and only Google SSO is allowed (requires GoogleClientId).</summary>
    public bool DisablePasswordLogin { get; set; }

    /// <summary>
    /// When true, customers can create an account without an invite via self-service signup.
    /// Off by default so invites remain the production funnel; flip on for testing/demos.
    /// </summary>
    public bool AllowSelfSignup { get; set; }

    /// <summary>True only when password login is explicitly disabled AND Google is configured.</summary>
    public bool GoogleOnly => DisablePasswordLogin && !string.IsNullOrWhiteSpace(GoogleClientId);
}
