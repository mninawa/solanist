using Microsoft.AspNetCore.Mvc;

namespace Solanist.Bff.Shared;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected ActionResult<ApiResponse<T>> OkData<T>(T data, string? message = null) =>
        Ok(ApiResponse<T>.Ok(data, message));
}
