using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Solanist.Application.Abstractions;
using Solanist.Application.Dtos;
using Solanist.Bff.Shared;

namespace Solanist.Bff.External.Controllers;

[Authorize(Roles = "staff")]
[Route("api/v1/uploads")]
public sealed class UploadsController(IFileStorageService storage) : ApiControllerBase
{
    [HttpPost("photos")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 20 * 1024 * 1024)]
    public async Task<ActionResult<ApiResponse<UploadFilesResultDto>>> UploadPhotos(
        [FromForm(Name = "files")] List<IFormFile>? files,
        CancellationToken ct)
    {
        if (!storage.IsEnabled)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<UploadFilesResultDto?>.Fail("s3_not_configured"));

        if (files is null || files.Count == 0)
            return BadRequest(ApiResponse<UploadFilesResultDto?>.Fail("no_files"));

        var payloads = new List<FileUploadPayload>(files.Count);
        foreach (var file in files)
        {
            if (file.Length == 0) continue;
            payloads.Add(new FileUploadPayload(
                file.OpenReadStream(),
                file.ContentType ?? "image/jpeg",
                file.FileName));
        }

        if (payloads.Count == 0)
            return BadRequest(ApiResponse<UploadFilesResultDto?>.Fail("no_files"));

        var urls = await storage.UploadAsync(payloads, "staff-photos", ct);
        return OkData(new UploadFilesResultDto(urls));
    }
}
