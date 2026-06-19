namespace Solanist.Infrastructure.Options;

public sealed class S3Options
{
    public const string SectionName = "S3";

    public string BucketName { get; set; } = "solanist";

    public string Region { get; set; } = "af-south-1";

    public string? AccessKeyId { get; set; }

    public string? SecretAccessKey { get; set; }

    /// <summary>Optional CDN/base URL (e.g. CloudFront). Trailing slash stripped.</summary>
    public string? PublicBaseUrl { get; set; }

    /// <summary>When true, returned URLs assume bucket policy allows public reads (object ACLs are not used).</summary>
    public bool PublicRead { get; set; } = true;

    public static bool HasAwsCredentials(S3Options options) =>
        (!string.IsNullOrWhiteSpace(options.AccessKeyId) &&
         !string.IsNullOrWhiteSpace(options.SecretAccessKey)) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID")) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AWS_PROFILE")) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AWS_ROLE_ARN")) ||
        !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("AWS_WEB_IDENTITY_TOKEN_FILE"));
}
