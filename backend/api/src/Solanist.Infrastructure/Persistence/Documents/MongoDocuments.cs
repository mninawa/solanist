using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Solanist.Infrastructure.Persistence.Documents;

public static class MongoCollections
{
    public const string Users = "users";
    public const string Customers = "customers";
    public const string Properties = "properties";
    public const string Bookings = "bookings";
    public const string Reports = "reports";
    public const string Subscriptions = "subscriptions";
    public const string Payments = "payments";
    public const string StaffJobs = "staff_jobs";
    public const string Leads = "leads";
    public const string Invites = "invites";
    public const string ServicePlans = "service_plans";
    public const string Notifications = "notifications";
}

[BsonIgnoreExtraElements]
public sealed class NotificationDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string RecipientStaffId { get; set; } = "";
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public string Type { get; set; } = "info";
    public string? BookingId { get; set; }
    public string? BookingRef { get; set; }
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

[BsonIgnoreExtraElements]
public sealed class ServicePlanDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal PricePerVisit { get; set; }
    public int VisitsPerYear { get; set; }
    public decimal AnnualPrice { get; set; }
    public string IntervalLabel { get; set; } = "per visit";
    public List<string> Features { get; set; } = [];
    public bool Popular { get; set; }
    public bool Active { get; set; } = true;
    public string? PaystackPlanCode { get; set; }
    public string PaystackInterval { get; set; } = "quarterly";
    public int SortOrder { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class UserDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string Email { get; set; } = "";
    public string? Password { get; set; }
    public string Role { get; set; } = "client";
    public string? CustomerId { get; set; }
    public string? StaffId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string? Phone { get; set; }
    public string? GoogleId { get; set; }
    public string? PasswordResetToken { get; set; }
    public string? PasswordResetExpiresAt { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class CustomerDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string Email { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string PreferredContact { get; set; } = "whatsapp";
    public bool EmailReminders { get; set; } = true;
    public bool WhatsAppReminders { get; set; } = true;
    public string BillingMode { get; set; } = "combined";
    public bool ReportsPublished { get; set; } = true;
    public string Greeting { get; set; } = "Good morning";
    public List<string> ValueProps { get; set; } = [];
    public string? SystemStatus { get; set; }
    public string? PaystackCustomerCode { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class PropertyDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string CustomerId { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string Postcode { get; set; } = "";
    public int PanelCount { get; set; }
    public string RoofType { get; set; } = "";
    public string? AccessNotes { get; set; }
    public double? SystemSizeKw { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsPrimary { get; set; }
    public string SubscriptionStatus { get; set; } = "active";
    public string? PlanName { get; set; }
    public string? PlanVariant { get; set; }
    public string? PlanFrequency { get; set; }
    public string? NextCleanDate { get; set; }
    public string? NextCleanTimeSlot { get; set; }
    public decimal? PricePerClean { get; set; }
    public int? VisitsPerYear { get; set; }
    public int? VisitsRemaining { get; set; }
    public decimal? MonthlyBilling { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class BookingDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string CustomerId { get; set; } = "";
    public string? BookingRef { get; set; }
    public string? PropertyId { get; set; }
    public string Date { get; set; } = "";
    public string TimeSlot { get; set; } = "";
    public string Status { get; set; } = "";
    public string ServiceType { get; set; } = "";
    public string PropertyAddress { get; set; } = "";
    public string? PropertyPostcode { get; set; }
    public string? PlanName { get; set; }
    public string? StaffId { get; set; }
    public string? StaffName { get; set; }
    public string? ConfirmationStatus { get; set; }
    public string? BookedOn { get; set; }
    public string? ServiceDuration { get; set; }
    public int? PanelCount { get; set; }
    public double? SystemSizeKw { get; set; }
    public string? RoofType { get; set; }
    public string? AccessNotes { get; set; }
    public string? SpecialInstructions { get; set; }
    public string? BillingNote { get; set; }
    public bool IsNextBooking { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class ReportDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string CustomerId { get; set; } = "";
    public string? PropertyId { get; set; }
    public string? BookingId { get; set; }
    public string CompletedAt { get; set; } = "";
    public string ServiceType { get; set; } = "";
    public int PanelCount { get; set; }
    public string StaffName { get; set; } = "";
    public string PropertyAddress { get; set; } = "";
    public string? PlanName { get; set; }
    public double? SystemSizeKw { get; set; }
    public string? RoofType { get; set; }
    public string? AccessNotes { get; set; }
    public string? PropertyImageUrl { get; set; }
    public List<string> BeforePhotos { get; set; } = [];
    public List<string> AfterPhotos { get; set; } = [];
    public List<string> ChecklistSummary { get; set; } = [];
    public string StaffNotes { get; set; } = "";
    public double? BeforeKwhReading { get; set; }
    public double? AfterKwhReading { get; set; }
    public double? KwhGain { get; set; }
    public string Status { get; set; } = "completed";
}

[BsonIgnoreExtraElements]
public sealed class SubscriptionDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string CustomerId { get; set; } = "";
    public string PlanName { get; set; } = "";
    public string PlanDescription { get; set; } = "";
    public string Status { get; set; } = "active";
    public decimal PricePerVisit { get; set; }
    public decimal AnnualPrice { get; set; }
    public string BillingCycle { get; set; } = "";
    public string NextBillingDate { get; set; } = "";
    public string NextCleanDate { get; set; } = "";
    public int VisitsRemaining { get; set; }
    public string PaymentMethod { get; set; } = "";
    public List<string> Features { get; set; } = [];
    public string PaymentProvider { get; set; } = "manual";
    public string? PaystackSubscriptionCode { get; set; }
    public string? PaystackPlanCode { get; set; }
    public string? PaystackEmailToken { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class PaymentDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string CustomerId { get; set; } = "";
    public string Date { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Amount { get; set; }
    public string Status { get; set; } = "paid";
    public string PaymentProvider { get; set; } = "manual";
    public string? PaystackReference { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class StaffJobDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string StaffId { get; set; } = "";
    public string BookingId { get; set; } = "";
    public string PropertyId { get; set; } = "";
    public string CustomerId { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string Postcode { get; set; } = "";
    public string ServiceType { get; set; } = "Solar Panel Cleaning";
    public string PlanType { get; set; } = "";
    public string ScheduledTime { get; set; } = "";
    public string ScheduledDate { get; set; } = "";
    public string Status { get; set; } = "scheduled";
    public int RouteOrder { get; set; }
    public int PanelCount { get; set; }
    public double SystemSizeKw { get; set; }
    public string RoofType { get; set; } = "";
    public string AccessShort { get; set; } = "";
    public string AccessNotes { get; set; } = "";
    public string HeroImageUrl { get; set; } = "";
    public string Instructions { get; set; } = "";
    public List<StaffChecklistItemDocument> Checklist { get; set; } = [];
    public List<StaffPhotoSlotDocument> PhotoSlots { get; set; } = [];
    public List<string> BeforePhotos { get; set; } = [];
    public List<string> AfterPhotos { get; set; } = [];
    public double? BeforeKwhReading { get; set; }
    public double? AfterKwhReading { get; set; }
    public string? CheckedInAt { get; set; }
    public double? CheckInLatitude { get; set; }
    public double? CheckInLongitude { get; set; }
    public string? CheckInNote { get; set; }
    public string? CompletedAt { get; set; }
    public string? CompletionNotes { get; set; }
    public bool OnTheWay { get; set; }
    public bool Arrived { get; set; }
    public StaffJobIssueDocument? Issue { get; set; }
}

public sealed class StaffChecklistItemDocument
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public bool Completed { get; set; }
    public bool Required { get; set; }
}

public sealed class StaffPhotoSlotDocument
{
    public string Id { get; set; } = "";
    public string Label { get; set; } = "";
    public string Type { get; set; } = "";
    public bool Required { get; set; }
    public string? PhotoUrl { get; set; }
}

public sealed class StaffJobIssueDocument
{
    public string IssueType { get; set; } = "";
    public string Description { get; set; } = "";
    public string ReportedAt { get; set; } = "";
}

[BsonIgnoreExtraElements]
public sealed class LeadDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string Source { get; set; } = "";
    public string Status { get; set; } = "";
    public string PipelineStage { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public string PropertyAddress { get; set; } = "";
    public string City { get; set; } = "";
    public string? Postcode { get; set; }
    public string? Province { get; set; }
    public int PanelCount { get; set; }
    public string? EstimatedPanelsRange { get; set; }
    public string RoofType { get; set; } = "";
    public string? AccessNotes { get; set; }
    public string? PreferredServiceTime { get; set; }
    public string? PropertyType { get; set; }
    public string Notes { get; set; } = "";
    public string RequestSnippet { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public string Urgency { get; set; } = "normal";
    public int LeadScore { get; set; }
    public string ServiceType { get; set; } = "";
    public string? BestTimeToContact { get; set; }
    public string? PreferredContact { get; set; }
    public string? QuoteRef { get; set; }
    public string? InviteCode { get; set; }
    public string? InviteLink { get; set; }
    public string? RecommendedPlan { get; set; }
    public string? ConversationNotes { get; set; }
    public List<LeadTagDocument> Tags { get; set; } = [];
    public List<LeadActivityDocument> Activities { get; set; } = [];
    public List<LeadChecklistItemDocument> Checklist { get; set; } = [];
    public List<LeadNearbyLeadDocument> NearbyLeads { get; set; } = [];
    public LeadQuoteSummaryDocument? QuoteSummary { get; set; }
}

public sealed class LeadTagDocument
{
    public string Label { get; set; } = "";
    public string Tone { get; set; } = "";
}

public sealed class LeadActivityDocument
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Timestamp { get; set; } = "";
}

public sealed class LeadChecklistItemDocument
{
    public string Label { get; set; } = "";
    public bool Done { get; set; }
    public string? Date { get; set; }
}

public sealed class LeadNearbyLeadDocument
{
    public string Name { get; set; } = "";
    public string Location { get; set; } = "";
    public int Score { get; set; }
}

public sealed class LeadQuoteSummaryDocument
{
    public string Ref { get; set; } = "";
    public string PlanName { get; set; } = "";
    public decimal Price { get; set; }
    public string PriceLabel { get; set; } = "";
    public string Status { get; set; } = "";
    public string? FirstVisit { get; set; }
}

[BsonIgnoreExtraElements]
public sealed class InviteDocument
{
    [BsonId]
    [BsonRepresentation(BsonType.String)]
    public string Id { get; set; } = "";

    public string Code { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string CustomerEmail { get; set; } = "";
    public string CustomerPhone { get; set; } = "";
    public InviteQuoteDocument Quote { get; set; } = new();
    public InvitePropertyDocument Property { get; set; } = new();
    public List<InvitePlanDocument> Plans { get; set; } = [];
    public DateTime ExpiresAt { get; set; }
    public string Status { get; set; } = "pending";
    public string? SentAt { get; set; }
    public string? SentBy { get; set; }
    public string? LeadId { get; set; }
}

public sealed class InviteQuoteDocument
{
    public decimal BasePrice { get; set; }
    public int EstimatedPanelCount { get; set; }
    public string ServiceType { get; set; } = "";
    public string? QuoteRef { get; set; }
    public string? Notes { get; set; }
}

public sealed class InvitePropertyDocument
{
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string Postcode { get; set; } = "";
    public int PanelCount { get; set; }
    public string RoofType { get; set; } = "";
    public string? AccessNotes { get; set; }
    public double? SystemSizeKw { get; set; }
    public string? ImageUrl { get; set; }
}

public sealed class InvitePlanDocument
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal PricePerVisit { get; set; }
    public int VisitsPerYear { get; set; }
    public decimal AnnualPrice { get; set; }
    public List<string> Features { get; set; } = [];
    public bool Recommended { get; set; }
}

