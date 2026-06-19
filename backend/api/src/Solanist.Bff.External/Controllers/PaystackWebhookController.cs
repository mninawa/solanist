using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Solanist.Application.Abstractions;

namespace Solanist.Bff.External.Controllers;

[Route("api/v1/webhooks/paystack")]
public sealed class PaystackWebhookController(IPaystackBillingService paystack) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> Handle(CancellationToken ct)
    {
        if (!paystack.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable);

        using var reader = new StreamReader(Request.Body);
        var rawBody = await reader.ReadToEndAsync(ct);
        var signature = Request.Headers["x-paystack-signature"].FirstOrDefault();

        try
        {
            await paystack.HandleWebhookAsync(rawBody, signature, ct);
            return Ok();
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized();
        }
    }
}
