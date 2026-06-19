namespace Solanist.Application.Abstractions;

public interface IFileStorageService
{
    bool IsEnabled { get; }

    Task<bool> CheckHealthAsync(CancellationToken ct = default);

    Task<IReadOnlyList<string>> UploadAsync(
        IReadOnlyList<FileUploadPayload> files,
        string keyPrefix,
        CancellationToken ct = default);
}

public sealed record FileUploadPayload(Stream Content, string ContentType, string FileName);
