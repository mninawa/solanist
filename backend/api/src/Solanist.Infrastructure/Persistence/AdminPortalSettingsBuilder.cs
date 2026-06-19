using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Options;

namespace Solanist.Infrastructure.Persistence;

internal static class AdminPortalSettingsBuilder
{
    public static AdminPortalSettingsDto Build(
        IHostEnvironment environment,
        MongoOptions mongoOptions,
        AuthOptions authOptions,
        WebhookOptions webhookOptions,
        S3Options s3Options,
        PaystackOptions paystackOptions,
        EmailOptions emailOptions,
        WhatsAppOptions whatsAppOptions,
        AdminPortalCountsDto counts,
        bool mongoConnected,
        int? paystackLinkedPlanCount = null,
        bool? s3Connected = null)
    {
        var integrations = new List<AdminIntegrationStatusDto>
        {
            BuildMongo(mongoOptions, mongoConnected),
            BuildBark(webhookOptions),
            BuildPaystack(paystackOptions, paystackLinkedPlanCount),
            BuildS3(s3Options, s3Connected),
            BuildEmail(emailOptions),
            BuildWhatsApp(whatsAppOptions),
        };

        return new AdminPortalSettingsDto(
            environment.EnvironmentName,
            mongoOptions.DatabaseName,
            authOptions.AppBaseUrl,
            authOptions.ExposeResetLinks,
            mongoConnected,
            integrations,
            counts);
    }

    private static AdminIntegrationStatusDto BuildMongo(MongoOptions options, bool connected) =>
        connected
            ? new("mongo", "MongoDB", "connected", $"Database: {options.DatabaseName}")
            : new("mongo", "MongoDB", "not_configured", "Set Mongo__ConnectionString to enable live data");

    private static AdminIntegrationStatusDto BuildBark(WebhookOptions options) =>
        string.IsNullOrWhiteSpace(options.BarkSecret) || options.BarkSecret == "demo-bark-secret"
            ? new("bark", "Bark webhooks", "demo", "Demo secret — configure Webhooks__BarkSecret for production")
            : new("bark", "Bark webhooks", "connected", "Webhook secret configured");

    private static AdminIntegrationStatusDto BuildPaystack(PaystackOptions options, int? linkedPlanCount)
    {
        if (!options.IsEnabled)
            return new("paystack", "Paystack billing", "not_configured", "Set Paystack__SecretKey and Paystack__PublicKey");

        var mappedPlans = linkedPlanCount ?? options.Plans.Count(p => !string.IsNullOrWhiteSpace(p.Value));
        return mappedPlans > 0
            ? new("paystack", "Paystack billing", "connected", $"{mappedPlans} plan(s) linked in catalogue")
            : new("paystack", "Paystack billing", "demo", "Keys set — link plan codes in Settings");
    }

    private static AdminIntegrationStatusDto BuildS3(S3Options options, bool? connected)
    {
        if (string.IsNullOrWhiteSpace(options.BucketName))
            return new("s3", "Staff photo uploads", "not_configured", "Set S3__BucketName");

        if (!S3Options.HasAwsCredentials(options))
            return new("s3", "Staff photo uploads", "demo", $"Bucket {options.BucketName} — AWS credentials not set (mock uploads)");

        if (connected == false)
            return new("s3", "Staff photo uploads", "demo", $"Bucket {options.BucketName} — credentials set but connection failed (check region)");

        return new("s3", "Staff photo uploads", "connected", $"Bucket {options.BucketName} ({options.Region})");
    }

    private static AdminIntegrationStatusDto BuildEmail(EmailOptions options) =>
        options.IsEnabled
            ? new("email", "Email (Postmark)", "connected", $"From: {options.FromAddress}")
            : new("email", "Email (Postmark)", "not_configured", "Set Email__PostmarkServerToken and Email__FromAddress");

    private static AdminIntegrationStatusDto BuildWhatsApp(WhatsAppOptions options) =>
        options.IsEnabled
            ? new("whatsapp", "WhatsApp (WasenderAPI)", "connected", "Invite messages sent via WasenderAPI")
            : new("whatsapp", "WhatsApp (WasenderAPI)", "not_configured", "Set WhatsApp__ApiKey for live invite delivery");
}
