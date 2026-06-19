using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Bff.Shared;

namespace Solanist.Bff.External.Controllers;

[Authorize(Roles = "admin")]
[Route("api/v1/admin")]
public sealed class AdminController(IAdminService admin) : ApiControllerBase
{
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<AdminDashboardDto>>> GetDashboard(CancellationToken ct) =>
        OkData(await admin.GetDashboardAsync(ct));

    [HttpGet("inbox-stats")]
    public async Task<ActionResult<ApiResponse<AdminInboxStatsDto>>> GetInboxStats(CancellationToken ct) =>
        OkData(await admin.GetInboxStatsAsync(ct));

    [HttpGet("search")]
    public async Task<ActionResult<ApiResponse<AdminSearchResultDto>>> Search(
        [FromQuery] string q,
        CancellationToken ct) =>
        OkData(await admin.SearchAsync(q, ct));

    [HttpGet("leads")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminLeadDto>>>> GetLeads(
        [FromQuery] string? status,
        [FromQuery] string? urgency,
        CancellationToken ct) =>
        OkData(await admin.GetLeadsAsync(status, urgency, ct));

    [HttpGet("leads/{id}")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> GetLead(string id, CancellationToken ct) =>
        OkData(await admin.GetLeadAsync(id, ct));

    [HttpPatch("leads/{id}")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> UpdateLeadContact(
        string id,
        [FromBody] UpdateLeadContactRequest request,
        CancellationToken ct)
    {
        var result = await admin.UpdateLeadContactAsync(id, request, ct);
        if (result is null) return NotFound();
        return OkData(result);
    }

    [HttpPost("leads/{id}/tags")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> AddLeadTag(
        string id,
        [FromBody] AddLeadTagRequest request,
        CancellationToken ct)
    {
        var result = await admin.AddLeadTagAsync(id, request, ct);
        if (result is null) return NotFound();
        return OkData(result);
    }

    [HttpPost("leads/{id}/notes")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> AddLeadNote(
        string id,
        [FromBody] AddLeadNoteRequest request,
        CancellationToken ct)
    {
        var result = await admin.AddLeadNoteAsync(id, request, ct);
        if (result is null) return NotFound();
        return OkData(result);
    }

    [HttpPatch("leads/{id}/status")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> UpdateLeadStatus(
        string id,
        [FromBody] UpdateLeadStatusRequest request,
        CancellationToken ct) =>
        OkData(await admin.UpdateLeadStatusAsync(id, request.Status, ct));

    [HttpPatch("leads/{id}/pipeline")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto?>>> UpdatePipelineStage(
        string id,
        [FromBody] UpdateLeadPipelineRequest request,
        CancellationToken ct) =>
        OkData(await admin.UpdatePipelineStageAsync(id, request.PipelineStage, ct));

    [HttpPost("leads/{id}/invite")]
    public async Task<ActionResult<ApiResponse<SendInviteResponseDto>>> SendInvite(
        string id,
        [FromBody] SendInviteRequest? request,
        CancellationToken ct)
    {
        var result = await admin.SendInviteFromLeadAsync(id, request, ct);
        if (result is null) return NotFound();
        return OkData(result);
    }

    [HttpPost("leads")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto>>> CreateLead(
        [FromBody] CreateLeadRequestDto request,
        CancellationToken ct) =>
        OkData(await admin.CreateLeadAsync(request, ct));

    [HttpPost("leads/sync-bark")]
    public async Task<ActionResult<ApiResponse<AdminLeadDto>>> SyncBarkLead(CancellationToken ct) =>
        OkData(await admin.SyncBarkLeadAsync(ct), "Bark email imported.");

    [HttpGet("bookings")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminBookingDto>>>> GetBookings(CancellationToken ct) =>
        OkData(await admin.GetBookingsAsync(ct));

    [HttpPatch("bookings/{id}/assign")]
    public async Task<ActionResult<ApiResponse<AdminBookingDto?>>> AssignStaff(
        string id,
        [FromBody] AssignStaffRequest request,
        CancellationToken ct) =>
        OkData(await admin.AssignStaffAsync(id, request, ct));

    [HttpPatch("bookings/{id}/status")]
    public async Task<ActionResult<ApiResponse<AdminBookingDto?>>> UpdateBookingStatus(
        string id,
        [FromBody] UpdateBookingStatusRequest request,
        CancellationToken ct) =>
        OkData(await admin.UpdateBookingStatusAsync(id, request, ct));

    [HttpGet("customers")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminCustomerDto>>>> GetCustomers(CancellationToken ct) =>
        OkData(await admin.GetCustomersAsync(ct));

    [HttpGet("customers/{id}")]
    public async Task<ActionResult<ApiResponse<AdminCustomerDetailDto>>> GetCustomer(string id, CancellationToken ct)
    {
        var customer = await admin.GetCustomerAsync(id, ct);
        if (customer is null) return NotFound();
        return OkData(customer);
    }

    [HttpGet("staff")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminStaffMemberDto>>>> GetStaff(CancellationToken ct) =>
        OkData(await admin.GetStaffAsync(ct));

    [HttpPost("staff")]
    public async Task<ActionResult<ApiResponse<AdminStaffMemberDto>>> CreateStaff(
        [FromBody] UpsertStaffRequest request,
        CancellationToken ct)
    {
        var member = await admin.CreateStaffAsync(request, ct);
        if (member is null)
            return BadRequest(ApiResponse<AdminStaffMemberDto>.Fail("invalid_or_duplicate"));
        return OkData(member, "Staff member added.");
    }

    [HttpPatch("staff/{id}")]
    public async Task<ActionResult<ApiResponse<AdminStaffMemberDto>>> UpdateStaff(
        string id,
        [FromBody] UpsertStaffRequest request,
        CancellationToken ct)
    {
        var member = await admin.UpdateStaffAsync(id, request, ct);
        if (member is null)
            return NotFound(ApiResponse<AdminStaffMemberDto>.Fail("not_found_or_duplicate"));
        return OkData(member, "Staff member updated.");
    }

    [HttpDelete("staff/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteStaff(string id, CancellationToken ct)
    {
        var ok = await admin.DeleteStaffAsync(id, ct);
        if (!ok) return NotFound();
        return OkData<object?>(null, "Staff member removed.");
    }

    [HttpGet("jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StaffJobDto>>>> GetJobs(CancellationToken ct) =>
        OkData(await admin.GetJobsAsync(ct));

    [HttpPatch("jobs/{id}/status")]
    public async Task<ActionResult<ApiResponse<StaffJobDto?>>> UpdateJobStatus(
        string id,
        [FromBody] UpdateAdminJobStatusRequest request,
        CancellationToken ct) =>
        OkData(await admin.UpdateJobStatusAsync(id, request, ct));

    [HttpGet("issues")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StaffJobDto>>>> GetIssues(CancellationToken ct) =>
        OkData(await admin.GetIssuesAsync(ct));

    [HttpGet("reports/stats")]
    public async Task<ActionResult<ApiResponse<AdminReportStatsDto>>> GetReportStats(CancellationToken ct) =>
        OkData(await admin.GetReportStatsAsync(ct));

    [HttpGet("reports")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminReportListItemDto>>>> GetReports(
        [FromQuery] string? search,
        CancellationToken ct) =>
        OkData(await admin.GetAdminReportsAsync(search, ct));

    [HttpGet("reports/export")]
    public async Task<IActionResult> ExportReports(CancellationToken ct)
    {
        var export = await admin.GetAdminReportsExportAsync(ct);
        var json = JsonSerializer.Serialize(export, new JsonSerializerOptions { WriteIndented = true });
        var bytes = Encoding.UTF8.GetBytes(json);
        var fileName = $"solanist-reports-{DateTime.UtcNow:yyyyMMdd}.json";
        return File(bytes, "application/json", fileName);
    }

    [HttpGet("reports/{id}")]
    public async Task<ActionResult<ApiResponse<AdminReportDetailDto?>>> GetReport(string id, CancellationToken ct)
    {
        var report = await admin.GetAdminReportAsync(id, ct);
        if (report is null) return NotFound();
        return OkData(report);
    }

    [HttpGet("subscriptions/stats")]
    public async Task<ActionResult<ApiResponse<AdminSubscriptionStatsDto>>> GetSubscriptionStats(CancellationToken ct) =>
        OkData(await admin.GetSubscriptionStatsAsync(ct));

    [HttpGet("subscriptions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminSubscriptionRowDto>>>> GetSubscriptions(CancellationToken ct) =>
        OkData(await admin.GetSubscriptionsAsync(ct));

    [HttpGet("subscriptions/plans")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminSubscriptionPlanDto>>>> GetSubscriptionPlans(CancellationToken ct) =>
        OkData(await admin.GetSubscriptionPlansAsync(ct));

    [HttpPost("subscriptions/plans")]
    public async Task<ActionResult<ApiResponse<AdminSubscriptionPlanDto>>> CreateSubscriptionPlan(
        [FromBody] UpsertServicePlanRequest request,
        CancellationToken ct)
    {
        var plan = await admin.CreateServicePlanAsync(request, ct);
        if (plan is null) return BadRequest(ApiResponse<AdminSubscriptionPlanDto>.Fail("invalid_plan"));
        return OkData(plan, "Plan created.");
    }

    [HttpPatch("subscriptions/plans/{id}")]
    public async Task<ActionResult<ApiResponse<AdminSubscriptionPlanDto>>> UpdateSubscriptionPlan(
        string id,
        [FromBody] UpsertServicePlanRequest request,
        CancellationToken ct)
    {
        var plan = await admin.UpdateServicePlanAsync(id, request, ct);
        if (plan is null) return NotFound();
        return OkData(plan, "Plan updated.");
    }

    [HttpDelete("subscriptions/plans/{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeactivateSubscriptionPlan(string id, CancellationToken ct)
    {
        var ok = await admin.DeactivateServicePlanAsync(id, ct);
        if (!ok) return NotFound();
        return OkData<object?>(null, "Plan deactivated.");
    }

    [HttpPost("subscriptions/plans/{id}/paystack-sync")]
    public async Task<ActionResult<ApiResponse<SyncPaystackPlanResponseDto>>> SyncSubscriptionPlanPaystack(
        string id,
        CancellationToken ct)
    {
        var result = await admin.SyncServicePlanPaystackAsync(id, ct);
        if (result is null) return NotFound();
        return OkData(result);
    }

    [HttpGet("settings")]
    public async Task<ActionResult<ApiResponse<AdminPortalSettingsDto>>> GetPortalSettings(CancellationToken ct) =>
        OkData(await admin.GetPortalSettingsAsync(ct));

    [HttpGet("schedule")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminScheduleSlotDto>>>> GetSchedule(CancellationToken ct) =>
        OkData(await admin.GetScheduleSlotsAsync(ct));

    [HttpGet("invites")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminInviteDto>>>> GetInvites(CancellationToken ct) =>
        OkData(await admin.GetInvitesAsync(ct));
}
