namespace Solanist.Application.Dtos;

public sealed record PaystackConfigDto(bool Enabled, string? PublicKey);

public sealed record PaystackInitializeRequestDto(string? PropertyId = null, string? PlanName = null);

public sealed record PaystackInitializeResponseDto(
    string AccessCode,
    string Reference,
    string PublicKey,
    string? PlanCode = null);

public sealed record PaystackVerifyRequestDto(string Reference);

public sealed record PaystackVerifyResponseDto(
    bool Success,
    string? PaymentMethod = null,
    string? SubscriptionStatus = null);

public sealed record PaystackSubscriptionActionResponseDto(bool Success, string? Message = null);
