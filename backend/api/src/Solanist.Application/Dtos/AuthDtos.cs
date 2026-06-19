namespace Solanist.Application.Dtos;

public sealed record LoginRequestDto(string Email, string Password);

public sealed record SignupRequestDto(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string? Phone,
    string InviteCode,
    string? SelectedPlanId,
    string? PreferredServiceDate,
    string? PreferredTimeSlot,
    int? PanelCount,
    string? RoofType,
    string? AccessNotes);

public sealed record SignupResultDto(AuthSessionDto? Session, string? ErrorCode);

public sealed record AuthUserDto(
    string Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string? Phone,
    string? CustomerId = null,
    string? StaffId = null);

public sealed record AuthSessionDto(AuthUserDto User, string Token);

public sealed record ForgotPasswordRequestDto(string Email);

public sealed record ForgotPasswordResultDto(bool Accepted, string? DevResetUrl = null);

public sealed record ResetPasswordRequestDto(string Token, string NewPassword, string ConfirmPassword);

public sealed record ResetPasswordResultDto(bool Success, string? ErrorCode = null);

public sealed record GoogleLoginRequestDto(string IdToken, string? Portal = null);

public sealed record GoogleAuthResultDto(AuthSessionDto? Session, string? ErrorCode);

public sealed record GoogleSignupRequestDto(
    string IdToken,
    string FirstName,
    string LastName,
    string? Phone,
    string InviteCode,
    string? SelectedPlanId,
    string? PreferredServiceDate,
    string? PreferredTimeSlot,
    int? PanelCount,
    string? RoofType,
    string? AccessNotes);

public sealed record GoogleSelfSignupRequestDto(
    string IdToken,
    string FirstName,
    string LastName,
    string? Phone,
    string Address,
    string City,
    string? Postcode,
    string? SelectedPlanId,
    string? PreferredServiceDate,
    string? PreferredTimeSlot,
    int? PanelCount,
    string? RoofType,
    string? AccessNotes);

public sealed record AuthConfigDto(
    bool GoogleEnabled,
    string? GoogleClientId,
    bool GoogleOnly,
    bool AllowSelfSignup);
