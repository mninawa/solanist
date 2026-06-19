using System.Globalization;

namespace Solanist.Infrastructure.WhatsApp;

internal static class InviteMessageBuilder
{
    public static string Build(
        string customerFirstName,
        string inviteUrl,
        string offerName,
        DateTime expiresAt) =>
        $"""
        Hi {customerFirstName} 👋

        Thanks for reaching out about solar panel cleaning!

        We've prepared a personalised quote and care plan for your property.

        View your quote & choose your plan:
        {inviteUrl}

        Offer: {offerName}
        Link expires: {expiresAt.ToString("dd MMM yyyy", CultureInfo.InvariantCulture)}

        — Solanist Solar Care
        """;
}
