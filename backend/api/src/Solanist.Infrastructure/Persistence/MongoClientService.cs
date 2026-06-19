using System.Globalization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoClientService : IClientService
{
    private readonly IMongoDatabase _db;
    private readonly ICurrentUser _currentUser;
    private readonly ILogger<MongoClientService> _logger;
    private readonly AuthOptions _auth;
    private readonly IPaystackBillingService _paystack;
    private readonly IServicePlanCatalog _servicePlans;

    public MongoClientService(
        IMongoDatabase db,
        ICurrentUser currentUser,
        ILogger<MongoClientService> logger,
        IOptions<AuthOptions> authOptions,
        IPaystackBillingService paystack,
        IServicePlanCatalog servicePlans)
    {
        _db = db;
        _currentUser = currentUser;
        _logger = logger;
        _auth = authOptions.Value;
        _paystack = paystack;
        _servicePlans = servicePlans;
    }

    private string CustomerId => _currentUser.RequireCustomerId();

    private IMongoCollection<CustomerDocument> Customers =>
        _db.GetCollection<CustomerDocument>(MongoCollections.Customers);

    private IMongoCollection<PropertyDocument> Properties =>
        _db.GetCollection<PropertyDocument>(MongoCollections.Properties);

    private IMongoCollection<BookingDocument> Bookings =>
        _db.GetCollection<BookingDocument>(MongoCollections.Bookings);

    private IMongoCollection<ReportDocument> Reports =>
        _db.GetCollection<ReportDocument>(MongoCollections.Reports);

    private IMongoCollection<SubscriptionDocument> Subscriptions =>
        _db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions);

    private IMongoCollection<PaymentDocument> Payments =>
        _db.GetCollection<PaymentDocument>(MongoCollections.Payments);

    private IMongoCollection<UserDocument> Users =>
        _db.GetCollection<UserDocument>(MongoCollections.Users);

    public async Task<ClientDashboardDto> GetDashboardAsync(CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        var properties = await GetPropertyDocsAsync(ct);
        var primary = properties.FirstOrDefault(p => p.IsPrimary) ?? properties.First();
        var subscription = await GetSubscriptionDocAsync(ct);
        var bookings = await GetBookingDocsAsync(ct);
        var reports = await GetReportDocsAsync(ct);

        var nextBooking = bookings
            .Where(b => b.Status == "upcoming")
            .OrderBy(b => b.Date)
            .FirstOrDefault();

        NextServiceDto? nextService = null;
        if (nextBooking is not null && DateOnly.TryParse(nextBooking.Date, out var nextDate))
        {
            var daysUntil = nextDate.DayNumber - DateOnly.FromDateTime(DateTime.UtcNow).DayNumber;
            nextService = new NextServiceDto(
                nextBooking.Date,
                nextBooking.TimeSlot,
                daysUntil,
                nextBooking.ConfirmationStatus ?? "scheduled");
        }

        CleaningReportSummaryDto? latest = customer.ReportsPublished && reports.Count > 0
            ? MongoMappers.ToReportSummary(reports.OrderByDescending(r => r.CompletedAt).First())
            : null;

        return new ClientDashboardDto(
            customer.FirstName,
            $"{customer.FirstName} {customer.LastName}",
            customer.Greeting,
            new PlanSummaryDto(
                subscription.PlanName,
                subscription.PricePerVisit,
                4,
                DateOnly.Parse(subscription.NextBillingDate)),
            nextService,
            MongoMappers.ToPropertyDetails(primary),
            primary.SystemSizeKw ?? 0,
            latest,
            new SubscriptionSummaryDto(
                subscription.Status,
                subscription.PlanName,
                subscription.AnnualPrice,
                subscription.VisitsRemaining),
            customer.ValueProps,
            customer.SystemStatus);
    }

    public async Task<IReadOnlyList<BookingDto>> GetBookingsAsync(CancellationToken ct = default)
    {
        var docs = await GetBookingDocsAsync(ct);
        return docs.Select(MongoMappers.ToBookingDto).ToList();
    }

    public async Task<BookingDto?> GetBookingAsync(string id, CancellationToken ct = default)
    {
        var doc = await Bookings.Find(b => b.Id == id && b.CustomerId == CustomerId).FirstOrDefaultAsync(ct);
        return doc is null ? null : MongoMappers.ToBookingDto(doc);
    }

    public async Task<BookingDto> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct = default)
    {
        var property = await Properties.Find(p => p.Id == request.PropertyId && p.CustomerId == CustomerId)
            .FirstOrDefaultAsync(ct);
        if (property is null) throw new InvalidOperationException("Property not found.");

        var doc = new BookingDocument
        {
            Id = $"booking-{Guid.NewGuid():N}".Substring(0, 16),
            CustomerId = CustomerId,
            BookingRef = $"BKG-{DateTime.UtcNow:yyyy-MMdd}-{Random.Shared.Next(1000, 9999)}",
            PropertyId = property.Id,
            Date = request.Date,
            TimeSlot = request.TimeSlot,
            Status = "upcoming",
            ServiceType = "Solar Panel Cleaning",
            PropertyAddress = $"{property.Address}, {property.City}",
            PropertyPostcode = property.Postcode,
            PlanName = property.PlanName,
            ConfirmationStatus = "scheduled",
            BookedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
            ServiceDuration = "~4 hours",
            PanelCount = property.PanelCount,
            SystemSizeKw = property.SystemSizeKw,
            RoofType = property.RoofType,
            AccessNotes = property.AccessNotes,
            SpecialInstructions = request.SpecialInstructions,
            BillingNote = request.CleaningType == "subscription" ? "subscription" : "once_off",
        };

        await Bookings.InsertOneAsync(doc, cancellationToken: ct);
        return MongoMappers.ToBookingDto(doc);
    }

    public async Task<BookingDto> RescheduleBookingAsync(RescheduleBookingRequest request, CancellationToken ct = default)
    {
        var doc = await Bookings.Find(b => b.Id == request.BookingId && b.CustomerId == CustomerId)
            .FirstOrDefaultAsync(ct);
        if (doc is null) throw new InvalidOperationException("Booking not found.");

        doc.Date = request.Date;
        doc.TimeSlot = request.TimeSlot;
        doc.ConfirmationStatus = "scheduled";
        await Bookings.ReplaceOneAsync(b => b.Id == doc.Id, doc, cancellationToken: ct);
        return MongoMappers.ToBookingDto(doc);
    }

    public async Task<BookingDto?> GetUpcomingBookingForPropertyAsync(string propertyId, CancellationToken ct = default)
    {
        var doc = await Bookings.Find(b =>
                b.CustomerId == CustomerId &&
                b.PropertyId == propertyId &&
                b.Status == "upcoming")
            .SortBy(b => b.Date)
            .FirstOrDefaultAsync(ct);
        return doc is null ? null : MongoMappers.ToBookingDto(doc);
    }

    public async Task<IReadOnlyList<CleaningReportDto>> GetReportsAsync(CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        if (!customer.ReportsPublished) return [];

        var docs = await GetReportDocsAsync(ct);
        return docs.Select(MongoMappers.ToReportDto).ToList();
    }

    public async Task<CleaningReportDto?> GetReportAsync(string id, CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        if (!customer.ReportsPublished) return null;

        var doc = await Reports.Find(r => r.Id == id && r.CustomerId == CustomerId).FirstOrDefaultAsync(ct);
        return doc is null ? null : MongoMappers.ToReportDto(doc);
    }

    public async Task<SubscriptionDto> GetSubscriptionAsync(CancellationToken ct = default)
    {
        var doc = await GetSubscriptionDocAsync(ct);
        return MongoMappers.ToSubscriptionDto(doc);
    }

    public async Task<SubscriptionPortfolioResponseDto> GetSubscriptionPortfolioAsync(CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        var properties = await GetPropertyDocsAsync(ct);
        await EnrichPlanFieldsAsync(properties, ct);
        var subscription = await GetSubscriptionDocAsync(ct);
        var payments = await GetPaymentDocsAsync(ct);

        var activeProperties = properties.Where(p => p.SubscriptionStatus == "active").ToList();
        var invoicePreview = activeProperties.Select(p => new InvoicePreviewItemDto(
            p.Id,
            p.Address,
            p.PlanName ?? "Solar Care Plan",
            p.PricePerClean ?? 0)).ToList();

        var portfolio = new SubscriptionPortfolioDto(
            customer.BillingMode,
            subscription.PaymentMethod,
            subscription.NextBillingDate,
            invoicePreview.Sum(i => i.Amount),
            invoicePreview);

        return new SubscriptionPortfolioResponseDto(
            properties.Select(MongoMappers.ToPropertyDto).ToList(),
            portfolio,
            payments.Select(MongoMappers.ToPaymentDto).ToList());
    }

    public async Task<string> SetBillingModeAsync(string billingMode, CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        customer.BillingMode = billingMode;
        await Customers.ReplaceOneAsync(c => c.Id == customer.Id, customer, cancellationToken: ct);
        return billingMode;
    }

    public async Task<IReadOnlyList<PaymentDto>> GetPaymentsAsync(CancellationToken ct = default)
    {
        var docs = await GetPaymentDocsAsync(ct);
        return docs.Select(MongoMappers.ToPaymentDto).ToList();
    }

    public async Task<IReadOnlyList<PropertySummaryDto>> GetPropertiesAsync(CancellationToken ct = default)
    {
        var docs = await GetPropertyDocsAsync(ct);
        await EnrichPlanFieldsAsync(docs, ct);
        return docs.Select(MongoMappers.ToPropertyDto).ToList();
    }

    public async Task<PropertyPlanDetailsDto?> GetPropertyPlanAsync(string propertyId, CancellationToken ct = default)
    {
        var property = await Properties.Find(p => p.Id == propertyId && p.CustomerId == CustomerId)
            .FirstOrDefaultAsync(ct);
        if (property is null) return null;

        var subscription = await GetSubscriptionDocAsync(ct);
        var payments = await GetPaymentDocsAsync(ct);
        var bookings = await GetBookingDocsAsync(ct);
        var reports = await GetReportDocsAsync(ct);

        var upcoming = bookings
            .Where(b => b.PropertyId == propertyId && b.Status == "upcoming")
            .Select(MongoMappers.ToBookingDto)
            .ToList();

        var recentReports = reports
            .Where(r => r.PropertyId == propertyId)
            .OrderByDescending(r => r.CompletedAt)
            .Take(3)
            .Select(MongoMappers.ToReportSummary)
            .ToList();

        return new PropertyPlanDetailsDto(
            MongoMappers.ToPropertyDto(property),
            MongoMappers.ToSubscriptionDto(subscription),
            payments.Take(3).Select(MongoMappers.ToPaymentDto).ToList(),
            upcoming,
            recentReports);
    }

    public async Task<PropertyDetailDto?> GetPropertyDetailAsync(string propertyId, CancellationToken ct = default)
    {
        var property = await Properties.Find(p => p.Id == propertyId && p.CustomerId == CustomerId)
            .FirstOrDefaultAsync(ct);
        if (property is null) return null;

        var properties = new List<PropertyDocument> { property };
        await EnrichPlanFieldsAsync(properties, ct);

        var subscription = await Subscriptions.Find(s => s.CustomerId == CustomerId).FirstOrDefaultAsync(ct);
        var bookings = await GetBookingDocsAsync(ct);
        var reports = await GetReportDocsAsync(ct);
        var payments = await GetPaymentDocsAsync(ct);

        var propertyBookings = bookings
            .Where(b => string.Equals(b.PropertyId, propertyId, StringComparison.Ordinal))
            .OrderByDescending(b => b.Date)
            .Select(MongoMappers.ToBookingDto)
            .ToList();

        var propertyReports = reports
            .Where(r => string.Equals(r.PropertyId, propertyId, StringComparison.Ordinal))
            .OrderByDescending(r => r.CompletedAt)
            .Select(MongoMappers.ToReportSummary)
            .ToList();

        // Payments are stored at customer level, not per-property. Filter to invoices that
        // match this property's plan name (description), so multi-property accounts only see
        // the invoices that fund this specific subscription.
        var planName = property.PlanName;
        var propertyInvoices = payments
            .Where(p => string.IsNullOrWhiteSpace(planName)
                || string.Equals(p.Description, planName, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(p => p.Date)
            .Select(MongoMappers.ToPaymentDto)
            .ToList();

        return new PropertyDetailDto(
            MongoMappers.ToPropertyDto(property),
            subscription is null ? null : MongoMappers.ToSubscriptionDto(subscription),
            propertyInvoices,
            propertyBookings,
            propertyReports);
    }

    public async Task<PropertyDetailDto?> SeedDemoCleaningsAsync(string propertyId, CancellationToken ct = default)
    {
        var property = await Properties.Find(p => p.Id == propertyId && p.CustomerId == CustomerId)
            .FirstOrDefaultAsync(ct);
        if (property is null) return null;

        // Idempotent: if there are already bookings for this property, leave it alone.
        var existing = await Bookings.Find(b => b.PropertyId == propertyId).AnyAsync(ct);
        if (existing)
        {
            _logger.LogInformation(
                "SeedDemoCleanings skipped — property {PropertyId} already has cleaning history.", propertyId);
            return await GetPropertyDetailAsync(propertyId, ct);
        }

        // Cadence in months derived from visits/year (default quarterly).
        var visitsPerYear = property.VisitsPerYear ?? 4;
        var cadenceMonths = visitsPerYear switch
        {
            >= 12 => 1,
            6 => 2,
            4 => 3,
            3 => 4,
            2 => 6,
            1 => 12,
            _ => 3,
        };

        var planName = property.PlanName ?? "Solar Care Plan";
        var address = $"{property.Address}, {property.City}";
        var postcode = property.Postcode;
        var serviceDuration = property.PanelCount switch
        {
            >= 20 => "~5 hours",
            >= 12 => "~4 hours",
            _ => "~3 hours",
        };

        var staff = new[] { ("staff-001", "James M."), ("staff-002", "Sipho N.") };
        var bookingsToInsert = new List<BookingDocument>();
        var reportsToInsert = new List<ReportDocument>();
        var today = DateTime.UtcNow.Date;

        // Seed 3 completed cleanings stepping back from today on the property's cadence.
        for (var i = 1; i <= 3; i++)
        {
            var date = today.AddMonths(-cadenceMonths * i);
            var dateKey = date.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var bookedOn = date.AddDays(-14).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var (staffId, staffName) = staff[i % staff.Length];
            var bookingId = $"booking-{Guid.NewGuid():N}"[..14];
            var bookingRef = $"BKG-{date:yyyyMMdd}-{i:D4}";

            bookingsToInsert.Add(new BookingDocument
            {
                Id = bookingId,
                CustomerId = CustomerId,
                BookingRef = bookingRef,
                PropertyId = propertyId,
                Date = dateKey,
                TimeSlot = "10:00 AM – 02:00 PM",
                Status = "completed",
                ServiceType = "Solar Panel Cleaning",
                PropertyAddress = address,
                PropertyPostcode = postcode,
                PlanName = planName,
                StaffId = staffId,
                StaffName = staffName,
                ConfirmationStatus = "confirmed",
                BookedOn = bookedOn,
                ServiceDuration = serviceDuration,
                PanelCount = property.PanelCount,
                SystemSizeKw = property.SystemSizeKw,
                RoofType = property.RoofType,
                AccessNotes = property.AccessNotes,
                BillingNote = "subscription",
            });

            // Generate a report for the two most recent cleanings.
            if (i <= 2)
            {
                var beforeKwh = 11500 + i * 250;
                var afterKwh = beforeKwh + 200 + i * 30;
                reportsToInsert.Add(new ReportDocument
                {
                    Id = $"report-{Guid.NewGuid():N}"[..14],
                    CustomerId = CustomerId,
                    PropertyId = propertyId,
                    BookingId = bookingId,
                    CompletedAt = dateKey,
                    ServiceType = "Solar Panel Cleaning Report",
                    PanelCount = property.PanelCount,
                    StaffName = staffName,
                    PropertyAddress = $"{address}, {postcode}",
                    PlanName = planName,
                    SystemSizeKw = property.SystemSizeKw,
                    RoofType = property.RoofType,
                    AccessNotes = property.AccessNotes,
                    PropertyImageUrl = property.ImageUrl,
                    // All Unsplash IDs below have been spot-checked to return
                    // HTTP 200 — the previous demo seed was hitting several
                    // 404s, which broke the after/before photo thumbnails.
                    BeforePhotos =
                    [
                        "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=520&fit=crop",
                        "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=520&fit=crop",
                        "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=800&h=520&fit=crop",
                    ],
                    AfterPhotos =
                    [
                        "https://images.unsplash.com/photo-1754619880959-2b0528375883?w=800&h=520&fit=crop",
                        "https://images.unsplash.com/photo-1545209463-e2825498edbf?w=800&h=520&fit=crop",
                        "https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=520&fit=crop",
                    ],
                    ChecklistSummary =
                    [
                        "Panels inspected for damage",
                        "Debris and bird droppings removed",
                        "Full rinse and squeegee dry",
                        "Inverter readings logged",
                    ],
                    StaffNotes =
                        "Moderate dust build-up cleared. No damage detected. "
                        + $"Recommended next clean in {cadenceMonths} months.",
                    BeforeKwhReading = beforeKwh,
                    AfterKwhReading = afterKwh,
                    KwhGain = afterKwh - beforeKwh,
                });
            }
        }

        if (bookingsToInsert.Count > 0)
            await Bookings.InsertManyAsync(bookingsToInsert, cancellationToken: ct);
        if (reportsToInsert.Count > 0)
            await Reports.InsertManyAsync(reportsToInsert, cancellationToken: ct);

        // Make sure latestReport / reportsPublished surfaces these
        var customer = await Customers.Find(c => c.Id == CustomerId).FirstOrDefaultAsync(ct);
        if (customer is not null && !customer.ReportsPublished)
        {
            customer.ReportsPublished = true;
            await Customers.ReplaceOneAsync(c => c.Id == customer.Id, customer, cancellationToken: ct);
        }

        _logger.LogInformation(
            "Seeded {BookingCount} demo cleanings and {ReportCount} reports for property {PropertyId}.",
            bookingsToInsert.Count, reportsToInsert.Count, propertyId);

        return await GetPropertyDetailAsync(propertyId, ct);
    }

    public async Task<PropertySummaryDto> AddPropertyAsync(CreatePropertyRequest request, CancellationToken ct = default)
    {
        var existing = await GetPropertyDocsAsync(ct);
        var systemKw = request.SystemSizeKw ?? Math.Round(request.PanelCount * 0.433, 1);

        var doc = new PropertyDocument
        {
            Id = $"prop-{Guid.NewGuid():N}".Substring(0, 12),
            CustomerId = CustomerId,
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Postcode = request.Postcode.Trim(),
            PanelCount = request.PanelCount,
            RoofType = request.RoofType,
            AccessNotes = request.AccessNotes?.Trim(),
            SystemSizeKw = systemKw,
            ImageUrl = "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=500&fit=crop",
            IsPrimary = existing.Count == 0,
            SubscriptionStatus = "setup_required",
            MonthlyBilling = 0,
        };

        await Properties.InsertOneAsync(doc, cancellationToken: ct);
        return MongoMappers.ToPropertyDto(doc);
    }

    public async Task<PropertySummaryDto> UpdatePropertyImageAsync(string propertyId, string imageUrl, CancellationToken ct = default)
    {
        var properties = await GetPropertyDocsAsync(ct);
        var doc = properties.FirstOrDefault(p => p.Id == propertyId)
            ?? throw new InvalidOperationException("Property not found.");
        doc.ImageUrl = imageUrl;
        await Properties.ReplaceOneAsync(
            p => p.Id == propertyId && p.CustomerId == CustomerId,
            doc,
            cancellationToken: ct);
        return MongoMappers.ToPropertyDto(doc);
    }

    public async Task<PropertySummaryDto> UpdatePropertyNextCleanAsync(string propertyId, string? date, CancellationToken ct = default)
    {
        var normalized = NormalizeCleanDate(date);
        var properties = await GetPropertyDocsAsync(ct);
        var doc = properties.FirstOrDefault(p => p.Id == propertyId)
            ?? throw new InvalidOperationException("Property not found.");
        doc.NextCleanDate = normalized;
        if (normalized is null)
            doc.NextCleanTimeSlot = null;
        await Properties.ReplaceOneAsync(
            p => p.Id == propertyId && p.CustomerId == CustomerId,
            doc,
            cancellationToken: ct);
        return MongoMappers.ToPropertyDto(doc);
    }

    private static string? NormalizeCleanDate(string? date)
    {
        if (string.IsNullOrWhiteSpace(date))
            return null;
        if (!DateOnly.TryParse(date.Trim(), CultureInfo.InvariantCulture, out var parsed))
            throw new InvalidOperationException("invalid_date");
        return parsed.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
    }

    public async Task<IReadOnlyList<PropertySummaryDto>> SetPrimaryPropertyAsync(string propertyId, CancellationToken ct = default)
    {
        var properties = await GetPropertyDocsAsync(ct);
        foreach (var p in properties)
        {
            p.IsPrimary = p.Id == propertyId;
            await Properties.ReplaceOneAsync(x => x.Id == p.Id, p, cancellationToken: ct);
        }
        return properties.Select(MongoMappers.ToPropertyDto).ToList();
    }

    public async Task<IReadOnlyList<PropertySummaryDto>> DeletePropertyAsync(string propertyId, CancellationToken ct = default)
    {
        var properties = await GetPropertyDocsAsync(ct);
        if (properties.Count <= 1)
            throw new InvalidOperationException("You must keep at least one property on your account.");

        var removed = properties.FirstOrDefault(p => p.Id == propertyId);
        if (removed is null) return properties.Select(MongoMappers.ToPropertyDto).ToList();

        await Properties.DeleteOneAsync(p => p.Id == propertyId && p.CustomerId == CustomerId, ct);

        var remaining = await GetPropertyDocsAsync(ct);
        if (removed.IsPrimary && remaining.Count > 0)
        {
            remaining[0].IsPrimary = true;
            await Properties.ReplaceOneAsync(p => p.Id == remaining[0].Id, remaining[0], cancellationToken: ct);
            remaining = await GetPropertyDocsAsync(ct);
        }

        var hasActiveProperty = remaining.Any(p =>
            string.Equals(p.SubscriptionStatus, "active", StringComparison.OrdinalIgnoreCase));
        if (!hasActiveProperty)
            await RemoveCustomerSubscriptionAsync(ct);

        return remaining.Select(MongoMappers.ToPropertyDto).ToList();
    }

    private async Task RemoveCustomerSubscriptionAsync(CancellationToken ct)
    {
        var subscription = await Subscriptions.Find(s => s.CustomerId == CustomerId).FirstOrDefaultAsync(ct);
        if (subscription is null) return;

        // Stop recurring billing on Paystack before dropping the local record so the
        // customer isn't charged for a property they no longer own. Best-effort.
        if (!string.IsNullOrWhiteSpace(subscription.PaystackSubscriptionCode))
        {
            try
            {
                await _paystack.CancelSubscriptionAsync(CustomerId, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Could not cancel Paystack subscription for customer {CustomerId} while deleting property.",
                    CustomerId);
            }
        }

        await Subscriptions.DeleteManyAsync(s => s.CustomerId == CustomerId, ct);
        _logger.LogInformation(
            "Removed subscription for customer {CustomerId} after deleting its last active property.",
            CustomerId);
    }

    public async Task<ClientProfileDto> GetProfileAsync(CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        return MongoMappers.ToProfileDto(customer);
    }

    public async Task<ClientProfileDto> UpdateProfileAsync(UpdateClientProfileRequestDto request, CancellationToken ct = default)
    {
        var customer = await GetCustomerAsync(ct);
        customer.FirstName = request.FirstName.Trim();
        customer.LastName = request.LastName.Trim();
        customer.Phone = request.Phone.Trim();
        customer.PreferredContact = NormalizePreferredContact(request.PreferredContact);
        customer.EmailReminders = request.EmailReminders;
        customer.WhatsAppReminders = request.WhatsAppReminders;
        await Customers.ReplaceOneAsync(c => c.Id == customer.Id, customer, cancellationToken: ct);

        var user = await Users.Find(u => u.CustomerId == CustomerId && u.Role == "client").FirstOrDefaultAsync(ct);
        if (user is not null)
        {
            user.FirstName = customer.FirstName;
            user.LastName = customer.LastName;
            user.Phone = customer.Phone;
            await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);
        }

        return MongoMappers.ToProfileDto(customer);
    }

    public async Task<ChangePasswordResultDto> ChangePasswordAsync(ChangePasswordRequestDto request, CancellationToken ct = default)
    {
        if (_auth.GoogleOnly)
            return new ChangePasswordResultDto(false, "password_disabled");

        if (string.IsNullOrWhiteSpace(request.NewPassword) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
            return new ChangePasswordResultDto(false, "invalid_request");

        if (request.NewPassword.Length < 8)
            return new ChangePasswordResultDto(false, "password_too_short");

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            return new ChangePasswordResultDto(false, "password_mismatch");

        var user = await Users.Find(u => u.CustomerId == CustomerId && u.Role == "client").FirstOrDefaultAsync(ct);
        if (user is null)
            return new ChangePasswordResultDto(false, "user_not_found");

        if (!string.IsNullOrWhiteSpace(user.Password))
        {
            if (string.IsNullOrWhiteSpace(request.CurrentPassword))
                return new ChangePasswordResultDto(false, "current_password_required");

            if (!string.Equals(user.Password, request.CurrentPassword, StringComparison.Ordinal))
                return new ChangePasswordResultDto(false, "wrong_password");
        }

        user.Password = request.NewPassword;
        await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);
        return new ChangePasswordResultDto(true);
    }

    private static string NormalizePreferredContact(string value) =>
        value.ToLowerInvariant() switch
        {
            "email" or "phone" or "whatsapp" => value.ToLowerInvariant(),
            _ => "whatsapp",
        };

    public void PublishLatestReport()
    {
        _ = PublishLatestReportAsync();
    }

    private async Task PublishLatestReportAsync()
    {
        try
        {
            var customer = await Customers.Find(c => c.Id == CustomerId).FirstOrDefaultAsync();
            if (customer is null) return;
            customer.ReportsPublished = true;
            await Customers.ReplaceOneAsync(c => c.Id == customer.Id, customer);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish latest report flag");
        }
    }

    private async Task<CustomerDocument> GetCustomerAsync(CancellationToken ct)
    {
        var customer = await Customers.Find(c => c.Id == CustomerId).FirstOrDefaultAsync(ct);
        if (customer is null) throw new InvalidOperationException($"Customer {CustomerId} not found.");
        return customer;
    }

    private async Task<SubscriptionDocument> GetSubscriptionDocAsync(CancellationToken ct)
    {
        var sub = await Subscriptions.Find(s => s.CustomerId == CustomerId).FirstOrDefaultAsync(ct);
        if (sub is null) throw new InvalidOperationException("Subscription not found.");
        return sub;
    }

    private async Task<List<PropertyDocument>> GetPropertyDocsAsync(CancellationToken ct) =>
        await Properties.Find(p => p.CustomerId == CustomerId).ToListAsync(ct);

    /// <summary>
    /// Backfills plan-derived fields (frequency, price, monthly billing) for active properties that
    /// were activated via Paystack before those fields were captured, so the subscription table and
    /// billing summary never render empty cells. Persists the fill so it only happens once.
    /// </summary>
    private async Task EnrichPlanFieldsAsync(List<PropertyDocument> properties, CancellationToken ct)
    {
        var pending = properties
            .Where(p => p.SubscriptionStatus == "active"
                && !string.IsNullOrWhiteSpace(p.PlanName)
                && (string.IsNullOrWhiteSpace(p.PlanFrequency)
                    || (p.PricePerClean ?? 0m) <= 0m
                    || p.MonthlyBilling is null))
            .ToList();
        if (pending.Count == 0) return;

        var plans = await _servicePlans.GetAdminPlansAsync(ct);
        if (plans.Count == 0) return;

        foreach (var property in pending)
        {
            var plan = plans.FirstOrDefault(
                pl => string.Equals(pl.Name, property.PlanName, StringComparison.OrdinalIgnoreCase));
            if (plan is null) continue;

            if (ServicePlanMappers.ApplyPlanFields(property, plan))
                await Properties.ReplaceOneAsync(d => d.Id == property.Id, property, cancellationToken: ct);
        }
    }

    private async Task<List<BookingDocument>> GetBookingDocsAsync(CancellationToken ct) =>
        await Bookings.Find(b => b.CustomerId == CustomerId).ToListAsync(ct);

    private async Task<List<ReportDocument>> GetReportDocsAsync(CancellationToken ct)
    {
        var docs = await Reports.Find(r => r.CustomerId == CustomerId).ToListAsync(ct);
        await BackfillBrokenReportPhotosAsync(docs, ct);
        return docs;
    }

    private async Task<List<PaymentDocument>> GetPaymentDocsAsync(CancellationToken ct) =>
        await Payments.Find(p => p.CustomerId == CustomerId).ToListAsync(ct);

    // -------- Photo URL backfill --------
    //
    // Earlier demo seeds shipped a few Unsplash photo IDs that have since
    // returned 404, leaving broken thumbnails on the Reports list and detail
    // page. We rewrite those known-bad URLs to a verified working alternative
    // the first time the customer's reports are read, then persist the fix
    // so subsequent reads are clean.
    private static readonly Dictionary<string, string> BrokenPhotoIdReplacements = new()
    {
        ["1497441173707-f25a2e1d4a65"] = "1605980776566-0486c3ac7617",
        ["1613665813447-82a78c468a4d"] = "1754619880959-2b0528375883",
        ["1558449455-0aa211637b00"] = "1545209463-e2825498edbf",
        ["1611365892117-bce8666e2c79"] = "1559302504-64aae6ca6b6d",
        ["1559302995-f1d7e5c5f05e"] = "1466611653911-95081537e5b7",
    };

    private async Task BackfillBrokenReportPhotosAsync(
        List<ReportDocument> docs,
        CancellationToken ct)
    {
        if (docs.Count == 0) return;

        foreach (var doc in docs)
        {
            var dirty = false;
            doc.BeforePhotos = RewritePhotoList(doc.BeforePhotos, ref dirty);
            doc.AfterPhotos = RewritePhotoList(doc.AfterPhotos, ref dirty);

            if (!dirty) continue;

            try
            {
                var update = Builders<ReportDocument>.Update
                    .Set(r => r.BeforePhotos, doc.BeforePhotos)
                    .Set(r => r.AfterPhotos, doc.AfterPhotos);
                await Reports.UpdateOneAsync(
                    r => r.Id == doc.Id && r.CustomerId == CustomerId,
                    update,
                    cancellationToken: ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Failed to persist broken-photo backfill for report {ReportId}.",
                    doc.Id);
            }
        }
    }

    private static List<string> RewritePhotoList(List<string> photos, ref bool dirty)
    {
        if (photos.Count == 0) return photos;
        var rewritten = new List<string>(photos.Count);
        foreach (var url in photos)
        {
            var replacement = url;
            foreach (var (brokenId, fixedId) in BrokenPhotoIdReplacements)
            {
                if (replacement.Contains(brokenId, StringComparison.Ordinal))
                {
                    replacement = replacement.Replace(brokenId, fixedId, StringComparison.Ordinal);
                }
            }
            if (!ReferenceEquals(replacement, url) && replacement != url)
            {
                dirty = true;
            }
            rewritten.Add(replacement);
        }
        return rewritten;
    }
}
