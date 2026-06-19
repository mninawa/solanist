using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoInviteService(IMongoDatabase db) : IInviteService
{
    private IMongoCollection<InviteDocument> Invites =>
        db.GetCollection<InviteDocument>(MongoCollections.Invites);

    private IMongoCollection<UserDocument> Users =>
        db.GetCollection<UserDocument>(MongoCollections.Users);

    public async Task<InviteDto?> GetInviteAsync(string code, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var doc = await Invites.Find(i => i.Code == normalized).FirstOrDefaultAsync(ct);
        if (doc is null) return null;

        if (doc.Status == "pending" && doc.ExpiresAt < DateTime.UtcNow)
        {
            doc.Status = "expired";
            await Invites.ReplaceOneAsync(i => i.Id == doc.Id, doc, cancellationToken: ct);
        }

        var blocked = await ResolveSignupBlockedReasonAsync(doc, ct);
        return InviteMappers.ToDto(doc, blocked);
    }

    internal async Task<InviteDocument?> FindDocumentAsync(string code, CancellationToken ct = default)
    {
        var normalized = code.Trim().ToUpperInvariant();
        return await Invites.Find(i => i.Code == normalized).FirstOrDefaultAsync(ct);
    }

    internal async Task MarkAcceptedAsync(InviteDocument invite, CancellationToken ct = default)
    {
        invite.Status = "accepted";
        await Invites.ReplaceOneAsync(i => i.Id == invite.Id, invite, cancellationToken: ct);
    }

    private async Task<string?> ResolveSignupBlockedReasonAsync(InviteDocument doc, CancellationToken ct)
    {
        if (doc.Status == "accepted")
            return "invite_used";

        if (doc.Status == "expired")
            return "expired_invite";

        var email = doc.CustomerEmail.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var exists = await Users.Find(u => u.Email == email).AnyAsync(ct);
        return exists ? "email_exists" : null;
    }
}
