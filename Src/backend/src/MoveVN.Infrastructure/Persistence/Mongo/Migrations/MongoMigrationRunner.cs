using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace MoveVN.Infrastructure.Persistence.Mongo.Migrations;

public class MongoMigrationRunner
{
    private readonly MongoDbContext _context;
    private readonly IEnumerable<IMongoMigration> _migrations;
    private readonly ILogger<MongoMigrationRunner> _logger;

    public MongoMigrationRunner(
        MongoDbContext context,
        IEnumerable<IMongoMigration> migrations,
        ILogger<MongoMigrationRunner> logger)
    {
        _context = context;
        _migrations = migrations;
        _logger = logger;
    }

    public async Task RunAsync(CancellationToken cancellationToken = default)
    {
        await EnsureHistoryIndexesAsync(cancellationToken);

        var appliedMigrationIds = await _context.MigrationHistory
            .Find(Builders<MongoMigrationHistory>.Filter.Empty)
            .Project(x => x.Id)
            .ToListAsync(cancellationToken);

        var appliedMigrationIdSet = appliedMigrationIds.ToHashSet(StringComparer.Ordinal);

        foreach (var migration in _migrations.OrderBy(x => x.Id, StringComparer.Ordinal))
        {
            if (appliedMigrationIdSet.Contains(migration.Id))
            {
                continue;
            }

            _logger.LogInformation("Applying MongoDB migration {MigrationId}: {Description}", migration.Id, migration.Description);

            await migration.UpAsync(_context, cancellationToken);
            await _context.MigrationHistory.InsertOneAsync(new MongoMigrationHistory
            {
                Id = migration.Id,
                Description = migration.Description,
                AppliedAt = DateTime.UtcNow
            }, cancellationToken: cancellationToken);

            _logger.LogInformation("Applied MongoDB migration {MigrationId}", migration.Id);
        }
    }

    private async Task EnsureHistoryIndexesAsync(CancellationToken cancellationToken)
    {
        await _context.MigrationHistory.Indexes.CreateOneAsync(
            new CreateIndexModel<MongoMigrationHistory>(
                Builders<MongoMigrationHistory>.IndexKeys.Ascending(x => x.AppliedAt)),
            cancellationToken: cancellationToken);
    }
}
