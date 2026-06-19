using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;

namespace Solanist.Infrastructure.Mock;

public sealed class MockInviteService : IInviteService
{
    public Task<InviteDto?> GetInviteAsync(string code, CancellationToken ct = default)
    {
        var normalized = code.ToUpperInvariant();
        return Task.FromResult(normalized == MockData.InviteCode ? MockData.Invite : null);
    }
}

public sealed class MockClientService : IClientService
{
    private bool _reportAvailable;
    private string _billingMode = "combined";
    private List<PropertySummaryDto> _properties = MockData.Properties.ToList();
    private List<BookingDto> _bookings = MockData.Bookings.ToList();

    public Task<ClientDashboardDto> GetDashboardAsync(CancellationToken ct = default) =>
        Task.FromResult(MockData.Dashboard(_reportAvailable));

    public Task<IReadOnlyList<BookingDto>> GetBookingsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<BookingDto>>(_bookings);

    public Task<BookingDto?> GetBookingAsync(string id, CancellationToken ct = default) =>
        Task.FromResult(_bookings.FirstOrDefault(b => b.Id == id));

    public Task<BookingDto> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct = default)
    {
        var property = _properties.FirstOrDefault(p => p.Id == request.PropertyId);
        if (property is null) throw new InvalidOperationException("Property not found.");
        var booking = new BookingDto(
            $"booking-{Guid.NewGuid():N}".Substring(0, 12),
            request.Date, request.TimeSlot, "upcoming", "Solar Panel Cleaning",
            $"{property.Address}, {property.City}", null, "scheduled",
            null, property.Id, property.Postcode, property.PlanName);
        _bookings.Insert(0, booking);
        return Task.FromResult(booking);
    }

    public Task<BookingDto> RescheduleBookingAsync(RescheduleBookingRequest request, CancellationToken ct = default)
    {
        var index = _bookings.FindIndex(b => b.Id == request.BookingId);
        if (index < 0) throw new InvalidOperationException("Booking not found.");
        var updated = _bookings[index] with { Date = request.Date, TimeSlot = request.TimeSlot, ConfirmationStatus = "scheduled" };
        _bookings[index] = updated;
        return Task.FromResult(updated);
    }

    public Task<BookingDto?> GetUpcomingBookingForPropertyAsync(string propertyId, CancellationToken ct = default)
    {
        var property = _properties.FirstOrDefault(p => p.Id == propertyId);
        if (property is null) return Task.FromResult<BookingDto?>(null);
        var booking = _bookings.FirstOrDefault(b =>
            b.Status == "upcoming" && b.PropertyAddress.StartsWith(property.Address, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(booking);
    }

    public Task<IReadOnlyList<CleaningReportDto>> GetReportsAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<CleaningReportDto>>(_reportAvailable ? MockData.Reports : []);

    public Task<CleaningReportDto?> GetReportAsync(string id, CancellationToken ct = default)
    {
        if (!_reportAvailable && id == "report-001") return Task.FromResult<CleaningReportDto?>(null);
        return Task.FromResult(MockData.Reports.FirstOrDefault(r => r.Id == id));
    }

    public Task<SubscriptionDto> GetSubscriptionAsync(CancellationToken ct = default) =>
        Task.FromResult(MockData.Subscription);

    public Task<SubscriptionPortfolioResponseDto> GetSubscriptionPortfolioAsync(CancellationToken ct = default)
    {
        var active = _properties.Where(p => p.SubscriptionStatus == "active").ToList();
        var invoicePreview = active.Select(p => new InvoicePreviewItemDto(
            p.Id, p.Address, p.PlanName ?? "Solar Care Plan", p.PricePerClean ?? 0)).ToList();
        var portfolio = new SubscriptionPortfolioDto(
            _billingMode, MockData.Subscription.PaymentMethod, MockData.Subscription.NextBillingDate,
            invoicePreview.Sum(i => i.Amount), invoicePreview);
        return Task.FromResult(new SubscriptionPortfolioResponseDto(_properties, portfolio, MockData.Payments));
    }

    public Task<string> SetBillingModeAsync(string billingMode, CancellationToken ct = default)
    {
        _billingMode = billingMode;
        return Task.FromResult(billingMode);
    }

    public Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CancellationToken ct = default) =>
        Task.FromResult(MockData.Payments);

    public Task<IReadOnlyList<PropertySummaryDto>> GetPropertiesAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<PropertySummaryDto>>(_properties);

    public Task<PropertyPlanDetailsDto?> GetPropertyPlanAsync(string propertyId, CancellationToken ct = default)
    {
        var property = _properties.FirstOrDefault(p => p.Id == propertyId);
        if (property is null) return Task.FromResult<PropertyPlanDetailsDto?>(null);
        var plan = new PropertyPlanDetailsDto(
            property, MockData.Subscription, MockData.Payments.Take(3).ToList(),
            _bookings.Where(b => b.PropertyId == propertyId && b.Status == "upcoming").ToList(),
            _reportAvailable ? MockData.Reports.Take(1).Select(MockData.ToSummary).ToList() : []);
        return Task.FromResult<PropertyPlanDetailsDto?>(plan);
    }

    public Task<PropertySummaryDto> AddPropertyAsync(CreatePropertyRequest request, CancellationToken ct = default)
    {
        var property = new PropertySummaryDto(
            $"prop-{Guid.NewGuid():N}".Substring(0, 12),
            request.Address, request.City, request.Postcode, request.PanelCount, request.RoofType,
            request.AccessNotes, request.SystemSizeKw,
            "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop",
            _properties.Count == 0, "setup_required");
        _properties.Add(property);
        return Task.FromResult(property);
    }

    public Task<PropertySummaryDto> UpdatePropertyImageAsync(string propertyId, string imageUrl, CancellationToken ct = default)
    {
        var index = _properties.FindIndex(p => p.Id == propertyId);
        if (index < 0) throw new InvalidOperationException("Property not found.");
        _properties[index] = _properties[index] with { ImageUrl = imageUrl };
        return Task.FromResult(_properties[index]);
    }

    public Task<IReadOnlyList<PropertySummaryDto>> SetPrimaryPropertyAsync(string propertyId, CancellationToken ct = default)
    {
        _properties = _properties.Select(p => p with { IsPrimary = p.Id == propertyId }).ToList();
        return Task.FromResult<IReadOnlyList<PropertySummaryDto>>(_properties);
    }

    public Task<IReadOnlyList<PropertySummaryDto>> DeletePropertyAsync(string propertyId, CancellationToken ct = default)
    {
        if (_properties.Count <= 1) throw new InvalidOperationException("You must keep at least one property.");
        _properties = _properties.Where(p => p.Id != propertyId).ToList();
        if (!_properties.Any(p => p.IsPrimary))
            _properties[0] = _properties[0] with { IsPrimary = true };
        return Task.FromResult<IReadOnlyList<PropertySummaryDto>>(_properties);
    }

    public Task<ClientProfileDto> GetProfileAsync(CancellationToken ct = default) =>
        Task.FromResult(_profile);

    public Task<ClientProfileDto> UpdateProfileAsync(UpdateClientProfileRequestDto request, CancellationToken ct = default)
    {
        _profile = _profile with
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone.Trim(),
            PreferredContact = request.PreferredContact,
            EmailReminders = request.EmailReminders,
            WhatsAppReminders = request.WhatsAppReminders,
        };
        return Task.FromResult(_profile);
    }

    public Task<ChangePasswordResultDto> ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
            return Task.FromResult(new ChangePasswordResultDto(false, "password_too_short"));

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            return Task.FromResult(new ChangePasswordResultDto(false, "password_mismatch"));

        return Task.FromResult(new ChangePasswordResultDto(true));
    }

    public void PublishLatestReport() => _reportAvailable = true;

    private static ClientProfileDto _profile = MockData.Profile;
}
