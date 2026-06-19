using Solanist.Application.Dtos;

namespace Solanist.Application.Abstractions;

public interface IPaystackBillingService
{
    bool IsEnabled { get; }

    PaystackConfigDto GetConfig();

    Task<PaystackInitializeResponseDto> InitializeSubscriptionAsync(
        string customerId,
        string email,
        string firstName,
        string lastName,
        PaystackInitializeRequestDto request,
        CancellationToken ct = default);

    Task<PaystackVerifyResponseDto> VerifyTransactionAsync(
        string customerId,
        string reference,
        CancellationToken ct = default);

    Task<PaystackSubscriptionActionResponseDto> CancelSubscriptionAsync(
        string customerId,
        CancellationToken ct = default);

    Task HandleWebhookAsync(string rawBody, string? signature, CancellationToken ct = default);
}
