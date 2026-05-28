namespace MoveVN.Infrastructure.Persistence.Mongo;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "movevn";
}
