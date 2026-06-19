namespace Solanist.Infrastructure.Options;

public sealed class MongoOptions
{
    public const string SectionName = "Mongo";

    public string? ConnectionString { get; set; }
    public string DatabaseName { get; set; } = "solanist";
    public string DemoCustomerId { get; set; } = "cust-001";
}
