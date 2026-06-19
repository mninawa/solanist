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

        var profile = await client.GetProfileAsync(ct);
        var result = await paystack.InitializeSubscriptionAsync(
            currentUser.CustomerId ?? "",
            profile.Email,
            profile.FirstName,
            profile.LastName,
            request,
            ct);
        return OkData(result);
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
}
