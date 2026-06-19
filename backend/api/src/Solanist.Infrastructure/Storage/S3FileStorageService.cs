using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Solanist.Application.Abstractions;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Storage;

public sealed class S3FileStorageService(IOptions<S3Options> options, ILogger<S3FileStorageService> logger)
    : IFileStorageService, IDisposable
{
    private readonly S3Options _options = options.Value;
    private readonly IAmazonS3 _client = CreateClient(options.Value);

    public bool IsEnabled => true;

    public async Task<bool> CheckHealthAsync(CancellationToken ct = default)
    {
        try
        {
            await _client.GetBucketLocationAsync(_options.BucketName, ct);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "S3 health check failed for bucket {Bucket}", _options.BucketName);
            return false;
        }
    }

    public async Task<IReadOnlyList<string>> UploadAsync(
        IReadOnlyList<FileUploadPayload> files,
        string keyPrefix,
        CancellationToken ct = default)
    {
        if (files.Count == 0)
            return Array.Empty<string>();

        var urls = new List<string>(files.Count);
        var prefix = keyPrefix.Trim('/');

        foreach (var file in files)
        {
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrWhiteSpace(ext) || ext.Length > 8)
                ext = ContentTypeToExtension(file.ContentType);

            var key = $"{prefix}/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{ext}";

            await PutObjectAsync(key, file, ct);
            var url = BuildPublicUrl(key);
            urls.Add(url);
            logger.LogInformation("Uploaded {Key} to s3://{Bucket}/{Key}", key, _options.BucketName, key);
        }

        return urls;
    }

    private async Task PutObjectAsync(string key, FileUploadPayload file, CancellationToken ct)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = file.Content,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            AutoCloseStream = false,
        };

        await _client.PutObjectAsync(request, ct);
    }

    public void Dispose() => _client.Dispose();

    private string BuildPublicUrl(string key)
    {
        if (!string.IsNullOrWhiteSpace(_options.PublicBaseUrl))
            return $"{_options.PublicBaseUrl!.TrimEnd('/')}/{key}";

        var region = _options.Region;
        if (region.Equals("us-east-1", StringComparison.OrdinalIgnoreCase))
            return $"https://{_options.BucketName}.s3.amazonaws.com/{key}";

        return $"https://{_options.BucketName}.s3.{region}.amazonaws.com/{key}";
    }

    private static string ContentTypeToExtension(string contentType) =>
        contentType.ToLowerInvariant() switch
        {
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            "image/heic" => ".heic",
            "image/heif" => ".heif",
            _ => ".jpg",
        };

    private static IAmazonS3 CreateClient(S3Options options)
    {
        var region = RegionEndpoint.GetBySystemName(options.Region);

        if (!string.IsNullOrWhiteSpace(options.AccessKeyId) &&
            !string.IsNullOrWhiteSpace(options.SecretAccessKey))
        {
            return new AmazonS3Client(options.AccessKeyId, options.SecretAccessKey, region);
        }

        return new AmazonS3Client(region);
    }
}
