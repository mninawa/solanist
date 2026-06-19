using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Paystack;

internal sealed class PaystackBillingService(
    PaystackApiClient api,
    IMongoDatabase db,
    IServicePlanCatalog servicePlans,
    IOptions<PaystackOptions> options,
    ILogger<PaystackBillingService> logger) : IPaystackBillingService
{
    private readonly PaystackOptions _options = options.Value;

    private IMongoCollection<CustomerDocument> Customers =>
        db.GetCollection<CustomerDocument>(MongoCollections.Customers);

    private IMongoCollection<SubscriptionDocument> Subscriptions =>
        db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions);

    private IMongoCollection<PropertyDocument> Properties =>
        db.GetCollection<PropertyDocument>(MongoCollections.Properties);

    private IMongoCollection<PaymentDocument> Payments =>
        db.GetCollection<PaymentDocument>(MongoCollections.Payments);

    public bool IsEnabled => _options.IsEnabled;

    public PaystackConfigDto GetConfig() => new(_options.IsEnabled, _options.IsEnabled ? _options.PublicKey : null);

    public async Task<PaystackInitializeResponseDto> InitializeSubscriptionAsync(
        string customerId,
        string email,
        string firstName,
        string lastName,
        PaystackInitializeRequestDto request,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(customerId))
            throw new InvalidOperationException("customer_not_linked");

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("email_required");

        email = email.Trim();
        if (!IsValidCheckoutEmail(email))
            throw new InvalidOperationException("invalid_email");

        PropertyDocument? property = null;
        if (!string.IsNullOrWhiteSpace(request.PropertyId))
        {
            property = await Properties
                .Find(p => p.Id == request.PropertyId && p.CustomerId == customerId)
                .FirstOrDefaultAsync(ct);
        }

        var subscription = await GetOrCreateSubscriptionAsync(customerId, request, property, ct);

        var planName = request.PlanName
            ?? property?.PlanName
            ?? subscription.PlanName;

        var planCode = NormalizePaystackPlanCode(
            await servicePlans.ResolvePaystackPlanCodeAsync(planName, ct)
            ?? _options.ResolvePlanCode(planName));
        var catalogPrice = await ResolveCatalogPricePerVisitAsync(planName, ct);
        var amountCents = ResolveAmountCents(subscription, property, catalogPrice);
        var reference = BuildPaystackReference(customerId);

        var metadata = new Dictionary<string, string>
        {
            ["customer_id"] = customerId,
            ["property_id"] = property?.Id ?? request.PropertyId ?? "",
            ["plan_name"] = planName ?? "",
        };

        var (init, error, usedPlanCode) = await InitializeWithPlanFallbackAsync(
            email, amountCents, reference, planCode, metadata, customerId, ct);

        if (init?.AccessCode is null || init.Reference is null)
        {
            var detail = string.IsNullOrWhiteSpace(error) ? "unknown" : error.Trim();
            logger.LogWarning(
                "Paystack initialize failed for customer {CustomerId}: {Detail} (plan={PlanCode}, amountCents={AmountCents})",
                customerId,
                detail,
                usedPlanCode ?? planCode ?? "amount-only",
                amountCents);
            throw new InvalidOperationException($"paystack_initialize_failed: {detail}");
        }

        return new PaystackInitializeResponseDto(
            init.AccessCode,
            init.Reference,
            _options.PublicKey,
            email,
            usedPlanCode);
    }

    private async Task<(PaystackInitializeData? Init, string? Error, string? UsedPlanCode)> InitializeWithPlanFallbackAsync(
        string email,
        int amountCents,
        string reference,
        string? planCode,
        Dictionary<string, string> metadata,
        string customerId,
        CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(planCode))
        {
            var (init, error) = await api.InitializeTransactionAsync(
                email, amountCents, reference, planCode, metadata, ct);
            if (init?.AccessCode is not null && init.Reference is not null)
                return (init, null, planCode);

            if (IsInvalidPlanError(error))
            {
                logger.LogWarning(
                    "Paystack rejected plan {PlanCode} for customer {CustomerId}: {Error}. Retrying amount-only.",
                    planCode,
                    customerId,
                    error);
                var retryReference = BuildPaystackReference(customerId);
                var (retryInit, retryError) = await api.InitializeTransactionAsync(
                    email, amountCents, retryReference, null, metadata, ct);
                return (retryInit, retryError, null);
            }

            return (init, error, planCode);
        }

        var (amountOnlyInit, amountOnlyError) = await api.InitializeTransactionAsync(
            email, amountCents, reference, null, metadata, ct);
        return (amountOnlyInit, amountOnlyError, null);
    }

    private async Task<decimal?> ResolveCatalogPricePerVisitAsync(string? planKey, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(planKey)) return null;
        var catalog = await servicePlans.GetActiveCatalogAsync(ct);
        var plan = catalog.FirstOrDefault(p => p.Id == planKey || p.Name == planKey);
        return plan is { PricePerVisit: > 0 } ? plan.PricePerVisit : null;
    }

    private static string BuildPaystackReference(string customerId)
    {
        var suffix = Guid.NewGuid().ToString("N");
        var raw = $"sol{customerId.Replace("-", "", StringComparison.Ordinal)}{suffix}";
        var allowed = raw.Where(c => char.IsLetterOrDigit(c) || c is '-' or '.' or '=').ToArray();
        var reference = new string(allowed);
        return reference.Length <= 40 ? reference : reference[..40];
    }

    private static bool IsInvalidPlanError(string? error) =>
        !string.IsNullOrWhiteSpace(error) &&
        (error.Contains("plan", StringComparison.OrdinalIgnoreCase) ||
         error.Contains("invalid amount", StringComparison.OrdinalIgnoreCase));

    public async Task<PaystackVerifyResponseDto> VerifyTransactionAsync(
        string customerId,
        string reference,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(reference))
        {
            logger.LogWarning("Paystack verify called with empty reference for customer {CustomerId}.", customerId);
            return new PaystackVerifyResponseDto(false);
        }

        // The frontend popup's onSuccess can fire a beat before Paystack finalises the
        // charge, so a single verify can come back "pending"/"ongoing". Retry briefly.
        PaystackVerifyData? verified = null;
        string? lastError = null;
        const int maxAttempts = 5;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            (verified, lastError) = await api.VerifyTransactionAsync(reference, ct);
            if (verified is not null && string.Equals(verified.Status, "success", StringComparison.OrdinalIgnoreCase))
                break;

            logger.LogInformation(
                "Paystack verify attempt {Attempt}/{Max} for {Reference} (customer {CustomerId}) returned status '{Status}' (error '{Error}').",
                attempt,
                maxAttempts,
                reference,
                customerId,
                verified?.Status ?? "null",
                lastError ?? "none");

            if (attempt < maxAttempts)
                await Task.Delay(TimeSpan.FromSeconds(attempt + 1), ct);
        }

        if (verified is null || !string.Equals(verified.Status, "success", StringComparison.OrdinalIgnoreCase))
        {
            var detail = verified?.Status is { Length: > 0 } status
                ? $"Paystack reported status '{status}'."
                : lastError ?? "Paystack could not confirm the payment yet.";
            logger.LogWarning(
                "Paystack verify gave up for {Reference} (customer {CustomerId}) — status '{Status}', error '{Error}'.",
                reference,
                customerId,
                verified?.Status ?? "null",
                lastError ?? "none");
            return new PaystackVerifyResponseDto(false, Detail: detail);
        }

        await ApplySuccessfulChargeAsync(customerId, verified, ct);
        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);
        logger.LogInformation(
            "Paystack verify linked {Reference} for customer {CustomerId} (subscription status '{Status}').",
            reference,
            customerId,
            subscription?.Status ?? "unknown");
        return new PaystackVerifyResponseDto(
            true,
            subscription?.PaymentMethod,
            subscription?.Status);
    }

    public async Task<PaystackSubscriptionActionResponseDto> CancelSubscriptionAsync(
        string customerId,
        CancellationToken ct = default)
    {
        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);
        if (subscription is null || string.IsNullOrWhiteSpace(subscription.PaystackSubscriptionCode))
            return new PaystackSubscriptionActionResponseDto(false, "No Paystack subscription on file.");

        if (string.IsNullOrWhiteSpace(subscription.PaystackEmailToken))
            return new PaystackSubscriptionActionResponseDto(false, "Paystack email token missing — contact support.");

        var ok = await api.DisableSubscriptionAsync(
            subscription.PaystackSubscriptionCode,
            subscription.PaystackEmailToken,
            ct);
        if (!ok)
            return new PaystackSubscriptionActionResponseDto(false, "Paystack could not cancel the subscription.");

        subscription.Status = "cancelled";
        subscription.PaymentProvider = "paystack";
        await Subscriptions.ReplaceOneAsync(s => s.Id == subscription.Id, subscription, cancellationToken: ct);

        var properties = await Properties.Find(p => p.CustomerId == customerId).ToListAsync(ct);
        foreach (var property in properties)
        {
            property.SubscriptionStatus = "paused";
            await Properties.ReplaceOneAsync(p => p.Id == property.Id, property, cancellationToken: ct);
        }

        return new PaystackSubscriptionActionResponseDto(true, "Subscription cancelled.");
    }

    public async Task HandleWebhookAsync(string rawBody, string? signature, CancellationToken ct = default)
    {
        if (!VerifySignature(rawBody, signature))
        {
            logger.LogWarning("Rejected Paystack webhook — invalid signature.");
            throw new UnauthorizedAccessException("invalid_signature");
        }

        var payload = JsonSerializer.Deserialize<PaystackWebhookEvent>(rawBody);
        if (payload?.Event is null) return;

        switch (payload.Event)
        {
            case "charge.success":
                await HandleChargeSuccessAsync(payload.Data, ct);
                break;
            case "subscription.create":
                await HandleSubscriptionCreateAsync(payload.Data, ct);
                break;
            case "subscription.disable":
            case "subscription.not_renew":
                await HandleSubscriptionDisabledAsync(payload.Data, ct);
                break;
            case "invoice.payment_failed":
                await HandlePaymentFailedAsync(payload.Data, ct);
                break;
            default:
                logger.LogDebug("Ignoring Paystack event {Event}", payload.Event);
                break;
        }
    }

    private async Task HandleChargeSuccessAsync(JsonElement data, CancellationToken ct)
    {
        var customerId = ExtractCustomerId(data);
        if (customerId is null) return;

        var verifyShape = JsonSerializer.Deserialize<PaystackVerifyData>(data.GetRawText());
        if (verifyShape is null) return;

        await ApplySuccessfulChargeAsync(customerId, verifyShape, ct);
    }

    private async Task HandleSubscriptionCreateAsync(JsonElement data, CancellationToken ct)
    {
        var customerId = ExtractCustomerId(data);
        var subscriptionCode = data.TryGetProperty("subscription_code", out var codeEl)
            ? codeEl.GetString()
            : data.TryGetProperty("code", out var alt) ? alt.GetString() : null;
        var emailToken = data.TryGetProperty("email_token", out var tokenEl) ? tokenEl.GetString() : null;

        if (customerId is null || string.IsNullOrWhiteSpace(subscriptionCode)) return;

        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);
        if (subscription is null) return;

        subscription.PaystackSubscriptionCode = subscriptionCode;
        if (!string.IsNullOrWhiteSpace(emailToken))
            subscription.PaystackEmailToken = emailToken;
        subscription.PaymentProvider = "paystack";
        subscription.Status = "active";
        await Subscriptions.ReplaceOneAsync(s => s.Id == subscription.Id, subscription, cancellationToken: ct);
    }

    private async Task HandleSubscriptionDisabledAsync(JsonElement data, CancellationToken ct)
    {
        var subscriptionCode = data.TryGetProperty("subscription_code", out var codeEl)
            ? codeEl.GetString()
            : data.TryGetProperty("code", out var alt) ? alt.GetString() : null;
        if (string.IsNullOrWhiteSpace(subscriptionCode)) return;

        var subscription = await Subscriptions
            .Find(s => s.PaystackSubscriptionCode == subscriptionCode)
            .FirstOrDefaultAsync(ct);
        if (subscription is null) return;

        subscription.Status = "cancelled";
        await Subscriptions.ReplaceOneAsync(s => s.Id == subscription.Id, subscription, cancellationToken: ct);

        var properties = await Properties.Find(p => p.CustomerId == subscription.CustomerId).ToListAsync(ct);
        foreach (var property in properties)
        {
            property.SubscriptionStatus = "paused";
            await Properties.ReplaceOneAsync(p => p.Id == property.Id, property, cancellationToken: ct);
        }
    }

    private async Task HandlePaymentFailedAsync(JsonElement data, CancellationToken ct)
    {
        var customerId = ExtractCustomerId(data);
        if (customerId is null) return;

        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);
        if (subscription is null) return;

        subscription.Status = "payment_failed";
        await Subscriptions.ReplaceOneAsync(s => s.Id == subscription.Id, subscription, cancellationToken: ct);
    }

    private async Task ApplySuccessfulChargeAsync(string customerId, PaystackVerifyData charge, CancellationToken ct)
    {
        var customer = await Customers.Find(c => c.Id == customerId).FirstOrDefaultAsync(ct);
        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);

        if (charge.Customer?.CustomerCode is not null && customer is not null)
        {
            customer.PaystackCustomerCode = charge.Customer.CustomerCode;
            await Customers.ReplaceOneAsync(c => c.Id == customer.Id, customer, cancellationToken: ct);
        }

        var planName = charge.Plan?.Name
            ?? ExtractMetadata(charge.Metadata, "plan_name")
            ?? subscription?.PlanName;

        if (subscription is not null)
        {
            subscription.PaymentProvider = "paystack";
            subscription.Status = "active";
            subscription.PaymentMethod = FormatPaymentMethod(charge.Authorization);
            if (charge.Plan?.PlanCode is not null)
                subscription.PaystackPlanCode = charge.Plan.PlanCode;

            var nextBilling = DateTime.UtcNow.AddMonths(3);
            subscription.NextBillingDate = nextBilling.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            await Subscriptions.ReplaceOneAsync(s => s.Id == subscription.Id, subscription, cancellationToken: ct);
        }
        else
        {
            logger.LogWarning(
                "Paystack charge {Reference} succeeded for customer {CustomerId} but no subscription document was found.",
                charge.Reference,
                customerId);
        }

        var propertyId = ExtractMetadata(charge.Metadata, "property_id");
        if (!string.IsNullOrWhiteSpace(propertyId))
        {
            var property = await Properties
                .Find(p => p.Id == propertyId && p.CustomerId == customerId)
                .FirstOrDefaultAsync(ct);
            if (property is not null)
            {
                property.SubscriptionStatus = "active";
                if (string.IsNullOrWhiteSpace(property.PlanName) && !string.IsNullOrWhiteSpace(planName))
                    property.PlanName = planName;
                await Properties.ReplaceOneAsync(p => p.Id == property.Id, property, cancellationToken: ct);
                logger.LogInformation(
                    "Activated property {PropertyId} for customer {CustomerId} from Paystack charge {Reference}.",
                    propertyId,
                    customerId,
                    charge.Reference);
            }
            else
            {
                logger.LogWarning(
                    "Paystack charge {Reference} referenced property {PropertyId} for customer {CustomerId} but it was not found.",
                    charge.Reference,
                    propertyId,
                    customerId);
            }
        }
        else
        {
            var pending = await Properties
                .Find(p => p.CustomerId == customerId && p.SubscriptionStatus == "setup_required")
                .ToListAsync(ct);
            foreach (var property in pending)
            {
                property.SubscriptionStatus = "active";
                await Properties.ReplaceOneAsync(p => p.Id == property.Id, property, cancellationToken: ct);
            }
        }

        if (!string.IsNullOrWhiteSpace(charge.Reference))
        {
            var exists = await Payments.Find(p => p.PaystackReference == charge.Reference).AnyAsync(ct);
            if (!exists)
            {
                var amount = charge.Amount > 0 ? charge.Amount / 100m : subscription?.PricePerVisit ?? 0;
                await Payments.InsertOneAsync(new PaymentDocument
                {
                    Id = $"pay-{Guid.NewGuid():N}"[..12],
                    CustomerId = customerId,
                    Date = DateTime.UtcNow.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                    Description = charge.Plan?.Name ?? planName ?? subscription?.PlanName ?? "Paystack payment",
                    Amount = amount,
                    Status = "paid",
                    PaystackReference = charge.Reference,
                    PaymentProvider = "paystack",
                }, cancellationToken: ct);
            }
        }
    }

    private static string? ExtractCustomerId(JsonElement data)
    {
        if (data.TryGetProperty("metadata", out var metadata))
        {
            var fromMeta = ExtractMetadata(metadata, "customer_id");
            if (!string.IsNullOrWhiteSpace(fromMeta)) return fromMeta;
        }

        if (data.TryGetProperty("customer", out var customer) &&
            customer.TryGetProperty("metadata", out var customerMeta))
        {
            var fromMeta = ExtractMetadata(customerMeta, "customer_id");
            if (!string.IsNullOrWhiteSpace(fromMeta)) return fromMeta;
        }

        return null;
    }

    private static string? ExtractMetadata(JsonElement metadata, string key)
    {
        if (metadata.ValueKind == JsonValueKind.Object && metadata.TryGetProperty(key, out var direct))
            return direct.GetString();

        if (metadata.ValueKind == JsonValueKind.Object && metadata.TryGetProperty("custom_fields", out var fields))
        {
            foreach (var field in fields.EnumerateArray())
            {
                if (field.TryGetProperty("variable_name", out var name) &&
                    string.Equals(name.GetString(), key, StringComparison.OrdinalIgnoreCase) &&
                    field.TryGetProperty("value", out var value))
                    return value.GetString();
            }
        }

        return null;
    }

    private async Task<SubscriptionDocument> GetOrCreateSubscriptionAsync(
        string customerId,
        PaystackInitializeRequestDto request,
        PropertyDocument? property,
        CancellationToken ct)
    {
        var subscription = await Subscriptions.Find(s => s.CustomerId == customerId).FirstOrDefaultAsync(ct);
        if (subscription is not null)
            return subscription;

        var planName = request.PlanName ?? property?.PlanName;
        var catalog = await servicePlans.GetActiveCatalogAsync(ct);
        var plan = catalog.FirstOrDefault(p => p.Id == planName || p.Name == planName)
            ?? catalog.FirstOrDefault(p => p.Recommended)
            ?? catalog.FirstOrDefault();

        subscription = new SubscriptionDocument
        {
            Id = $"sub-{Guid.NewGuid():N}"[..12],
            CustomerId = customerId,
            PlanName = plan?.Name ?? planName ?? "Quarterly Solar Care",
            PlanDescription = plan?.Description ?? "",
            Status = "pending",
            PricePerVisit = property?.PricePerClean is > 0 ? property.PricePerClean!.Value : plan?.PricePerVisit ?? 499,
            AnnualPrice = plan?.AnnualPrice ?? 1996,
            BillingCycle = "Quarterly",
            NextBillingDate = DateOnly.FromDateTime(DateTime.UtcNow).AddDays(14).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            VisitsRemaining = property?.VisitsPerYear is > 0 ? property.VisitsPerYear!.Value : plan?.VisitsPerYear ?? 4,
            PaymentMethod = "To be added",
            Features = plan?.Features.ToList() ?? [],
        };

        await Subscriptions.InsertOneAsync(subscription, cancellationToken: ct);
        logger.LogInformation("Created missing subscription document for customer {CustomerId}", customerId);
        return subscription;
    }

    private static string? NormalizePaystackPlanCode(string? planCode)
    {
        if (string.IsNullOrWhiteSpace(planCode))
            return null;

        var trimmed = planCode.Trim();
        return trimmed.StartsWith("PLN_", StringComparison.OrdinalIgnoreCase) ? trimmed : null;
    }

    private static int ResolveAmountCents(
        SubscriptionDocument subscription,
        PropertyDocument? property,
        decimal? catalogPricePerVisit = null)
    {
        var amount = catalogPricePerVisit is > 0 ? catalogPricePerVisit.Value
            : property?.PricePerClean is > 0 ? property.PricePerClean!.Value
            : subscription.PricePerVisit;
        if (amount <= 0)
            amount = subscription.AnnualPrice > 0 ? subscription.AnnualPrice / 4 : 499;

        var cents = (int)Math.Round(amount * 100, MidpointRounding.AwayFromZero);
        return cents < 100 ? 49900 : cents;
    }

    private static bool IsValidCheckoutEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return string.Equals(addr.Address, email, StringComparison.OrdinalIgnoreCase)
                && email.Contains('@')
                && email.Contains('.');
        }
        catch
        {
            return false;
        }
    }

    private static string FormatPaymentMethod(PaystackAuthorizationData? auth)
    {
        if (auth is null) return "Paystack";
        if (!string.IsNullOrWhiteSpace(auth.CardType) && !string.IsNullOrWhiteSpace(auth.Last4))
            return $"{auth.CardType} •••• {auth.Last4}";
        if (!string.IsNullOrWhiteSpace(auth.Brand) && !string.IsNullOrWhiteSpace(auth.Last4))
            return $"{auth.Brand} •••• {auth.Last4}";
        if (!string.IsNullOrWhiteSpace(auth.Channel))
            return $"Paystack ({auth.Channel})";
        return "Paystack";
    }

    private bool VerifySignature(string rawBody, string? signature)
    {
        if (string.IsNullOrWhiteSpace(signature) || string.IsNullOrWhiteSpace(_options.SecretKey))
            return false;

        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_options.SecretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody));
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return string.Equals(computed, signature, StringComparison.OrdinalIgnoreCase);
    }
}
