using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class DemoDataMaintenance
{
    public static async Task MaintainAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        await UpsertStaffUsersAsync(db, logger, cancellationToken);
        await UpsertSuperAdminUsersAsync(db, logger, cancellationToken);
        await UpsertExtraCustomersAsync(db, logger, cancellationToken);
        await FixStaffJobLinksAsync(db, cancellationToken);
        await UpsertDemoJobIssueAsync(db, cancellationToken);
        await ResetDemoFieldJobAsync(db, logger, cancellationToken);
        await RefreshFunnelInviteExpiryAsync(db, cancellationToken);
        await ResetDemoLoginPasswordsAsync(db, cancellationToken);
        await UpsertFutureStaffJobsAsync(db, logger, cancellationToken);
        await UpsertDashboardPaymentsAsync(db, logger, cancellationToken);
    }

    private static async Task UpsertFutureStaffJobsAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var staffJobs = db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var job in FutureStaffJobsSeed.Jobs(today))
        {
            var exists = await staffJobs.Find(j => j.Id == job.Id).AnyAsync(cancellationToken);
            if (exists) continue;

            await staffJobs.InsertOneAsync(job, cancellationToken: cancellationToken);
            logger.LogInformation(
                "Added future staff job {JobId} on {Date} for {StaffId}.",
                job.Id,
                job.ScheduledDate,
                job.StaffId);
        }
    }

    private static async Task UpsertStaffUsersAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var users = db.GetCollection<UserDocument>(MongoCollections.Users);

        foreach (var staffUser in ExtraDemoSeedData.ExtraStaffUsers)
        {
            var exists = await users.Find(u =>
                    u.StaffId == staffUser.StaffId || u.Email == staffUser.Email)
                .AnyAsync(cancellationToken);

            if (exists) continue;

            await users.InsertOneAsync(staffUser, cancellationToken: cancellationToken);
            logger.LogInformation("Added demo staff user {StaffId} ({Email}).", staffUser.StaffId, staffUser.Email);
        }
    }

    private static async Task UpsertSuperAdminUsersAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var users = db.GetCollection<UserDocument>(MongoCollections.Users);

        foreach (var adminUser in SuperAdminSeedData.Users)
        {
            var existing = await users.Find(u => u.Email == adminUser.Email).FirstOrDefaultAsync(cancellationToken);
            if (existing is null)
            {
                await users.InsertOneAsync(adminUser, cancellationToken: cancellationToken);
                logger.LogInformation("Added super admin user {Email}.", adminUser.Email);
                continue;
            }

            if (existing.Role != "admin")
            {
                await users.UpdateOneAsync(
                    u => u.Id == existing.Id,
                    Builders<UserDocument>.Update.Set(u => u.Role, "admin"),
                    cancellationToken: cancellationToken);
                logger.LogInformation("Promoted {Email} to admin.", adminUser.Email);
            }
        }
    }

    private static async Task UpsertExtraCustomersAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var customers = db.GetCollection<CustomerDocument>(MongoCollections.Customers);
        var properties = db.GetCollection<PropertyDocument>(MongoCollections.Properties);
        var subscriptions = db.GetCollection<SubscriptionDocument>(MongoCollections.Subscriptions);
        var users = db.GetCollection<UserDocument>(MongoCollections.Users);

        foreach (var bundle in ExtraDemoSeedData.Bundles)
        {
            var exists = await customers.Find(c => c.Id == bundle.Customer.Id).AnyAsync(cancellationToken);
            if (exists) continue;

            logger.LogInformation("Adding demo customer {CustomerId} ({Name})...",
                bundle.Customer.Id,
                $"{bundle.Customer.FirstName} {bundle.Customer.LastName}");

            await customers.InsertOneAsync(bundle.Customer, cancellationToken: cancellationToken);
            await properties.InsertManyAsync(bundle.Properties, cancellationToken: cancellationToken);
            await subscriptions.InsertOneAsync(bundle.Subscription, cancellationToken: cancellationToken);
            await users.InsertOneAsync(bundle.User, cancellationToken: cancellationToken);
        }
    }

    private static async Task FixStaffJobLinksAsync(
        IMongoDatabase db,
        CancellationToken cancellationToken)
    {
        var staffJobs = db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);

        await staffJobs.UpdateOneAsync(
            j => j.Id == "job-001",
            Builders<StaffJobDocument>.Update
                .Set(j => j.CustomerId, "cust-003")
                .Set(j => j.PropertyId, "prop-linda-001"),
            cancellationToken: cancellationToken);

        await staffJobs.UpdateOneAsync(
            j => j.Id == "job-003",
            Builders<StaffJobDocument>.Update
                .Set(j => j.CustomerId, "cust-002")
                .Set(j => j.PropertyId, "prop-david-001")
                .Set(j => j.StaffId, "staff-002"),
            cancellationToken: cancellationToken);
    }

    private static async Task UpsertDemoJobIssueAsync(
        IMongoDatabase db,
        CancellationToken cancellationToken)
    {
        var staffJobs = db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);
        var issue = new StaffJobIssueDocument
        {
            IssueType = "no_access",
            Description = "Gate code not working — customer unreachable.",
            ReportedAt = DateTime.UtcNow.AddMinutes(-35).ToString("O"),
        };

        await staffJobs.UpdateOneAsync(
            j => j.Id == "job-003" && j.CompletedAt == null,
            Builders<StaffJobDocument>.Update
                .Set(j => j.Issue, issue)
                .Set(j => j.OnTheWay, true)
                .Set(j => j.Arrived, true)
                .Set(j => j.CheckedInAt, DateTime.UtcNow.AddMinutes(-40).ToString("O")),
            cancellationToken: cancellationToken);
    }

    private static async Task ResetDemoFieldJobAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var staffJobs = db.GetCollection<StaffJobDocument>(MongoCollections.StaffJobs);
        var job = await staffJobs
            .Find(j => j.Id == StaffSeedData.DemoFieldJobId)
            .FirstOrDefaultAsync(cancellationToken);

        if (job is null) return;

        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        StaffSeedData.ResetWorkflowState(job, today);
        await staffJobs.ReplaceOneAsync(j => j.Id == job.Id, job, cancellationToken: cancellationToken);
        logger.LogInformation(
            "Reset demo field job {JobId} ({Address}) for today's workflow walkthrough.",
            job.Id,
            job.Address);
    }

    private static async Task RefreshFunnelInviteExpiryAsync(
        IMongoDatabase db,
        CancellationToken cancellationToken)
    {
        var invites = db.GetCollection<InviteDocument>(MongoCollections.Invites);
        var expiry = DateTime.UtcNow.AddDays(30);

        await invites.UpdateOneAsync(
            i => i.Code == "PK9M4R" && i.Status == "pending",
            Builders<InviteDocument>.Update.Set(i => i.ExpiresAt, expiry),
            cancellationToken: cancellationToken);

        await invites.UpdateOneAsync(
            i => i.Code == "NB7XK2" && i.Status == "pending",
            Builders<InviteDocument>.Update.Set(i => i.ExpiresAt, expiry),
            cancellationToken: cancellationToken);
    }

    private static async Task ResetDemoLoginPasswordsAsync(
        IMongoDatabase db,
        CancellationToken cancellationToken)
    {
        var users = db.GetCollection<UserDocument>(MongoCollections.Users);
        var demoEmails = new[]
        {
            "nicolette.botha@email.com",
            "admin@solanist.co.za",
            "james.staff@solanist.co.za",
        };

        var filter = Builders<UserDocument>.Filter.In(u => u.Email, demoEmails);
        await users.UpdateManyAsync(
            filter,
            Builders<UserDocument>.Update.Unset(u => u.Password),
            cancellationToken: cancellationToken);
    }

    private static async Task UpsertDashboardPaymentsAsync(
        IMongoDatabase db,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        var payments = db.GetCollection<PaymentDocument>(MongoCollections.Payments);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var payment in DashboardPaymentsSeed.Payments(today))
        {
            var filter = Builders<PaymentDocument>.Filter.Eq(p => p.Id, payment.Id);
            var existing = await payments.Find(filter).FirstOrDefaultAsync(cancellationToken);
            if (existing is not null)
            {
                await payments.ReplaceOneAsync(filter, payment, cancellationToken: cancellationToken);
                continue;
            }

            await payments.InsertOneAsync(payment, cancellationToken: cancellationToken);
            logger.LogInformation("Added dashboard payment {PaymentId}.", payment.Id);
        }
    }
}
