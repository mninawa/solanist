using Solanist.Application.Abstractions;

namespace Solanist.Infrastructure.WhatsApp;

public sealed class DisabledWhatsAppService : IWhatsAppService
{
    public bool IsEnabled => false;

    public Task<bool> SendTextAsync(string toPhone, string text, CancellationToken ct = default) =>
        Task.FromResult(false);

    public Task<bool> SendInviteAsync(
        string toPhone,
        string customerFirstName,
        string inviteUrl,
        string offerName,
        DateTime expiresAt,
        CancellationToken ct = default) =>
        Task.FromResult(false);
}
