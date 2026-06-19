namespace MoveVN.Application.Common.Interfaces;

public interface IRedisLockService
{
    Task<RedisLock?> AcquireLockAsync(string lockKey, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task ReleaseLockAsync(RedisLock lockObj, CancellationToken cancellationToken = default);
}

public record RedisLock(string Key, string Value, DateTime AcquiredAt);
