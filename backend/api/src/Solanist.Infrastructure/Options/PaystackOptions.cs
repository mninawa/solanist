namespace Solanist.Infrastructure.Options;

public sealed class PaystackOptions
{
    public const string SectionName = "Paystack";

    public string SecretKey { get; set; } = "";

    public string PublicKey { get; set; } = "";

    /// <summary>Paystack plan_code per Solanist plan name or plan id (e.g. "Quarterly Solar Care" → PLN_xxx).</summary>
    public Dictionary<string, string> Plans { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Quarterly Solar Care"] = "",
        ["plan-quarterly"] = "",
        ["plan-plus"] = "",
        ["Once-off Clean"] = "",
        ["plan-once"] = "",
        ["Bi-Annual Care"] = "",
        ["plan-biannual"] = "",
        ["Basic Clean"] = "",
        ["plan-basic"] = "",
        ["Premium Care"] = "",
        ["plan-premium"] = "",
    };

    public string? CallbackUrl { get; set; }

    public bool IsEnabled => !string.IsNullOrWhiteSpace(SecretKey) && !string.IsNullOrWhiteSpace(PublicKey);

    public string? ResolvePlanCode(string? planKey)
    {
        if (string.IsNullOrWhiteSpace(planKey)) return null;
        return Plans.TryGetValue(planKey, out var code) && !string.IsNullOrWhiteSpace(code) ? code : null;
    }
}
