using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.WhatsApp;

public sealed class WasenderWhatsAppService(
    HttpClient http,
    IOptions<WhatsAppOptions> options,
    ILogger<WasenderWhatsAppService> logger) : IWhatsAppService
{
    private readonly WhatsAppOptions _options = options.Value;

    public bool IsEnabled => _options.IsEnabled;

    public Task<bool> SendInviteAsync(
        string toPhone,
        string customerFirstName,
        string inviteUrl,
        string offerName,
        DateTime expiresAt,
        CancellationToken ct = default)
    {
        var text = InviteMessageBuilder.Build(customerFirstName, inviteUrl, offerName, expiresAt);
        return SendTextAsync(toPhone, text, ct);
    }

    public async Task<bool> SendTextAsync(string toPhone, string text, CancellationToken ct = default)
    {
        if (!_options.IsEnabled)
            return false;

        var normalized = PhoneNumberNormalizer.Normalize(toPhone, _options.DefaultCountryCode);
        if (normalized is null)
        {
            logger.LogWarning("Invalid WhatsApp phone number: {Phone}", toPhone);
            return false;
        }

        using var request = new HttpRequestMessage(HttpMethod.Post, "send-message");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        request.Content = JsonContent.Create(new { to = normalized, text });

        using var response = await http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "WasenderAPI send failed for {Phone}: {Status} {Body}",
                normalized,
                response.StatusCode,
                body);
            return false;
        }

        var parsed = System.Text.Json.JsonSerializer.Deserialize<WasenderSendResponse>(body);
        if (parsed?.Success == false)
        {
            logger.LogWarning("WasenderAPI rejected message to {Phone}: {Body}", normalized, body);
            return false;
        }

        logger.LogInformation("WhatsApp message sent to {Phone}", normalized);
        return true;
    }
}

internal sealed class WasenderSendResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }
}
