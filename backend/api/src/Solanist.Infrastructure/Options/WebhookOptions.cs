namespace Solanist.Infrastructure.Options;

public sealed class WebhookOptions
{
    public const string SectionName = "Webhooks";

    public string BarkSecret { get; set; } = "demo-bark-secret";
}
