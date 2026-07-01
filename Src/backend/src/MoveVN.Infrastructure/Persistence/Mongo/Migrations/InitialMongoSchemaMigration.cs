namespace MoveVN.Infrastructure.Persistence.Mongo.Migrations;

public class InitialMongoSchemaMigration : IMongoMigration
{
    public string Id => "202606090001_initial_mongo_schema";
    public string Description => "Initial MongoDB migration baseline.";

    public Task UpAsync(MongoDbContext context, CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }
}
