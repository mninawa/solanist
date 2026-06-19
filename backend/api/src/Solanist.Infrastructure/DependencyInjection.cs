using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Infrastructure.Auth;
using Solanist.Infrastructure.Email;
using Solanist.Infrastructure.Mock;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence;
using Solanist.Infrastructure.Paystack;
using Solanist.Infrastructure.Storage;
using Solanist.Infrastructure.WhatsApp;

namespace Solanist.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<ICurrentUser, CurrentUser>();
        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        var authSection = configuration.GetSection(AuthOptions.SectionName);
        var authOptions = authSection.Get<AuthOptions>() ?? new AuthOptions();
        if (!string.IsNullOrWhiteSpace(authOptions.GoogleClientId))
            services.AddSingleton<IGoogleIdTokenValidator, GoogleIdTokenValidator>();
        else
            services.AddSingleton<IGoogleIdTokenValidator, DisabledGoogleIdTokenValidator>();

        services.AddSingleton<ITokenService, JwtTokenService>();

        services.AddSingleton<IInviteService, MockInviteService>();

        var mongoSection = configuration.GetSection(MongoOptions.SectionName);
        services.Configure<MongoOptions>(mongoSection);
        services.Configure<WebhookOptions>(configuration.GetSection(WebhookOptions.SectionName));
        services.Configure<S3Options>(configuration.GetSection(S3Options.SectionName));
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        var emailOptions = configuration.GetSection(EmailOptions.SectionName).Get<EmailOptions>() ?? new EmailOptions();
        if (emailOptions.IsEnabled)
        {
            services.AddHttpClient<IEmailService, PostmarkEmailService>(client =>
                client.BaseAddress = new Uri("https://api.postmarkapp.com/"));
        }
        else
        {
            services.AddSingleton<IEmailService, DisabledEmailService>();
        }

        services.Configure<WhatsAppOptions>(configuration.GetSection(WhatsAppOptions.SectionName));
        var whatsAppOptions = configuration.GetSection(WhatsAppOptions.SectionName).Get<WhatsAppOptions>() ?? new WhatsAppOptions();
        if (whatsAppOptions.IsEnabled)
        {
            services.AddHttpClient<IWhatsAppService, WasenderWhatsAppService>(client =>
            {
                var baseUrl = string.IsNullOrWhiteSpace(whatsAppOptions.BaseUrl)
                    ? "https://www.wasenderapi.com/api/"
                    : whatsAppOptions.BaseUrl;
                if (!baseUrl.EndsWith('/'))
                    baseUrl += "/";
                client.BaseAddress = new Uri(baseUrl);
            });
        }
        else
        {
            services.AddSingleton<IWhatsAppService, DisabledWhatsAppService>();
        }

        var s3Options = configuration.GetSection(S3Options.SectionName).Get<S3Options>() ?? new S3Options();
        if (!string.IsNullOrWhiteSpace(s3Options.BucketName) && S3Options.HasAwsCredentials(s3Options))
            services.AddSingleton<IFileStorageService, S3FileStorageService>();
        else
            services.AddSingleton<IFileStorageService, DisabledFileStorageService>();

        services.Configure<PaystackOptions>(configuration.GetSection(PaystackOptions.SectionName));
        var paystackOptions = configuration.GetSection(PaystackOptions.SectionName).Get<PaystackOptions>() ?? new PaystackOptions();
        var mongoConnection = mongoSection.Get<MongoOptions>()?.ConnectionString;
        if (paystackOptions.IsEnabled && !string.IsNullOrWhiteSpace(mongoConnection))
        {
            services.AddHttpClient<PaystackApiClient>(client => client.BaseAddress = new Uri("https://api.paystack.co"));
            services.AddSingleton<IPaystackBillingService, PaystackBillingService>();
        }
        else
        {
            services.AddSingleton<IPaystackBillingService, DisabledPaystackBillingService>();
        }

        var mongoOptions = mongoSection.Get<MongoOptions>();

        if (!string.IsNullOrWhiteSpace(mongoOptions?.ConnectionString))
        {
            services.AddSingleton<IMongoClient>(_ => new MongoClient(mongoOptions.ConnectionString));
            services.AddSingleton(sp =>
            {
                var client = sp.GetRequiredService<IMongoClient>();
                var opts = sp.GetRequiredService<IOptions<MongoOptions>>().Value;
                return client.GetDatabase(opts.DatabaseName);
            });
            services.AddSingleton<IServicePlanCatalog, ServicePlanService>();
            services.AddSingleton<IClientService, MongoClientService>();
            services.AddSingleton<IAuthService, MongoAuthService>();
            services.AddSingleton<IStaffService, MongoStaffService>();
            services.AddSingleton<IAdminService, MongoAdminService>();
            services.AddSingleton<IInviteService, MongoInviteService>();
            services.AddSingleton<IJobReportPublisher, MongoJobReportPublisher>();
            services.AddHostedService<MongoDataSeeder>();
        }
        else
        {
            services.AddSingleton<IServicePlanCatalog, MockServicePlanCatalog>();
            services.AddSingleton<IClientService, MockClientService>();
            services.AddSingleton<IAuthService, MockAuthService>();
            services.AddSingleton<IStaffService, MockStaffService>();
            services.AddSingleton<IAdminService, MockAdminService>();
            services.AddSingleton<IJobReportPublisher, MockJobReportPublisher>();
        }

        return services;
    }
}
