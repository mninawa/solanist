using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Solanist.Infrastructure.Options;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoDataSeeder(IServiceProvider services, ILogger<MongoDataSeeder> logger) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IMongoDatabase>();

        try
        {
            var customers = db.GetCollection<CustomerDocument>(MongoCollections.Customers);
            var users = db.GetCollection<UserDocument>(MongoCollections.Users);

            var customerCount = await customers.CountDocumentsAsync(
                FilterDefinition<CustomerDocument>.Empty,
                cancellationToken: cancellationToken);

            if (customerCount == 0)
            {
                logger.LogInformation("Seeding MongoDB with demo client data...");

                await customers.InsertOneAsync(MongoSeedData.Customer, cancellationToken: cancellationToken);
                await db.GetCollection<PropertyDocument>(MongoCollections.Properties)
                    .InsertManyAsync(MongoSeedData.Properties, cancellationToken: cancellationToken);
                await db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions)
                    .InsertOneAsync(MongoSeedData.Subscription, cancellationToken: cancellationToken);
                await db.GetCollection<PaymentDocument>(MongoCollections.Payments)
                    .InsertManyAsync(MongoSeedData.Payments, cancellationToken: cancellationToken);
                await db.GetCollection<BookingDocument>(MongoCollections.Bookings)
                    .InsertManyAsync(MongoSeedData.Bookings, cancellationToken: cancellationToken);
                await db.GetCollection<ReportDocument>(MongoCollections.Reports)
                    .InsertManyAsync(MongoSeedData.Reports, cancellationToken: cancellationToken);

                logger.LogInformation("MongoDB client seed completed.");
            }
            else
            {
                logger.LogInformation("MongoDB client data already present — skipping client seed.");
            }

            var userCount = await users.CountDocumentsAsync(
                FilterDefinition<UserDocument>.Empty,
                cancellationToken: cancellationToken);

            if (userCount == 0)
            {
                logger.LogInformation("Seeding MongoDB demo users...");
                await users.InsertManyAsync(MongoSeedData.Users, cancellationToken: cancellationToken);
                logger.LogInformation("MongoDB user seed completed.");
            }

            var staffJobs = db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);
            var staffJobCount = await staffJobs.CountDocumentsAsync(
                FilterDefinition<StaffJobDocument>.Empty,
                cancellationToken: cancellationToken);

            if (staffJobCount == 0)
            {
                logger.LogInformation("Seeding MongoDB staff jobs...");
                await staffJobs.InsertManyAsync(StaffSeedData.Jobs, cancellationToken: cancellationToken);
                logger.LogInformation("MongoDB staff job seed completed.");
            }

            await MaintainStaffJobsAsync(staffJobs, cancellationToken);
            await DemoDataMaintenance.MaintainAsync(db, logger, cancellationToken);

            var leads = db.GetCollection<LeadDocument>(MongoCollections.Leads);
            var leadCount = await leads.CountDocumentsAsync(
                FilterDefinition<LeadDocument>.Empty,
                cancellationToken: cancellationToken);

            if (leadCount == 0)
            {
                logger.LogInformation("Seeding MongoDB admin leads...");
                await leads.InsertManyAsync(AdminSeedData.Leads, cancellationToken: cancellationToken);
                logger.LogInformation("MongoDB admin lead seed completed.");
            }

            var invites = db.GetCollection<InviteDocument>(MongoCollections.Invites);
            var inviteCount = await invites.CountDocumentsAsync(
                FilterDefinition<InviteDocument>.Empty,
                cancellationToken: cancellationToken);

            if (inviteCount == 0)
            {
                logger.LogInformation("Seeding MongoDB invites...");
                await invites.InsertManyAsync(InviteSeedData.Invites, cancellationToken: cancellationToken);
                logger.LogInformation("MongoDB invite seed completed.");
            }

            var servicePlans = db.GetCollection<ServicePlanDocument>(MongoCollections.ServicePlans);
            var planCount = await servicePlans.CountDocumentsAsync(
                FilterDefinition<ServicePlanDocument>.Empty,
                cancellationToken: cancellationToken);

            if (planCount == 0)
            {
                var paystack = scope.ServiceProvider.GetService<IOptions<PaystackOptions>>()?.Value;
                logger.LogInformation("Seeding MongoDB service plans...");
                await servicePlans.InsertManyAsync(ServicePlanSeedData.Build(paystack), cancellationToken: cancellationToken);
                logger.LogInformation("MongoDB service plan seed completed.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "MongoDB seed failed.");
        }
    }

    private static async Task MaintainStaffJobsAsync(
        IMongoCollection<StaffJobDocument> staffJobs,
        CancellationToken cancellationToken)
    {
        await staffJobs.UpdateManyAsync(
            j => j.StaffId == null || j.StaffId == "",
            Builders<StaffJobDocument>.Update.Set(j => j.StaffId, StaffJobQueries.DefaultStaffId),
            cancellationToken: cancellationToken);

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        await staffJobs.UpdateManyAsync(
            j => j.CompletedAt == null && j.ScheduledDate == StaffSeedData.DemoToday,
            Builders<StaffJobDocument>.Update.Set(j => j.ScheduledDate, today),
            cancellationToken: cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
