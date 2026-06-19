using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;

namespace Solanist.Infrastructure.Mock;

public sealed class MockJobReportPublisher : IJobReportPublisher
{
    public Task<CleaningReportDto?> PublishAsync(
        PublishJobReportRequest request,
        string staffName,
        CancellationToken ct = default) =>
        Task.FromResult<CleaningReportDto?>(null);
}
