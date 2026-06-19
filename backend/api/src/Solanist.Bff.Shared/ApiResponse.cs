namespace Solanist.Bff.Shared;

public sealed class ApiResponse<T>
{
    public required T Data { get; init; }
    public string? Message { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Data = data, Message = message };

    public static ApiResponse<T?> Fail(string? message) =>
        new() { Data = default, Message = message };
}
