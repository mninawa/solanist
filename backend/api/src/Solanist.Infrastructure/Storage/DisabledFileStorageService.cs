using Solanist.Application.Abstractions;

namespace Solanist.Infrastructure.Storage;

public sealed class DisabledFileStorageService : IFileStorageService
{
    public bool IsEnabled => false;

    public Task<bool> CheckHealthAsync(CancellationToken ct = default) =>
        Task.FromResult(false);

    public Task<IReadOnlyList<string>> UploadAsync(
        IReadOnlyList<FileUploadPayload> files,
        string keyPrefix,
        CancellationToken ct = default) =>
        throw new InvalidOperationException("S3 uploads are not configured.");
}
