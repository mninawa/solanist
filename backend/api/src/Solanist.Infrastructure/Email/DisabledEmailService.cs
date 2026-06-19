using Solanist.Application.Abstractions;

namespace Solanist.Infrastructure.Email;

public sealed class DisabledEmailService : IEmailService
{
    public bool IsEnabled => false;

    public Task<bool> SendPasswordResetAsync(
        string toEmail,
        string resetUrl,
        string? firstName,
        CancellationToken ct = default) =>
        Task.FromResult(false);
}
