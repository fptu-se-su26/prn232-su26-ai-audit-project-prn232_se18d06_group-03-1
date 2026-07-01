namespace MoveVN.Infrastructure.Persistence.Mongo.Migrations;

public interface IMongoMigration
{
    string Id { get; }
    string Description { get; }
    Task UpAsync(MongoDbContext context, CancellationToken cancellationToken = default);
}
