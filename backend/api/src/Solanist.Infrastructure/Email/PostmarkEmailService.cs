using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Email;

public sealed class PostmarkEmailService(
    HttpClient http,
    IOptions<EmailOptions> options,
    ILogger<PostmarkEmailService> logger) : IEmailService
{
    private readonly EmailOptions _options = options.Value;

    public bool IsEnabled => _options.IsEnabled;

    public async Task<bool> SendPasswordResetAsync(
        string toEmail,
        string resetUrl,
        string? firstName,
        CancellationToken ct = default)
    {
        if (!_options.IsEnabled)
            return false;

        var greeting = string.IsNullOrWhiteSpace(firstName) ? "Hi" : $"Hi {firstName}";
        var subject = "Reset your Solanist password";
        var textBody =
            $"{greeting},\n\n" +
            "We received a request to reset your Solanist portal password.\n\n" +
            $"Reset your password: {resetUrl}\n\n" +
            "This link expires in 1 hour. If you did not request this, you can ignore this email.\n\n" +
            "— Solanist Solar Care";

        var htmlBody =
            $"""
            <p>{greeting},</p>
            <p>We received a request to reset your Solanist portal password.</p>
            <p><a href="{resetUrl}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Reset password</a></p>
            <p style="font-size:14px;color:#666;">Or copy this link:<br><a href="{resetUrl}">{resetUrl}</a></p>
            <p style="font-size:14px;color:#666;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
            <p>— Solanist Solar Care</p>
            """;

        return await SendAsync(toEmail, subject, htmlBody, textBody, ct);
    }

    private async Task<bool> SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        string textBody,
        CancellationToken ct)
    {
        var from = string.IsNullOrWhiteSpace(_options.FromName)
            ? _options.FromAddress
            : $"{_options.FromName} <{_options.FromAddress}>";

        var payload = new
        {
            From = from,
            To = toEmail,
            Subject = subject,
            HtmlBody = htmlBody,
            TextBody = textBody,
            MessageStream = _options.MessageStream,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "email");
        request.Headers.Add("X-Postmark-Server-Token", _options.PostmarkServerToken);
        request.Content = JsonContent.Create(payload);

        using var response = await http.SendAsync(request, ct);
        var body = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Postmark send failed for {Email}: {Status} {Body}",
                toEmail,
                response.StatusCode,
                body);
            return false;
        }

        logger.LogInformation("Postmark email sent to {Email}", toEmail);
        return true;
    }
}

internal sealed class PostmarkSendResponse
{
    [JsonPropertyName("MessageID")]
    public string? MessageId { get; set; }

    [JsonPropertyName("ErrorCode")]
    public int ErrorCode { get; set; }

    [JsonPropertyName("Message")]
    public string? Message { get; set; }
}
