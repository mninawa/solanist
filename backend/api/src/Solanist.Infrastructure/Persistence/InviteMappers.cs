using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class InviteMappers
{
    public static InviteDto ToDto(InviteDocument doc, string? signupBlockedReason = null) => new(
        doc.Code,
        doc.CustomerName,
        doc.CustomerEmail,
        doc.CustomerPhone,
        new InviteQuoteDto(
            doc.Quote.BasePrice,
            doc.Quote.EstimatedPanelCount,
            doc.Quote.ServiceType,
            doc.Quote.QuoteRef,
            doc.Quote.Notes),
        new PropertyDetailsDto(
            doc.Property.Address,
            doc.Property.City,
            doc.Property.Postcode,
            doc.Property.PanelCount,
            doc.Property.RoofType,
            doc.Property.AccessNotes,
            doc.Property.SystemSizeKw,
            doc.Property.ImageUrl),
        doc.Plans.Select(ToPlanDto).ToList(),
        doc.ExpiresAt,
        doc.Status,
        signupBlockedReason);

    public static AdminInviteDto ToAdminDto(InviteDocument doc) => new(
        doc.Id,
        doc.Code,
        doc.CustomerName,
        doc.CustomerEmail,
        doc.CustomerPhone,
        new InviteQuoteDto(
            doc.Quote.BasePrice,
            doc.Quote.EstimatedPanelCount,
            doc.Quote.ServiceType,
            doc.Quote.QuoteRef,
            doc.Quote.Notes),
        new PropertyDetailsDto(
            doc.Property.Address,
            doc.Property.City,
            doc.Property.Postcode,
            doc.Property.PanelCount,
            doc.Property.RoofType,
            doc.Property.AccessNotes,
            doc.Property.SystemSizeKw,
            doc.Property.ImageUrl),
        doc.Plans.Select(ToPlanDto).ToList(),
        doc.ExpiresAt,
        doc.Status,
        doc.SentAt ?? "",
        doc.SentBy ?? "");

    private static ServicePlanDto ToPlanDto(InvitePlanDocument plan) => new(
        plan.Id,
        plan.Name,
        plan.Description,
        plan.PricePerVisit,
        plan.VisitsPerYear,
        plan.AnnualPrice,
        plan.Features,
        plan.Recommended);
}
