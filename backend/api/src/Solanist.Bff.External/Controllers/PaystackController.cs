using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Bff.Shared;

namespace Solanist.Bff.External.Controllers;

[Authorize(Roles = "client")]
[Route("api/v1/client/paystack")]
public sealed class PaystackController(
    IPaystackBillingService paystack,
    IClientService client,
    ICurrentUser currentUser) : ApiControllerBase
{
    [HttpGet("config")]
    public ActionResult<ApiResponse<PaystackConfigDto>> GetConfig() =>
        OkData(paystack.GetConfig());

    [HttpPost("initialize")]
    public async Task<ActionResult<ApiResponse<PaystackInitializeResponseDto>>> Initialize(
        [FromBody] PaystackInitializeRequestDto request,
        CancellationToken ct)
    {
        if (!paystack.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<PaystackInitializeResponseDto?>.Fail("paystack_not_configured"));

        try
        {
            var customerId = currentUser.RequireCustomerId();
            var profile = await client.GetProfileAsync(ct);
            var email = !string.IsNullOrWhiteSpace(profile.Email)
                ? profile.Email.Trim()
                : currentUser.Email?.Trim() ?? "";
            var result = await paystack.InitializeSubscriptionAsync(
                customerId,
                email,
                profile.FirstName,
                profile.LastName,
                request,
                ct);
            return OkData(result);
        }
        catch (InvalidOperationException ex)
        {
            var message = ex.Message;
            if (message.Contains("no linked customer", StringComparison.OrdinalIgnoreCase))
                message = "customer_not_linked";
            return MapPaystackFailure<PaystackInitializeResponseDto>(message);
        }
    }

    [HttpPost("verify")]
    public async Task<ActionResult<ApiResponse<PaystackVerifyResponseDto>>> Verify(
        [FromBody] PaystackVerifyRequestDto request,
        CancellationToken ct)
    {
        if (!paystack.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<PaystackVerifyResponseDto?>.Fail("paystack_not_configured"));

        var result = await paystack.VerifyTransactionAsync(currentUser.CustomerId ?? "", request.Reference, ct);
        return OkData(result);
    }

    [HttpPost("cancel")]
    public async Task<ActionResult<ApiResponse<PaystackSubscriptionActionResponseDto>>> Cancel(CancellationToken ct)
    {
        if (!paystack.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<PaystackSubscriptionActionResponseDto?>.Fail("paystack_not_configured"));

        var result = await paystack.CancelSubscriptionAsync(currentUser.CustomerId ?? "", ct);
        return OkData(result);
    }

    private ActionResult<ApiResponse<T?>> MapPaystackFailure<T>(string message)
    {
        if (message.StartsWith("paystack_initialize_failed:", StringComparison.Ordinal))
            return StatusCode(StatusCodes.Status502BadGateway, ApiResponse<T?>.Fail(message));

        if (message is "customer_not_linked" or "email_required" or "invalid_email" or "subscription_not_found")
            return BadRequest(ApiResponse<T?>.Fail(message));

        return BadRequest(ApiResponse<T?>.Fail(message));
    }
}
