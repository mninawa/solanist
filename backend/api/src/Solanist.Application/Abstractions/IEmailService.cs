namespace Solanist.Application.Abstractions;

public interface IEmailService
{
    bool IsEnabled { get; }

    Task<bool> SendPasswordResetAsync(
        string toEmail,
        string resetUrl,
        string? firstName,
        CancellationToken ct = default);
}
