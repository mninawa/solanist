using MongoDB.Driver;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

public sealed class MongoJobReportPublisher(IMongoDatabase db) : IJobReportPublisher
{
    private IMongoCollection<ReportDocument> Reports =>
        db.GetCollection<ReportDocument>(MongoCollections.Reports);

    private IMongoCollection<CustomerDocument> Customers =>
        db.GetCollection<CustomerDocument>(MongoCollections.Customers);

    private IMongoCollection<BookingDocument> Bookings =>
        db.GetCollection<BookingDocument>(MongoCollections.Bookings);

    public async Task<CleaningReportDto?> PublishAsync(
        PublishJobReportRequest request,
        string staffName,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.CustomerId))
            return null;

        var completedAt = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var kwhGain =
            request.BeforeKwhReading is not null &&
            request.AfterKwhReading is not null &&
            request.AfterKwhReading >= request.BeforeKwhReading
                ? request.AfterKwhReading - request.BeforeKwhReading
                : null;

        var reportId = $"report-job-{request.JobId}";
        var propertyAddress = $"{request.Address}, {request.City}, {request.Postcode}";

        var doc = new ReportDocument
        {
            Id = reportId,
            CustomerId = request.CustomerId,
            PropertyId = request.PropertyId,
            BookingId = request.BookingId,
            CompletedAt = completedAt,
            ServiceType = "Solar Panel Cleaning Report",
            PanelCount = request.PanelCount,
            StaffName = staffName,
            PropertyAddress = propertyAddress,
            PlanName = request.PlanName,
            SystemSizeKw = request.SystemSizeKw,
            RoofType = request.RoofType,
            AccessNotes = request.AccessNotes,
            PropertyImageUrl = request.PropertyImageUrl,
            BeforePhotos = request.BeforePhotos.ToList(),
            AfterPhotos = request.AfterPhotos.ToList(),
            ChecklistSummary = request.ChecklistSummary.ToList(),
            StaffNotes = request.StaffNotes,
            BeforeKwhReading = request.BeforeKwhReading,
            AfterKwhReading = request.AfterKwhReading,
            KwhGain = kwhGain,
            Status = "completed",
        };

        await Reports.ReplaceOneAsync(
            r => r.Id == reportId,
            doc,
            new ReplaceOptions { IsUpsert = true },
            ct);

        await Customers.UpdateOneAsync(
            c => c.Id == request.CustomerId,
            Builders<CustomerDocument>.Update.Set(c => c.ReportsPublished, true),
            cancellationToken: ct);

        if (!string.IsNullOrWhiteSpace(request.BookingId))
        {
            await Bookings.UpdateOneAsync(
                b => b.Id == request.BookingId && b.CustomerId == request.CustomerId,
                Builders<BookingDocument>.Update
                    .Set(b => b.Status, "completed")
                    .Set(b => b.ConfirmationStatus, "confirmed"),
                cancellationToken: ct);
        }

        return MongoMappers.ToReportDto(doc);
    }
}
