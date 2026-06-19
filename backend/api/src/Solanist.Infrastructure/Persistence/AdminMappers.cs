using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminMappers
{
    public static AdminLeadDto ToLeadDto(LeadDocument lead) => new(
        lead.Id,
        lead.Source,
        lead.Status,
        lead.PipelineStage,
        lead.CustomerName,
        lead.CustomerEmail,
        lead.CustomerPhone,
        lead.PropertyAddress,
        lead.City,
        lead.Postcode,
        lead.Province,
        lead.PanelCount,
        lead.EstimatedPanelsRange,
        lead.RoofType,
        lead.AccessNotes,
        lead.PreferredServiceTime,
        lead.PropertyType,
        lead.Notes,
        lead.RequestSnippet,
        lead.CreatedAt,
        lead.Urgency,
        lead.LeadScore,
        lead.ServiceType,
        lead.Tags.Select(t => new AdminLeadTagDto(t.Label, t.Tone)).ToList(),
        lead.BestTimeToContact,
        lead.PreferredContact,
        lead.QuoteRef,
        lead.InviteCode,
        lead.InviteLink,
        lead.RecommendedPlan,
        lead.Activities.Select(a => new AdminLeadActivityDto(a.Id, a.Type, a.Title, a.Description, a.Timestamp)).ToList(),
        lead.Checklist.Select(c => new AdminLeadChecklistItemDto(c.Label, c.Done, c.Date)).ToList(),
        lead.NearbyLeads.Select(n => new AdminNearbyLeadDto(n.Name, n.Location, n.Score)).ToList(),
        lead.QuoteSummary is null
            ? null
            : new AdminLeadQuoteSummaryDto(
                lead.QuoteSummary.Ref,
                lead.QuoteSummary.PlanName,
                lead.QuoteSummary.Price,
                lead.QuoteSummary.PriceLabel,
                lead.QuoteSummary.Status,
                lead.QuoteSummary.FirstVisit),
        lead.ConversationNotes);

    public static AdminBookingDto ToBookingDto(BookingDocument booking, string customerName) => new(
        booking.Id,
        booking.BookingRef ?? booking.Id,
        customerName,
        booking.PropertyAddress,
        booking.Date,
        booking.TimeSlot,
        booking.Status,
        booking.StaffName,
        booking.StaffId,
        booking.PlanName,
        booking.PanelCount);

    public static AdminCustomerDto ToCustomerDto(
        CustomerDocument customer,
        int propertyCount,
        string? planName,
        string primaryAddress) => new(
        customer.Id,
        $"{customer.FirstName} {customer.LastName}",
        customer.Email,
        customer.Phone ?? "",
        propertyCount,
        planName,
        propertyCount > 0 ? "active" : "prospect",
        primaryAddress);

    public static AdminCustomerPropertyDto ToCustomerPropertyDto(PropertyDocument p) => new(
        p.Id,
        p.Address,
        p.City,
        p.Postcode,
        p.PanelCount,
        p.RoofType,
        p.SystemSizeKw,
        p.IsPrimary,
        p.PlanName,
        p.NextCleanDate,
        p.ImageUrl);

    public static AdminCustomerSubscriptionDto ToCustomerSubscriptionDto(SubscriptionDocument s) => new(
        s.PlanName,
        s.Status,
        s.PricePerVisit,
        s.AnnualPrice,
        s.BillingCycle,
        s.NextBillingDate,
        s.VisitsRemaining,
        s.PaymentMethod,
        s.Features);

    public static AdminCustomerDetailDto ToCustomerDetailDto(
        CustomerDocument customer,
        IReadOnlyList<PropertyDocument> properties,
        SubscriptionDocument? subscription,
        IReadOnlyList<AdminBookingDto> bookings) => new(
        customer.Id,
        $"{customer.FirstName} {customer.LastName}",
        customer.Email,
        customer.Phone ?? "",
        properties.Count > 0 ? "active" : "prospect",
        customer.PreferredContact,
        customer.EmailReminders,
        customer.WhatsAppReminders,
        customer.BillingMode,
        properties.Select(ToCustomerPropertyDto).ToList(),
        subscription is null ? null : ToCustomerSubscriptionDto(subscription),
        bookings);

    public static AdminStaffMemberDto ToStaffDto(
        UserDocument user,
        int jobsToday,
        int completedToday) => new(
        user.StaffId ?? user.Id,
        $"{user.FirstName} {user.LastName}",
        user.Phone ?? "",
        user.Role == "staff" ? "Field Technician" : user.Role == "admin" ? "Administrator" : user.Role,
        jobsToday > 0 ? "active" : "off_duty",
        jobsToday,
        completedToday,
        user.Email,
        user.Role);

    public static AdminSubscriptionRowDto ToSubscriptionRow(
        PropertyDocument property,
        string customerName,
        string paymentStatus) => new(
        property.Id,
        customerName,
        $"{property.Address}, {property.City}",
        PlanTypeFromName(property.PlanName),
        property.NextCleanDate ?? "",
        RelativeCleanDate(property.NextCleanDate),
        paymentStatus,
        property.SubscriptionStatus == "paused" ? "paused" : "active");

    private static string PlanTypeFromName(string? planName) => planName switch
    {
        null or "" => "Basic",
        var n when n.Contains("Premium", StringComparison.OrdinalIgnoreCase) => "Premium",
        var n when n.Contains("Quarterly", StringComparison.OrdinalIgnoreCase) => "Plus",
        _ => "Basic",
    };

    private static string RelativeCleanDate(string? date)
    {
        if (string.IsNullOrWhiteSpace(date) || !DateOnly.TryParse(date, out var cleanDate))
            return "";

        var days = cleanDate.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
        return days switch
        {
            0 => "Today",
            1 => "Tomorrow",
            > 1 and <= 7 => $"In {days} days",
            < 0 => "Overdue",
            _ => cleanDate.ToString("MMM d"),
        };
    }
}
