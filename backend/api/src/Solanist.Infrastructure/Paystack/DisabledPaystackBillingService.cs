using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;

namespace Solanist.Infrastructure.Paystack;

public sealed class DisabledPaystackBillingService : IPaystackBillingService
{
    public bool IsEnabled => false;

    public PaystackConfigDto GetConfig() => new(false, null);

    public Task<PaystackInitializeResponseDto> InitializeSubscriptionAsync(
        string customerId,
        string email,
        string firstName,
        string lastName,
        PaystackInitializeRequestDto request,
        CancellationToken ct = default) =>
        throw new InvalidOperationException("paystack_not_configured");

    public Task<PaystackVerifyResponseDto> VerifyTransactionAsync(
        string customerId,
        string reference,
        CancellationToken ct = default) =>
        throw new InvalidOperationException("paystack_not_configured");

    public Task<PaystackSubscriptionActionResponseDto> CancelSubscriptionAsync(
        string customerId,
        CancellationToken ct = default) =>
        throw new InvalidOperationException("paystack_not_configured");

    public Task HandleWebhookAsync(string rawBody, string? signature, CancellationToken ct = default) =>
        Task.CompletedTask;
}
