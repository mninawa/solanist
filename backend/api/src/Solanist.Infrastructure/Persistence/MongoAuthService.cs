using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Auth;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoAuthService(
    IMongoDatabase db,
    ITokenService tokenService,
    IGoogleIdTokenValidator googleTokenValidator,
    IOptions<AuthOptions> authOptions,
    IEmailService emailService,
    IServicePlanCatalog servicePlans,
    ILogger<MongoAuthService> logger) : IAuthService
{
    private readonly AuthOptions _auth = authOptions.Value;
    private IMongoCollection<UserDocument> Users =>
        db.GetCollection<UserDocument>(MongoCollections.Users);

    private IMongoCollection<InviteDocument> Invites =>
        db.GetCollection<InviteDocument>(MongoCollections.Invites);

    private IMongoCollection<CustomerDocument> Customers =>
        db.GetCollection<CustomerDocument>(MongoCollections.Customers);

    private IMongoCollection<PropertyDocument> Properties =>
        db.GetCollection<PropertyDocument>(MongoCollections.Properties);

    private IMongoCollection<SubscriptionDocument> Subscriptions =>
        db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions);

    private IMongoCollection<BookingDocument> Bookings =>
        db.GetCollection<BookingDocument>(MongoCollections.Bookings);

    private IMongoCollection<LeadDocument> Leads =>
        db.GetCollection<LeadDocument>(MongoCollections.Leads);

    public async Task<AuthSessionDto?> LoginAsync(LoginRequestDto request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            return null;

        var user = await Users.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
        if (user is null) return null;

        if (!string.IsNullOrWhiteSpace(user.Password) &&
            !string.Equals(user.Password, request.Password, StringComparison.Ordinal))
            return null;

        var authUser = ToAuthUser(user);
        return new AuthSessionDto(authUser, tokenService.CreateToken(authUser));
    }

    public AuthConfigDto GetAuthConfig() =>
        new(
            !string.IsNullOrWhiteSpace(_auth.GoogleClientId),
            string.IsNullOrWhiteSpace(_auth.GoogleClientId) ? null : _auth.GoogleClientId,
            _auth.GoogleOnly,
            _auth.AllowSelfSignup);

    public async Task<GoogleAuthResultDto> GoogleLoginAsync(
        GoogleLoginRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_auth.GoogleClientId))
            return new GoogleAuthResultDto(null, "google_not_configured");

        if (string.IsNullOrWhiteSpace(request.IdToken))
            return new GoogleAuthResultDto(null, "invalid_token");

        var token = request.IdToken.Trim();
        if (token.StartsWith("mock:", StringComparison.OrdinalIgnoreCase))
        {
            if (!_auth.AllowMockGoogleLogin)
                return new GoogleAuthResultDto(null, "invalid_token");

            var email = token["mock:".Length..].Trim().ToLowerInvariant();
            var mockUser = await Users.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
            if (mockUser is null)
                return new GoogleAuthResultDto(null, "account_not_found");

            if (string.IsNullOrWhiteSpace(mockUser.GoogleId))
                mockUser.GoogleId = $"mock-{mockUser.Id}";

            await Users.ReplaceOneAsync(u => u.Id == mockUser.Id, mockUser, cancellationToken: ct);

            var mockAuthUser = ToAuthUser(mockUser);
            if (!AuthPortal.MatchesRole(mockAuthUser.Role, request.Portal))
                return new GoogleAuthResultDto(null, "role_mismatch");

            return new GoogleAuthResultDto(
                new AuthSessionDto(mockAuthUser, tokenService.CreateToken(mockAuthUser)),
                null);
        }

        var payload = await googleTokenValidator.ValidateAsync(request.IdToken, ct);
        if (payload is null)
            return new GoogleAuthResultDto(null, "invalid_token");

        var user = await Users.Find(u => u.Email == payload.Email || u.GoogleId == payload.Subject)
            .FirstOrDefaultAsync(ct);
        if (user is null)
            return new GoogleAuthResultDto(null, "account_not_found");

        if (string.IsNullOrWhiteSpace(user.GoogleId))
            user.GoogleId = payload.Subject;

        if (string.IsNullOrWhiteSpace(user.FirstName) && !string.IsNullOrWhiteSpace(payload.FirstName))
            user.FirstName = payload.FirstName.Trim();

        if (string.IsNullOrWhiteSpace(user.LastName) && !string.IsNullOrWhiteSpace(payload.LastName))
            user.LastName = payload.LastName.Trim();

        await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);

        var authUser = ToAuthUser(user);
        if (!AuthPortal.MatchesRole(authUser.Role, request.Portal))
            return new GoogleAuthResultDto(null, "role_mismatch");

        return new GoogleAuthResultDto(
            new AuthSessionDto(authUser, tokenService.CreateToken(authUser)),
            null);
    }

    public async Task<SignupResultDto> SignupAsync(SignupRequestDto request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(request.Password))
            return new SignupResultDto(null, "invalid_request");

        var inviteCode = request.InviteCode.Trim().ToUpperInvariant();
        var invite = await Invites.Find(i => i.Code == inviteCode).FirstOrDefaultAsync(ct);
        if (invite is null)
            return new SignupResultDto(null, "invalid_invite");

        if (invite.Status != "pending")
            return new SignupResultDto(null, invite.Status == "accepted" ? "invite_used" : "expired_invite");

        if (invite.ExpiresAt < DateTime.UtcNow)
        {
            invite.Status = "expired";
            await Invites.ReplaceOneAsync(i => i.Id == invite.Id, invite, cancellationToken: ct);
            return new SignupResultDto(null, "expired_invite");
        }

        var existingUser = await Users.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
        if (existingUser is not null)
            return new SignupResultDto(null, "email_exists");

        var plan = invite.Plans.FirstOrDefault(p => p.Id == request.SelectedPlanId)
            ?? invite.Plans.FirstOrDefault(p => p.Recommended)
            ?? invite.Plans.FirstOrDefault();
        if (plan is null)
            return new SignupResultDto(null, "invalid_plan");

        var panelCount = request.PanelCount ?? invite.Property.PanelCount;
        var roofType = request.RoofType ?? invite.Property.RoofType;
        var accessNotes = request.AccessNotes ?? invite.Property.AccessNotes;
        var customerId = NewId("cust");
        var propertyId = NewId("prop");
        var userId = NewId("user");
        var subscriptionId = NewId("sub");
        var planMeta = PlanMeta(plan);

        var customer = new CustomerDocument
        {
            Id = customerId,
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone ?? invite.CustomerPhone,
            PreferredContact = "whatsapp",
            EmailReminders = true,
            WhatsAppReminders = true,
            BillingMode = "combined",
            ReportsPublished = false,
            Greeting = "Welcome",
            SystemStatus = "Your system is ready for its first clean",
            ValueProps =
            [
                "Maximize energy output",
                "Protect your investment",
                "Longer panel lifespan",
                "Peace of mind",
            ],
        };

        var property = new PropertyDocument
        {
            Id = propertyId,
            CustomerId = customerId,
            Address = invite.Property.Address,
            City = invite.Property.City,
            Postcode = invite.Property.Postcode,
            PanelCount = panelCount,
            RoofType = roofType,
            AccessNotes = accessNotes,
            SystemSizeKw = invite.Property.SystemSizeKw ?? Math.Round(panelCount * 0.43, 1),
            ImageUrl = invite.Property.ImageUrl,
            IsPrimary = true,
            SubscriptionStatus = "active",
            PlanName = plan.Name,
            PlanVariant = planMeta.Variant,
            PlanFrequency = planMeta.Frequency,
            NextCleanDate = request.PreferredServiceDate,
            NextCleanTimeSlot = MapTimeSlot(request.PreferredTimeSlot),
            PricePerClean = plan.PricePerVisit,
            VisitsPerYear = plan.VisitsPerYear,
            VisitsRemaining = plan.VisitsPerYear,
            MonthlyBilling = plan.VisitsPerYear > 0 ? Math.Round(plan.AnnualPrice / 12, 0) : plan.PricePerVisit,
        };

        var user = new UserDocument
        {
            Id = userId,
            Email = email,
            Password = request.Password,
            Role = "client",
            CustomerId = customerId,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Phone = customer.Phone,
        };

        var subscription = new SubscriptionDocument
        {
            Id = subscriptionId,
            CustomerId = customerId,
            PlanName = plan.Name,
            PlanDescription = plan.Description,
            Status = "active",
            PricePerVisit = plan.PricePerVisit,
            AnnualPrice = plan.AnnualPrice,
            BillingCycle = planMeta.BillingCycle,
            NextBillingDate = request.PreferredServiceDate ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(14).ToString("yyyy-MM-dd"),
            NextCleanDate = request.PreferredServiceDate ?? "",
            VisitsRemaining = plan.VisitsPerYear,
            PaymentMethod = "To be added",
            Features = plan.Features,
        };

        await Customers.InsertOneAsync(customer, cancellationToken: ct);
        await Properties.InsertOneAsync(property, cancellationToken: ct);
        await Users.InsertOneAsync(user, cancellationToken: ct);
        await Subscriptions.InsertOneAsync(subscription, cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(request.PreferredServiceDate))
        {
            var booking = new BookingDocument
            {
                Id = NewId("booking"),
                CustomerId = customerId,
                BookingRef = $"BKG-{DateTime.UtcNow:yyyy-MMdd}-{Random.Shared.Next(1000, 9999)}",
                PropertyId = propertyId,
                Date = request.PreferredServiceDate,
                TimeSlot = MapTimeSlot(request.PreferredTimeSlot),
                Status = "upcoming",
                ServiceType = "Solar Panel Cleaning",
                PropertyAddress = $"{property.Address}, {property.City}",
                PropertyPostcode = property.Postcode,
                PlanName = plan.Name,
                ConfirmationStatus = "scheduled",
                BookedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                ServiceDuration = "~4 hours",
                PanelCount = panelCount,
                SystemSizeKw = property.SystemSizeKw,
                RoofType = roofType,
                AccessNotes = accessNotes,
                BillingNote = "subscription",
                IsNextBooking = true,
            };
            await Bookings.InsertOneAsync(booking, cancellationToken: ct);
        }

        invite.Status = "accepted";
        await Invites.ReplaceOneAsync(i => i.Id == invite.Id, invite, cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(invite.LeadId))
        {
            var lead = await Leads.Find(l => l.Id == invite.LeadId).FirstOrDefaultAsync(ct);
            if (lead is not null)
            {
                lead.Status = "converted";
                lead.PipelineStage = "signed_up";
                await Leads.ReplaceOneAsync(l => l.Id == lead.Id, lead, cancellationToken: ct);
            }
        }

        var authUser = ToAuthUser(user);
        return new SignupResultDto(new AuthSessionDto(authUser, tokenService.CreateToken(authUser)), null);
    }

    public async Task<SignupResultDto> GoogleSignupAsync(GoogleSignupRequestDto request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_auth.GoogleClientId))
            return new SignupResultDto(null, "google_not_configured");

        if (string.IsNullOrWhiteSpace(request.IdToken))
            return new SignupResultDto(null, "invalid_token");

        var payload = await googleTokenValidator.ValidateAsync(request.IdToken, ct);
        if (payload is null)
            return new SignupResultDto(null, "invalid_token");

        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.InviteCode))
            return new SignupResultDto(null, "invalid_request");

        var inviteCode = request.InviteCode.Trim().ToUpperInvariant();
        var invite = await Invites.Find(i => i.Code == inviteCode).FirstOrDefaultAsync(ct);
        if (invite is null)
            return new SignupResultDto(null, "invalid_invite");

        if (invite.Status != "pending")
            return new SignupResultDto(null, invite.Status == "accepted" ? "invite_used" : "expired_invite");

        if (invite.ExpiresAt < DateTime.UtcNow)
        {
            invite.Status = "expired";
            await Invites.ReplaceOneAsync(i => i.Id == invite.Id, invite, cancellationToken: ct);
            return new SignupResultDto(null, "expired_invite");
        }

        var inviteEmail = invite.CustomerEmail.Trim().ToLowerInvariant();
        if (!string.Equals(inviteEmail, payload.Email, StringComparison.OrdinalIgnoreCase))
            return new SignupResultDto(null, "email_mismatch");

        var existingUser = await Users.Find(u => u.Email == payload.Email).FirstOrDefaultAsync(ct);
        if (existingUser is not null)
            return new SignupResultDto(null, "email_exists");

        var plan = invite.Plans.FirstOrDefault(p => p.Id == request.SelectedPlanId)
            ?? invite.Plans.FirstOrDefault(p => p.Recommended)
            ?? invite.Plans.FirstOrDefault();
        if (plan is null)
            return new SignupResultDto(null, "invalid_plan");

        var panelCount = request.PanelCount ?? invite.Property.PanelCount;
        var roofType = request.RoofType ?? invite.Property.RoofType;
        var accessNotes = request.AccessNotes ?? invite.Property.AccessNotes;
        var customerId = NewId("cust");
        var propertyId = NewId("prop");
        var userId = NewId("user");
        var subscriptionId = NewId("sub");
        var planMeta = PlanMeta(plan);

        var customer = new CustomerDocument
        {
            Id = customerId,
            Email = payload.Email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone ?? invite.CustomerPhone,
            PreferredContact = "whatsapp",
            EmailReminders = true,
            WhatsAppReminders = true,
            BillingMode = "combined",
            ReportsPublished = false,
            Greeting = "Welcome",
            SystemStatus = "Your system is ready for its first clean",
            ValueProps =
            [
                "Maximize energy output",
                "Protect your investment",
                "Longer panel lifespan",
                "Peace of mind",
            ],
        };

        var property = new PropertyDocument
        {
            Id = propertyId,
            CustomerId = customerId,
            Address = invite.Property.Address,
            City = invite.Property.City,
            Postcode = invite.Property.Postcode,
            PanelCount = panelCount,
            RoofType = roofType,
            AccessNotes = accessNotes,
            SystemSizeKw = invite.Property.SystemSizeKw ?? Math.Round(panelCount * 0.43, 1),
            ImageUrl = invite.Property.ImageUrl,
            IsPrimary = true,
            SubscriptionStatus = "active",
            PlanName = plan.Name,
            PlanVariant = planMeta.Variant,
            PlanFrequency = planMeta.Frequency,
            NextCleanDate = request.PreferredServiceDate,
            NextCleanTimeSlot = MapTimeSlot(request.PreferredTimeSlot),
            PricePerClean = plan.PricePerVisit,
            VisitsPerYear = plan.VisitsPerYear,
            VisitsRemaining = plan.VisitsPerYear,
            MonthlyBilling = plan.VisitsPerYear > 0 ? Math.Round(plan.AnnualPrice / 12, 0) : plan.PricePerVisit,
        };

        var user = new UserDocument
        {
            Id = userId,
            Email = payload.Email,
            GoogleId = payload.Subject,
            Role = "client",
            CustomerId = customerId,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Phone = customer.Phone,
        };

        var subscription = new SubscriptionDocument
        {
            Id = subscriptionId,
            CustomerId = customerId,
            PlanName = plan.Name,
            PlanDescription = plan.Description,
            Status = "active",
            PricePerVisit = plan.PricePerVisit,
            AnnualPrice = plan.AnnualPrice,
            BillingCycle = planMeta.BillingCycle,
            NextBillingDate = request.PreferredServiceDate ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(14).ToString("yyyy-MM-dd"),
            NextCleanDate = request.PreferredServiceDate ?? "",
            VisitsRemaining = plan.VisitsPerYear,
            PaymentMethod = "To be added",
            Features = plan.Features,
        };

        await Customers.InsertOneAsync(customer, cancellationToken: ct);
        await Properties.InsertOneAsync(property, cancellationToken: ct);
        await Users.InsertOneAsync(user, cancellationToken: ct);
        await Subscriptions.InsertOneAsync(subscription, cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(request.PreferredServiceDate))
        {
            var booking = new BookingDocument
            {
                Id = NewId("booking"),
                CustomerId = customerId,
                BookingRef = $"BKG-{DateTime.UtcNow:yyyy-MMdd}-{Random.Shared.Next(1000, 9999)}",
                PropertyId = propertyId,
                Date = request.PreferredServiceDate,
                TimeSlot = MapTimeSlot(request.PreferredTimeSlot),
                Status = "upcoming",
                ServiceType = "Solar Panel Cleaning",
                PropertyAddress = $"{property.Address}, {property.City}",
                PropertyPostcode = property.Postcode,
                PlanName = plan.Name,
                ConfirmationStatus = "scheduled",
                BookedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                ServiceDuration = "~4 hours",
                PanelCount = panelCount,
                SystemSizeKw = property.SystemSizeKw,
                RoofType = roofType,
                AccessNotes = accessNotes,
                BillingNote = "subscription",
                IsNextBooking = true,
            };
            await Bookings.InsertOneAsync(booking, cancellationToken: ct);
        }

        invite.Status = "accepted";
        await Invites.ReplaceOneAsync(i => i.Id == invite.Id, invite, cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(invite.LeadId))
        {
            var lead = await Leads.Find(l => l.Id == invite.LeadId).FirstOrDefaultAsync(ct);
            if (lead is not null)
            {
                lead.Status = "converted";
                lead.PipelineStage = "signed_up";
                await Leads.ReplaceOneAsync(l => l.Id == lead.Id, lead, cancellationToken: ct);
            }
        }

        var authUser = ToAuthUser(user);
        return new SignupResultDto(new AuthSessionDto(authUser, tokenService.CreateToken(authUser)), null);
    }

    public async Task<SignupResultDto> GoogleSelfSignupAsync(GoogleSelfSignupRequestDto request, CancellationToken ct = default)
    {
        if (!_auth.AllowSelfSignup)
            return new SignupResultDto(null, "signup_disabled");

        if (string.IsNullOrWhiteSpace(_auth.GoogleClientId))
            return new SignupResultDto(null, "google_not_configured");

        if (string.IsNullOrWhiteSpace(request.IdToken))
            return new SignupResultDto(null, "invalid_token");

        var payload = await googleTokenValidator.ValidateAsync(request.IdToken, ct);
        if (payload is null)
            return new SignupResultDto(null, "invalid_token");

        if (string.IsNullOrWhiteSpace(request.FirstName) ||
            string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Address) ||
            string.IsNullOrWhiteSpace(request.City))
            return new SignupResultDto(null, "invalid_request");

        var existingUser = await Users.Find(u => u.Email == payload.Email).FirstOrDefaultAsync(ct);
        if (existingUser is not null)
            return new SignupResultDto(null, "email_exists");

        var catalog = await servicePlans.GetActiveCatalogAsync(ct);
        if (catalog.Count == 0)
            return new SignupResultDto(null, "invalid_plan");

        var plan = catalog.FirstOrDefault(p => p.Id == request.SelectedPlanId)
            ?? catalog.FirstOrDefault(p => p.Recommended)
            ?? catalog[0];

        var panelCount = request.PanelCount is > 0 ? request.PanelCount.Value : 12;
        var roofType = string.IsNullOrWhiteSpace(request.RoofType) ? "Tile Roof" : request.RoofType;
        var accessNotes = request.AccessNotes;
        var customerId = NewId("cust");
        var propertyId = NewId("prop");
        var userId = NewId("user");
        var subscriptionId = NewId("sub");
        var planMeta = PlanMeta(plan.Id);

        var customer = new CustomerDocument
        {
            Id = customerId,
            Email = payload.Email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Phone = request.Phone ?? "",
            PreferredContact = "whatsapp",
            EmailReminders = true,
            WhatsAppReminders = true,
            BillingMode = "combined",
            ReportsPublished = false,
            Greeting = "Welcome",
            SystemStatus = "Your system is ready for its first clean",
            ValueProps =
            [
                "Maximize energy output",
                "Protect your investment",
                "Longer panel lifespan",
                "Peace of mind",
            ],
        };

        var property = new PropertyDocument
        {
            Id = propertyId,
            CustomerId = customerId,
            Address = request.Address.Trim(),
            City = request.City.Trim(),
            Postcode = request.Postcode ?? "",
            PanelCount = panelCount,
            RoofType = roofType,
            AccessNotes = accessNotes,
            SystemSizeKw = Math.Round(panelCount * 0.43, 1),
            IsPrimary = true,
            SubscriptionStatus = "active",
            PlanName = plan.Name,
            PlanVariant = planMeta.Variant,
            PlanFrequency = planMeta.Frequency,
            NextCleanDate = request.PreferredServiceDate,
            NextCleanTimeSlot = MapTimeSlot(request.PreferredTimeSlot),
            PricePerClean = plan.PricePerVisit,
            VisitsPerYear = plan.VisitsPerYear,
            VisitsRemaining = plan.VisitsPerYear,
            MonthlyBilling = plan.VisitsPerYear > 0 ? Math.Round(plan.AnnualPrice / 12, 0) : plan.PricePerVisit,
        };

        var user = new UserDocument
        {
            Id = userId,
            Email = payload.Email,
            GoogleId = payload.Subject,
            Role = "client",
            CustomerId = customerId,
            FirstName = customer.FirstName,
            LastName = customer.LastName,
            Phone = customer.Phone,
        };

        var subscription = new SubscriptionDocument
        {
            Id = subscriptionId,
            CustomerId = customerId,
            PlanName = plan.Name,
            PlanDescription = plan.Description,
            Status = "active",
            PricePerVisit = plan.PricePerVisit,
            AnnualPrice = plan.AnnualPrice,
            BillingCycle = planMeta.BillingCycle,
            NextBillingDate = request.PreferredServiceDate ?? DateOnly.FromDateTime(DateTime.UtcNow).AddDays(14).ToString("yyyy-MM-dd"),
            NextCleanDate = request.PreferredServiceDate ?? "",
            VisitsRemaining = plan.VisitsPerYear,
            PaymentMethod = "To be added",
            Features = plan.Features.ToList(),
        };

        await Customers.InsertOneAsync(customer, cancellationToken: ct);
        await Properties.InsertOneAsync(property, cancellationToken: ct);
        await Users.InsertOneAsync(user, cancellationToken: ct);
        await Subscriptions.InsertOneAsync(subscription, cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(request.PreferredServiceDate))
        {
            var booking = new BookingDocument
            {
                Id = NewId("booking"),
                CustomerId = customerId,
                BookingRef = $"BKG-{DateTime.UtcNow:yyyy-MMdd}-{Random.Shared.Next(1000, 9999)}",
                PropertyId = propertyId,
                Date = request.PreferredServiceDate,
                TimeSlot = MapTimeSlot(request.PreferredTimeSlot),
                Status = "upcoming",
                ServiceType = "Solar Panel Cleaning",
                PropertyAddress = $"{property.Address}, {property.City}",
                PropertyPostcode = property.Postcode,
                PlanName = plan.Name,
                ConfirmationStatus = "scheduled",
                BookedOn = DateOnly.FromDateTime(DateTime.UtcNow).ToString("yyyy-MM-dd"),
                ServiceDuration = "~4 hours",
                PanelCount = panelCount,
                SystemSizeKw = property.SystemSizeKw,
                RoofType = roofType,
                AccessNotes = accessNotes,
                BillingNote = "subscription",
                IsNextBooking = true,
            };
            await Bookings.InsertOneAsync(booking, cancellationToken: ct);
        }

        logger.LogInformation("Self-service signup created account for {Email}", payload.Email);

        var authUser = ToAuthUser(user);
        return new SignupResultDto(new AuthSessionDto(authUser, tokenService.CreateToken(authUser)), null);
    }

    public async Task<ForgotPasswordResultDto> RequestPasswordResetAsync(
        ForgotPasswordRequestDto request,
        CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return new ForgotPasswordResultDto(true);

        var user = await Users.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
        if (user is null)
            return new ForgotPasswordResultDto(true);

        var token = Guid.NewGuid().ToString("N");
        user.PasswordResetToken = token;
        user.PasswordResetExpiresAt = DateTime.UtcNow.AddHours(1).ToString("O");
        await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);

        var resetUrl = BuildResetUrl(token);
        var sent = await emailService.SendPasswordResetAsync(email, resetUrl, user.FirstName, ct);
        if (sent)
            logger.LogInformation("Password reset email sent to {Email}", email);
        else
            logger.LogInformation("Password reset requested for {Email}. Reset link: {ResetUrl}", email, resetUrl);

        var devUrl = _auth.ExposeResetLinks && !sent ? resetUrl : null;
        return new ForgotPasswordResultDto(true, devUrl);
    }

    public async Task<ResetPasswordResultDto> ResetPasswordAsync(
        ResetPasswordRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Token))
            return new ResetPasswordResultDto(false, "invalid_token");

        if (string.IsNullOrWhiteSpace(request.NewPassword) || string.IsNullOrWhiteSpace(request.ConfirmPassword))
            return new ResetPasswordResultDto(false, "invalid_request");

        if (request.NewPassword.Length < 8)
            return new ResetPasswordResultDto(false, "password_too_short");

        if (!string.Equals(request.NewPassword, request.ConfirmPassword, StringComparison.Ordinal))
            return new ResetPasswordResultDto(false, "password_mismatch");

        var user = await Users.Find(u => u.PasswordResetToken == request.Token.Trim()).FirstOrDefaultAsync(ct);
        if (user is null)
            return new ResetPasswordResultDto(false, "invalid_token");

        if (!TryParseResetExpiry(user.PasswordResetExpiresAt, out var expiresAt) || expiresAt < DateTime.UtcNow)
            return new ResetPasswordResultDto(false, "expired_token");

        user.Password = request.NewPassword;
        user.PasswordResetToken = null;
        user.PasswordResetExpiresAt = null;
        await Users.ReplaceOneAsync(u => u.Id == user.Id, user, cancellationToken: ct);

        return new ResetPasswordResultDto(true);
    }

    private string BuildResetUrl(string token)
    {
        var baseUrl = _auth.AppBaseUrl.TrimEnd('/');
        return $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
    }

    private static bool TryParseResetExpiry(string? value, out DateTime expiresAt)
    {
        expiresAt = default;
        return !string.IsNullOrWhiteSpace(value) && DateTime.TryParse(value, out expiresAt);
    }

    private static AuthUserDto ToAuthUser(UserDocument user) =>
        new(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.Phone,
            user.CustomerId,
            user.StaffId);

    private static string NewId(string prefix) => $"{prefix}-{Guid.NewGuid():N}"[..16];

    private static string MapTimeSlot(string? slotId) => slotId switch
    {
        "morning" => "08:00 AM – 12:00 PM",
        "midday" => "10:00 AM – 12:00 PM",
        "afternoon" => "12:00 PM – 04:00 PM",
        "late-afternoon" => "02:00 PM – 06:00 PM",
        _ => "10:00 AM – 02:00 PM",
    };

    private static (string Frequency, string Variant, string BillingCycle) PlanMeta(InvitePlanDocument plan) =>
        PlanMeta(plan.Id);

    private static (string Frequency, string Variant, string BillingCycle) PlanMeta(string planId) =>
        planId switch
        {
            "plan-quarterly" => ("Every 3 months", "purple", "Quarterly"),
            "plan-biannual" => ("Every 6 months", "blue", "Bi-Annual"),
            _ => ("Once-off", "teal", "Once-off"),
        };
}
