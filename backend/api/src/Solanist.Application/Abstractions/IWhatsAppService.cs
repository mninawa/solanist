namespace Solanist.Application.Abstractions;

public interface IWhatsAppService
{
    bool IsEnabled { get; }

    Task<bool> SendTextAsync(string toPhone, string text, CancellationToken ct = default);

    Task<bool> SendInviteAsync(
        string toPhone,
        string customerFirstName,
        string inviteUrl,
        string offerName,
        DateTime expiresAt,
        CancellationToken ct = default);
}
