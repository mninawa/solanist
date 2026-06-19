namespace Solanist.Application.Abstractions;

using Solanist.Application.Dtos;

public interface IAuthService
{
    Task<AuthSessionDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default);
    Task<GoogleAuthResultDto> GoogleLoginAsync(GoogleLoginRequestDto request, CancellationToken ct = default);
    AuthConfigDto GetAuthConfig();
    Task<SignupResultDto> SignupAsync(SignupRequestDto request, CancellationToken ct = default);
    Task<SignupResultDto> GoogleSignupAsync(GoogleSignupRequestDto request, CancellationToken ct = default);
    Task<SignupResultDto> GoogleSelfSignupAsync(GoogleSelfSignupRequestDto request, CancellationToken ct = default);
    Task<ForgotPasswordResultDto> RequestPasswordResetAsync(ForgotPasswordRequestDto request, CancellationToken ct = default);
    Task<ResetPasswordResultDto> ResetPasswordAsync(ResetPasswordRequestDto request, CancellationToken ct = default);
}

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    string? UserId { get; }
    string? Email { get; }
    string? Role { get; }
    string? CustomerId { get; }
    string? StaffId { get; }
    string RequireCustomerId();
    string? FirstName { get; }
    string? LastName { get; }
    string DisplayName { get; }
}

public interface ITokenService
{
    string CreateToken(AuthUserDto user);
}
