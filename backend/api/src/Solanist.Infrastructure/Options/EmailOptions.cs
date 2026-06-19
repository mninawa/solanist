namespace Solanist.Infrastructure.Options;

public sealed class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>Postmark server API token (Server → API tokens).</summary>
    public string PostmarkServerToken { get; set; } = "";

    public string FromAddress { get; set; } = "";

    public string FromName { get; set; } = "Solanist Solar Care";

    /// <summary>Postmark message stream (default outbound).</summary>
    public string MessageStream { get; set; } = "outbound";

    public bool IsEnabled =>
        !string.IsNullOrWhiteSpace(PostmarkServerToken) &&
        !string.IsNullOrWhiteSpace(FromAddress);
}
