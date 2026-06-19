namespace Solanist.Infrastructure.Options;

public sealed class WhatsAppOptions
{
    public const string SectionName = "WhatsApp";

    /// <summary>WasenderAPI bearer token.</summary>
    public string ApiKey { get; set; } = "";

    public string BaseUrl { get; set; } = "https://www.wasenderapi.com/api/";

    /// <summary>Default country code when numbers start with 0 (South Africa).</summary>
    public string DefaultCountryCode { get; set; } = "27";

    public bool IsEnabled => !string.IsNullOrWhiteSpace(ApiKey);
}
