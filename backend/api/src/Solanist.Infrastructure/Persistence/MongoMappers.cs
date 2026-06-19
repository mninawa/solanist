using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class MongoMappers
{
    public static PropertySummaryDto ToPropertyDto(PropertyDocument p) => new(
        p.Id, p.Address, p.City, p.Postcode, p.PanelCount, p.RoofType, p.AccessNotes,
        p.SystemSizeKw, p.ImageUrl, p.IsPrimary, p.SubscriptionStatus, p.PlanName,
        p.PlanVariant, p.PlanFrequency, p.NextCleanDate, p.NextCleanTimeSlot,
        p.PricePerClean, p.VisitsPerYear, p.VisitsRemaining, p.MonthlyBilling);

    public static PropertyDetailsDto ToPropertyDetails(PropertyDocument p) => new(
        p.Address, p.City, p.Postcode, p.PanelCount, p.RoofType, p.AccessNotes,
        p.SystemSizeKw, p.ImageUrl);

    public static BookingDto ToBookingDto(BookingDocument b) => new(
        b.Id, b.Date, b.TimeSlot, b.Status, b.ServiceType, b.PropertyAddress,
        b.StaffName, b.ConfirmationStatus, b.BookingRef, b.PropertyId, b.PropertyPostcode,
        b.PlanName, b.BookedOn, b.ServiceDuration, b.PanelCount, b.SystemSizeKw,
        b.RoofType, b.AccessNotes, b.SpecialInstructions, b.BillingNote, b.IsNextBooking);

    public static CleaningReportDto ToReportDto(ReportDocument r) => new(
        r.Id, r.CompletedAt, r.ServiceType, r.PanelCount, r.StaffName, r.PropertyAddress,
        r.BeforePhotos, r.AfterPhotos, r.ChecklistSummary, r.StaffNotes,
        r.PropertyId, r.BookingId, r.PlanName, r.SystemSizeKw, r.RoofType, r.AccessNotes,
        r.PropertyImageUrl, r.BeforeKwhReading, r.AfterKwhReading, r.KwhGain, r.Status);

    public static CleaningReportSummaryDto ToReportSummary(ReportDocument r) => new(
        r.Id, r.CompletedAt, r.ServiceType, r.PanelCount, r.StaffName,
        r.BeforePhotos.FirstOrDefault());

    public static PaymentDto ToPaymentDto(PaymentDocument p) => new(
        p.Id, p.Date, p.Description, p.Amount, p.Status);

    public static SubscriptionDto ToSubscriptionDto(SubscriptionDocument s) => new(
        s.PlanName, s.PlanDescription, s.Status, s.PricePerVisit, s.AnnualPrice,
        s.BillingCycle, s.NextBillingDate, s.NextCleanDate, s.VisitsRemaining,
        s.PaymentMethod, s.Features,
        string.IsNullOrWhiteSpace(s.PaymentProvider) ? "manual" : s.PaymentProvider,
        RequiresPaymentSetup(s));

    private static bool RequiresPaymentSetup(SubscriptionDocument s) =>
        !string.Equals(s.PaymentProvider, "paystack", StringComparison.OrdinalIgnoreCase) &&
        (string.IsNullOrWhiteSpace(s.PaymentMethod) ||
         s.PaymentMethod.Contains("To be added", StringComparison.OrdinalIgnoreCase));

    public static ClientProfileDto ToProfileDto(CustomerDocument c) => new(
        c.FirstName, c.LastName, c.Email, c.Phone, c.PreferredContact,
        c.EmailReminders, c.WhatsAppReminders);
}
