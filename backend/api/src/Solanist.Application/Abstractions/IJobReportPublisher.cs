using Solanist.Application.Dtos;

namespace Solanist.Application.Abstractions;

public interface IJobReportPublisher
{
    Task<CleaningReportDto?> PublishAsync(
        PublishJobReportRequest request,
        string staffName,
        CancellationToken ct = default);
}
