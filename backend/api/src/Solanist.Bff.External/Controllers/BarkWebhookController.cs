using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Bff.Shared;
using Solanist.Infrastructure.Options;

namespace Solanist.Bff.External.Controllers;

[Route("api/v1/webhooks/bark")]
public sealed class BarkWebhookController(
    IAdminService admin,
    IOptions<WebhookOptions> webhookOptions) : ApiControllerBase
{
    [AllowAnonymous]
    [HttpPost("leads")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto>>> CreateLead(
        [FromBody] CreateLeadRequestDto request,
        [FromHeader(Name = "X-Webhook-Secret")] string? secret,
        CancellationToken ct)
    {
        var expected = webhookOptions.Value.BarkSecret;
        if (string.IsNullOrWhiteSpace(expected) ||
            !string.Equals(secret, expected, StringComparison.Ordinal))
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.CustomerName) ||
            string.IsNullOrWhiteSpace(request.RequestSnippet))
            return BadRequest();

        var lead = await admin.CreateLeadAsync(request with { Source = "bark_email" }, ct);
        return OkData(lead, "Lead captured from Bark.");
    }
}
