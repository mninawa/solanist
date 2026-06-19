using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Paystack;

internal sealed class PaystackApiClient(HttpClient http, IOptions<PaystackOptions> options, ILogger<PaystackApiClient> logger)
{
    private readonly PaystackOptions _options = options.Value;

    public async Task<(PaystackInitializeData? Data, string? Error)> InitializeTransactionAsync(
        string email,
        int amountCents,
        string reference,
        string? planCode,
        Dictionary<string, string> metadata,
        CancellationToken ct)
    {
        var body = new Dictionary<string, object?>
        {
            ["email"] = email,
            ["amount"] = amountCents,
            ["reference"] = reference,
            ["currency"] = "ZAR",
            ["metadata"] = metadata,
        };

        if (!string.IsNullOrWhiteSpace(planCode))
            body["plan"] = planCode;

        if (!string.IsNullOrWhiteSpace(_options.CallbackUrl))
            body["callback_url"] = _options.CallbackUrl;

        return await PostForDataAsync<PaystackInitializeData>("/transaction/initialize", body, ct);
    }

    public async Task<(PaystackVerifyData? Data, string? Error)> VerifyTransactionAsync(string reference, CancellationToken ct)
    {
        return await GetForDataAsync<PaystackVerifyData>($"/transaction/verify/{Uri.EscapeDataString(reference)}", ct);
    }

    public async Task<bool> DisableSubscriptionAsync(string subscriptionCode, string emailToken, CancellationToken ct)
    {
        var envelope = await PostAsync<object>("/subscription/disable",
            new { code = subscriptionCode, token = emailToken }, ct);
        return envelope?.Status == true;
    }

    public async Task<(PaystackCreatedPlanData? Plan, string? Error)> CreatePlanAsync(
        string name,
        string interval,
        int amountCents,
        CancellationToken ct)
    {
        return await PostForDataAsync<PaystackCreatedPlanData>("/plan", new
        {
            name,
            interval,
            amount = amountCents,
            currency = "ZAR",
        }, ct);
    }

    private async Task<(T? Data, string? Error)> GetForDataAsync<T>(string path, CancellationToken ct)
    {
        using var request = CreateRequest(HttpMethod.Get, path);
        using var response = await http.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Paystack GET {Path} failed: {Status} {Body}", path, response.StatusCode, json);
            return (default, ParseHttpError(response.StatusCode, json));
        }

        return UnwrapEnvelope<T>(path, json);
    }

    private async Task<(T? Data, string? Error)> PostForDataAsync<T>(string path, object body, CancellationToken ct)
    {
        using var request = CreateRequest(HttpMethod.Post, path);
        request.Content = JsonContent.Create(body);
        using var response = await http.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Paystack POST {Path} failed: {Status} {Body}", path, response.StatusCode, json);
            return (default, ParseHttpError(response.StatusCode, json));
        }

        return UnwrapEnvelope<T>(path, json);
    }

    private static string ParseHttpError(System.Net.HttpStatusCode statusCode, string json)
    {
        var message = TryParseEnvelopeMessage(json);
        return message ?? $"Paystack HTTP {(int)statusCode}";
    }

    private static string? TryParseEnvelopeMessage(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            var envelope = JsonSerializer.Deserialize<PaystackEnvelope<JsonElement>>(json, JsonOptions);
            return string.IsNullOrWhiteSpace(envelope?.Message) ? null : envelope.Message.Trim();
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private (T? Data, string? Error) UnwrapEnvelope<T>(string path, string json)
    {
        PaystackEnvelope<T>? envelope;
        try
        {
            envelope = JsonSerializer.Deserialize<PaystackEnvelope<T>>(json, JsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogWarning(ex, "Paystack {Path} returned invalid JSON: {Body}", path, json);
            return (default, "Invalid Paystack response");
        }

        if (envelope is not { Status: true, Data: not null })
        {
            logger.LogWarning("Paystack {Path} rejected: {Message} {Body}", path, envelope?.Message, json);
            return (default, envelope?.Message ?? "Paystack request failed");
        }

        return (envelope.Data, null);
    }

    private async Task<PaystackEnvelope<T>?> PostAsync<T>(string path, object body, CancellationToken ct)
    {
        using var request = CreateRequest(HttpMethod.Post, path);
        request.Content = JsonContent.Create(body);
        using var response = await http.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("Paystack POST {Path} failed: {Status} {Body}", path, response.StatusCode, json);
            return null;
        }

        return JsonSerializer.Deserialize<PaystackEnvelope<T>>(json, JsonOptions);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.SecretKey);
        return request;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };
}

internal sealed class PaystackEnvelope<T>
{
    public bool Status { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
}

internal sealed class PaystackInitializeData
{
    public string? AuthorizationUrl { get; set; }
    public string? AccessCode { get; set; }
    public string? Reference { get; set; }
}

internal sealed class PaystackVerifyData
{
    public string? Status { get; set; }
    public string? Reference { get; set; }
    public int Amount { get; set; }
    public PaystackCustomerData? Customer { get; set; }
    public PaystackAuthorizationData? Authorization { get; set; }
    public PaystackPlanData? Plan { get; set; }
    public JsonElement Metadata { get; set; }
}

internal sealed class PaystackCustomerData
{
    public string? CustomerCode { get; set; }
    public string? Email { get; set; }
}

internal sealed class PaystackAuthorizationData
{
    public string? AuthorizationCode { get; set; }
    public string? CardType { get; set; }
    public string? Last4 { get; set; }
    public string? Brand { get; set; }
    public string? Bank { get; set; }
    public string? Channel { get; set; }
}

internal sealed class PaystackPlanData
{
    public string? PlanCode { get; set; }
    public string? Name { get; set; }
}

internal sealed class PaystackCreatedPlanData
{
    public string? PlanCode { get; set; }
    public string? Name { get; set; }
    public string? Interval { get; set; }
    public int Amount { get; set; }
}

internal sealed class PaystackWebhookEvent
{
    public string? Event { get; set; }
    public JsonElement Data { get; set; }
}
