using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Bff.Shared;

namespace Solanist.Bff.External.Controllers;

[Route("api/v1/auth")]
public sealed class AuthController(IAuthService auth, IServicePlanCatalog servicePlans) : ApiControllerBase
{
    [AllowAnonymous]
    [HttpGet("config")]
    public ActionResult<ApiResponse<AuthConfigDto>> GetConfig() =>
        OkData(auth.GetAuthConfig());

    [AllowAnonymous]
    [HttpGet("plans")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ServicePlanDto>>>> GetPlans(CancellationToken ct) =>
        OkData(await servicePlans.GetActiveCatalogAsync(ct));

    [AllowAnonymous]
    [HttpPost("google")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> GoogleLogin(
        [FromBody] GoogleLoginRequestDto request,
        CancellationToken ct)
    {
        var result = await auth.GoogleLoginAsync(request, ct);
        if (result.Session is null)
        {
            var body = ApiResponse<AuthSessionDto?>.Fail(result.ErrorCode);
            return result.ErrorCode switch
            {
                "account_not_found" => NotFound(body),
                "role_mismatch" => StatusCode(403, body),
                "google_not_configured" => StatusCode(503, body),
                _ => Unauthorized(body),
            };
        }

        return OkData(result.Session);
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> Login(
        [FromBody] LoginRequestDto request,
        CancellationToken ct)
    {
        if (auth.GetAuthConfig().GoogleOnly)
            return StatusCode(403, ApiResponse<AuthSessionDto?>.Fail("password_disabled"));

        var session = await auth.LoginAsync(request, ct);
        if (session is null) return Unauthorized();
        return OkData(session);
    }

    [AllowAnonymous]
    [HttpPost("signup")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> Signup(
        [FromBody] SignupRequestDto request,
        CancellationToken ct)
    {
        if (auth.GetAuthConfig().GoogleOnly)
            return BadRequest(ApiResponse<AuthSessionDto?>.Fail("password_disabled"));

        var result = await auth.SignupAsync(request, ct);
        if (result.Session is null)
        {
            var body = ApiResponse<AuthSessionDto?>.Fail(result.ErrorCode);
            return result.ErrorCode switch
            {
                "email_exists" => Conflict(body),
                "invite_used" or "expired_invite" or "invalid_invite" => BadRequest(body),
                _ => BadRequest(body),
            };
        }

        return OkData(result.Session);
    }

    [AllowAnonymous]
    [HttpPost("signup/google")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> GoogleSignup(
        [FromBody] GoogleSignupRequestDto request,
        CancellationToken ct)
    {
        var result = await auth.GoogleSignupAsync(request, ct);
        if (result.Session is null)
        {
            var body = ApiResponse<AuthSessionDto?>.Fail(result.ErrorCode);
            return result.ErrorCode switch
            {
                "email_exists" => Conflict(body),
                "invite_used" or "expired_invite" or "invalid_invite" or "email_mismatch" => BadRequest(body),
                "google_not_configured" => StatusCode(503, body),
                _ => BadRequest(body),
            };
        }

        return OkData(result.Session);
    }

    [AllowAnonymous]
    [HttpPost("signup/self")]
    public async Task<ActionResult<ApiResponse<AuthSessionDto>>> GoogleSelfSignup(
        [FromBody] GoogleSelfSignupRequestDto request,
        CancellationToken ct)
    {
        var result = await auth.GoogleSelfSignupAsync(request, ct);
        if (result.Session is null)
        {
            var body = ApiResponse<AuthSessionDto?>.Fail(result.ErrorCode);
            return result.ErrorCode switch
            {
                "email_exists" => Conflict(body),
                "invalid_plan" or "invalid_request" => BadRequest(body),
                "signup_disabled" => StatusCode(403, body),
                "google_not_configured" => StatusCode(503, body),
                _ => BadRequest(body),
            };
        }

        return OkData(result.Session);
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<ForgotPasswordResultDto>>> ForgotPassword(
        [FromBody] ForgotPasswordRequestDto request,
        CancellationToken ct)
    {
        if (auth.GetAuthConfig().GoogleOnly)
            return StatusCode(403, ApiResponse<ForgotPasswordResultDto?>.Fail("password_disabled"));

        return OkData(await auth.RequestPasswordResetAsync(request, ct));
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<ResetPasswordResultDto>>> ResetPassword(
        [FromBody] ResetPasswordRequestDto request,
        CancellationToken ct)
    {
        if (auth.GetAuthConfig().GoogleOnly)
            return StatusCode(403, ApiResponse<ResetPasswordResultDto?>.Fail("password_disabled"));

        var result = await auth.ResetPasswordAsync(request, ct);
        if (!result.Success)
            return BadRequest(ApiResponse<ResetPasswordResultDto?>.Fail(result.ErrorCode));
        return OkData(result);
    }
}

[Route("api/v1/invites")]
public sealed class InvitesController(IInviteService invites) : ApiControllerBase
{
    [HttpGet("{code}")]
    public async Task<ActionResult<ApiResponse<InviteDto>>> GetInvite(string code, CancellationToken ct)
    {
        var invite = await invites.GetInviteAsync(code, ct);
        if (invite is null) return NotFound();
        return OkData(invite);
    }
}

[Authorize(Roles = "client")]
[Route("api/v1/client")]
public sealed class ClientController(IClientService client, IAuthService auth) : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<ClientDashboardDto>>> GetDashboard(CancellationToken ct) =>
        OkData(await client.GetDashboardAsync(ct));

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BookingDto>>>> GetBookings(CancellationToken ct) =>
        OkData(await client.GetBookingsAsync(ct));

    [HttpGet("bookings/{id}")]
    public async Task<ActionResult<ApiResponse<BookingDto?>>> GetBooking(string id, CancellationToken ct) =>
        OkData(await client.GetBookingAsync(id, ct));

    [HttpPost("bookings")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> CreateBooking(
        [FromBody] CreateBookingRequest request,
        CancellationToken ct) =>
        OkData(await client.CreateBookingAsync(request, ct));

    [HttpPatch("bookings/reschedule")]
    public async Task<ActionResult<ApiResponse<BookingDto>>> RescheduleBooking(
        [FromBody] RescheduleBookingRequest request,
        CancellationToken ct) =>
        OkData(await client.RescheduleBookingAsync(request, ct));

    [HttpGet("properties/{propertyId}/bookings/upcoming")]
    public async Task<ActionResult<ApiResponse<BookingDto?>>> GetUpcomingBooking(
        string propertyId,
        CancellationToken ct) =>
        OkData(await client.GetUpcomingBookingForPropertyAsync(propertyId, ct));

    [HttpGet("reports")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CleaningReportDto>>>> GetReports(CancellationToken ct) =>
        OkData(await client.GetReportsAsync(ct));

    [HttpGet("reports/{id}")]
    public async Task<ActionResult<ApiResponse<CleaningReportDto?>>> GetReport(string id, CancellationToken ct) =>
        OkData(await client.GetReportAsync(id, ct));

    [HttpGet("subscription")]
    public async Task<ActionResult<ApiResponse<SubscriptionDto>>> GetSubscription(CancellationToken ct) =>
        OkData(await client.GetSubscriptionAsync(ct));

    [HttpGet("subscription/portfolio")]
    public async Task<ActionResult<ApiResponse<SubscriptionPortfolioResponseDto>>> GetSubscriptionPortfolio(
        CancellationToken ct) =>
        OkData(await client.GetSubscriptionPortfolioAsync(ct));

    [HttpPatch("subscription/billing-mode")]
    public async Task<ActionResult<ApiResponse<string>>> SetBillingMode(
        [FromBody] SetBillingModeRequest request,
        CancellationToken ct) =>
        OkData(await client.SetBillingModeAsync(request.BillingMode, ct));

    [HttpGet("payments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PaymentDto>>>> GetPayments(CancellationToken ct) =>
        OkData(await client.GetPaymentsAsync(ct));

    [HttpGet("properties")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PropertySummaryDto>>>> GetProperties(CancellationToken ct) =>
        OkData(await client.GetPropertiesAsync(ct));

    [HttpPost("properties")]
    public async Task<ActionResult<ApiResponse<PropertySummaryDto>>> AddProperty(
        [FromBody] CreatePropertyRequest request,
        CancellationToken ct) =>
        OkData(await client.AddPropertyAsync(request, ct));

    [HttpPatch("properties/{id}/image")]
    public async Task<ActionResult<ApiResponse<PropertySummaryDto>>> UpdatePropertyImage(
        string id,
        [FromBody] UpdatePropertyImageRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.ImageUrl))
            return BadRequest(ApiResponse<PropertySummaryDto?>.Fail("invalid_image"));
        return OkData(await client.UpdatePropertyImageAsync(id, request.ImageUrl, ct));
    }

    [HttpPatch("properties/{id}/next-clean")]
    public async Task<ActionResult<ApiResponse<PropertySummaryDto>>> UpdatePropertyNextClean(
        string id,
        [FromBody] UpdatePropertyNextCleanRequest request,
        CancellationToken ct)
    {
        try
        {
            return OkData(await client.UpdatePropertyNextCleanAsync(id, request.Date, ct));
        }
        catch (InvalidOperationException ex) when (ex.Message == "invalid_date")
        {
            return BadRequest(ApiResponse<PropertySummaryDto?>.Fail("invalid_date"));
        }
    }

    [HttpPatch("properties/{id}/primary")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PropertySummaryDto>>>> SetPrimaryProperty(
        string id,
        CancellationToken ct) =>
        OkData(await client.SetPrimaryPropertyAsync(id, ct));

    [HttpDelete("properties/{id}")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PropertySummaryDto>>>> DeleteProperty(
        string id,
        CancellationToken ct) =>
        OkData(await client.DeletePropertyAsync(id, ct));

    [HttpGet("properties/{id}/plan")]
    public async Task<ActionResult<ApiResponse<PropertyPlanDetailsDto?>>> GetPropertyPlan(
        string id,
        CancellationToken ct) =>
        OkData(await client.GetPropertyPlanAsync(id, ct));

    [HttpGet("properties/{id}/detail")]
    public async Task<ActionResult<ApiResponse<PropertyDetailDto?>>> GetPropertyDetail(
        string id,
        CancellationToken ct) =>
        OkData(await client.GetPropertyDetailAsync(id, ct));

    /// <summary>
    /// Seeds demo cleaning history (3 completed bookings + 2 reports) for a property
    /// that has no cleanings yet. Idempotent: a no-op if the property already has any.
    /// </summary>
    [HttpPost("properties/{id}/demo-cleanings")]
    public async Task<ActionResult<ApiResponse<PropertyDetailDto?>>> SeedDemoCleanings(
        string id,
        CancellationToken ct) =>
        OkData(await client.SeedDemoCleaningsAsync(id, ct));

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<ClientProfileDto>>> GetProfile(CancellationToken ct) =>
        OkData(await client.GetProfileAsync(ct));

    [HttpPatch("profile")]
    public async Task<ActionResult<ApiResponse<ClientProfileDto>>> UpdateProfile(
        [FromBody] UpdateClientProfileRequestDto request,
        CancellationToken ct) =>
        OkData(await client.UpdateProfileAsync(request, ct));

    [HttpPost("profile/change-password")]
    public async Task<ActionResult<ApiResponse<ChangePasswordResultDto>>> ChangePassword(
        [FromBody] ChangePasswordRequestDto request,
        CancellationToken ct)
    {
        if (auth.GetAuthConfig().GoogleOnly)
            return StatusCode(403, ApiResponse<ChangePasswordResultDto?>.Fail("password_disabled"));

        var result = await client.ChangePasswordAsync(request, ct);
        if (!result.Success)
            return BadRequest(ApiResponse<ChangePasswordResultDto?>.Fail(result.ErrorCode));

        return OkData(result);
    }
}

[Authorize(Roles = "staff")]
[Route("api/v1/staff")]
public sealed class StaffController(
    IStaffService staff,
    IJobReportPublisher reportPublisher,
    ICurrentUser currentUser) : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<StaffDashboardDto>>> GetDashboard(CancellationToken ct) =>
        OkData(await staff.GetDashboardAsync(ct));

    [HttpGet("profile")]
    public async Task<ActionResult<ApiResponse<StaffProfileDto?>>> GetProfile(CancellationToken ct) =>
        OkData(await staff.GetProfileAsync(ct));

    [HttpGet("notifications")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StaffNotificationDto>>>> GetNotifications(CancellationToken ct) =>
        OkData(await staff.GetNotificationsAsync(ct));

    [HttpPost("notifications/read")]
    public async Task<ActionResult<ApiResponse<int>>> MarkNotificationsRead(CancellationToken ct) =>
        OkData(await staff.MarkNotificationsReadAsync(ct));

    [HttpGet("schedule")]
    public async Task<ActionResult<ApiResponse<StaffScheduleDto>>> GetSchedule(
        [FromQuery] string? from,
        [FromQuery] string? to,
        CancellationToken ct) =>
        OkData(await staff.GetScheduleAsync(from, to, ct));

    [HttpGet("jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StaffJobDto>>>> GetJobs(CancellationToken ct) =>
        OkData(await staff.GetJobsAsync(ct));

    [HttpGet("jobs/{id}")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> GetJob(string id, CancellationToken ct) =>
        OkData(await staff.GetJobAsync(id, ct));

    [HttpPost("jobs/{id}/check-in")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> CheckIn(
        string id,
        [FromBody] CheckInRequest? request,
        CancellationToken ct) =>
        OkData(await staff.CheckInAsync(id, request, ct));

    [HttpPost("jobs/{id}/photos")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> AddPhotos(string id, [FromBody] AddPhotosRequest request, CancellationToken ct) =>
        OkData(await staff.AddPhotosAsync(id, request.Type, request.Photos, ct));

    [HttpPut("jobs/{id}/checklist")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> UpdateChecklist(string id, [FromBody] UpdateChecklistRequest request, CancellationToken ct) =>
        OkData(await staff.UpdateChecklistAsync(id, request.Checklist, ct));

    [HttpPatch("jobs/{id}")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> UpdateJob(
        string id,
        [FromBody] UpdateStaffJobRequest request,
        CancellationToken ct) =>
        OkData(await staff.UpdateJobAsync(id, request, ct));

    [HttpPost("jobs/{id}/issue")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> ReportIssue(
        string id,
        [FromBody] ReportJobIssueRequest request,
        CancellationToken ct) =>
        OkData(await staff.ReportIssueAsync(id, request, ct));

    [HttpPost("jobs/{id}/complete")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> CompleteJob(
        string id,
        [FromBody] CompleteJobRequest request,
        CancellationToken ct)
    {
        var job = await staff.CompleteJobAsync(id, request.Notes, ct);
        if (job is not null && request.Report is not null)
        {
            await reportPublisher.PublishAsync(request.Report, currentUser.DisplayName, ct);
        }

        return OkData(job);
    }
}

[Route("api/v1/health")]
public sealed class HealthController : ApiControllerBase
{
    [HttpGet]
    public ActionResult<ApiResponse<HealthStatusDto>> Get() =>
        OkData(new HealthStatusDto("healthy", "Solanist.Bff.External"));
}

public sealed record HealthStatusDto(string Status, string Service);
