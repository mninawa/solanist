using Solanist.Infrastructure.Persistence.Documents;

namespace Solanist.Infrastructure.Persistence;

internal static class SuperAdminSeedData
{
    public static IReadOnlyList<UserDocument> Users => [
        new()
        {
            Id = "user-super-admin-001",
            Email = "mninawa@gmail.com",
            Password = null,
            Role = "admin",
            FirstName = "Mninawa",
            LastName = "Admin",
        },
    ];
}
