using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class LeadMutations
{
    public static void ApplyStatus(LeadDocument lead, string status)
    {
        lead.Status = status;

        if (status == "converted")
            lead.PipelineStage = "signed_up";

        var title = status switch
        {
            "converted" => "Marked as won",
            "lost" => "Marked as lost",
            "contacted" => "Marked as contacted",
            "quote_sent" => "Quote sent",
            "interested" => "Marked as interested",
            _ => $"Status updated to {status}",
        };

        AppendActivity(lead, status == "converted" ? "note" : "follow_up", title);
    }

    public static void ApplyPipelineStage(LeadDocument lead, string stage)
    {
        lead.PipelineStage = stage;

        var label = stage switch
        {
            "new" => "New Lead",
            "contacted" => "Contacted",
            "interested" => "Interested",
            "quote_sent" => "Quote Sent",
            "invite_sent" => "Invite Sent",
            "signed_up" => "Signed Up",
            _ => stage,
        };

        AppendActivity(lead, "note", $"Pipeline: {label}");
    }

    public static void ApplyContactUpdate(
        LeadDocument lead,
        string customerName,
        string customerEmail,
        string customerPhone,
        string propertyAddress,
        string city,
        string? bestTimeToContact,
        string? preferredContact)
    {
        lead.CustomerName = customerName.Trim();
        lead.CustomerEmail = customerEmail.Trim().ToLowerInvariant();
        lead.CustomerPhone = customerPhone.Trim();
        lead.PropertyAddress = propertyAddress.Trim();
        lead.City = city.Trim();
        lead.BestTimeToContact = string.IsNullOrWhiteSpace(bestTimeToContact) ? null : bestTimeToContact.Trim();
        lead.PreferredContact = string.IsNullOrWhiteSpace(preferredContact) ? null : preferredContact.Trim();
        AppendActivity(lead, "note", "Contact details updated");
    }

    public static void ApplyAddTag(LeadDocument lead, string label, string tone)
    {
        var trimmed = label.Trim();
        if (string.IsNullOrWhiteSpace(trimmed)) return;
        if (lead.Tags.Any(t => t.Label.Equals(trimmed, StringComparison.OrdinalIgnoreCase))) return;

        lead.Tags.Add(new LeadTagDocument { Label = trimmed, Tone = tone });
        AppendActivity(lead, "note", $"Tag added: {trimmed}");
    }

    public static void ApplyAddNote(LeadDocument lead, string note)
    {
        var trimmed = note.Trim();
        if (string.IsNullOrWhiteSpace(trimmed)) return;

        var stamp = DateTime.UtcNow.ToString("MMM d, HH:mm");
        var entry = $"[{stamp}] {trimmed}";
        lead.ConversationNotes = string.IsNullOrWhiteSpace(lead.ConversationNotes)
            ? entry
            : $"{lead.ConversationNotes}\n\n{entry}";
        AppendActivity(lead, "note", "Conversation note added", trimmed);
    }

    private static void AppendActivity(LeadDocument lead, string type, string title, string? description = null)
    {
        lead.Activities.Insert(0, new LeadActivityDocument
        {
            Id = $"act-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Type = type,
            Title = title,
            Description = description,
            Timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss"),
        });
    }
}
