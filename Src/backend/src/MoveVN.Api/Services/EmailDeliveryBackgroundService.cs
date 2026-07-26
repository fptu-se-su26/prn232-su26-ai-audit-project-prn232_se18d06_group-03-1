using Microsoft.EntityFrameworkCore;
using MoveVN.Infrastructure.Persistence;
using MoveVN.Infrastructure.Services;

namespace MoveVN.Api.Services;

public class EmailDeliveryBackgroundService : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(3);
    private static readonly TimeSpan ProcessingTimeout = TimeSpan.FromMinutes(10);
    private const int BatchSize = 20;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EmailDeliveryBackgroundService> _logger;

    public EmailDeliveryBackgroundService(
        IServiceScopeFactory scopeFactory,
        ILogger<EmailDeliveryBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await ProcessBatchSafelyAsync(stoppingToken);
        using var timer = new PeriodicTimer(PollInterval);

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await ProcessBatchSafelyAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            // Normal host shutdown.
        }
    }

    private async Task ProcessBatchSafelyAsync(CancellationToken cancellationToken)
    {
        try
        {
            await RecoverStaleJobsAsync(cancellationToken);
            var emailLogIds = await ClaimBatchAsync(cancellationToken);
            foreach (var emailLogId in emailLogIds)
            {
                await DeliverAsync(emailLogId, cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Email delivery worker failed while processing a batch.");
        }
    }

    private async Task RecoverStaleJobsAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var staleBefore = DateTime.UtcNow.Subtract(ProcessingTimeout);
        await dbContext.EmailLogs
            .Where(log => log.Status == "Processing" && log.ProcessingStartedAt < staleBefore)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(log => log.Status, "Retry")
                .SetProperty(log => log.NextAttemptAt, DateTime.UtcNow)
                .SetProperty(log => log.ProcessingStartedAt, (DateTime?)null)
                .SetProperty(log => log.UpdatedAt, DateTime.UtcNow), cancellationToken);
    }

    private async Task<List<long>> ClaimBatchAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTime.UtcNow;
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var jobs = await dbContext.EmailLogs
            .FromSqlInterpolated($"""
                SELECT *
                FROM "EmailLogs"
                WHERE status IN ('Pending', 'Retry')
                  AND next_attempt_at <= {now}
                  AND attempt_count < max_attempts
                ORDER BY next_attempt_at, id
                FOR UPDATE SKIP LOCKED
                LIMIT {BatchSize}
                """)
            .ToListAsync(cancellationToken);

        foreach (var job in jobs)
        {
            job.Status = "Processing";
            job.ProcessingStartedAt = now;
            job.UpdatedAt = now;
        }
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return jobs.Select(job => job.Id).ToList();
    }

    private async Task DeliverAsync(long emailLogId, CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var smtpSender = scope.ServiceProvider.GetRequiredService<SmtpEmailSender>();
        var emailLog = await dbContext.EmailLogs.SingleOrDefaultAsync(
            log => log.Id == emailLogId,
            cancellationToken);
        if (emailLog is null || emailLog.Status != "Processing")
        {
            return;
        }

        try
        {
            emailLog.AttemptCount++;
            await smtpSender.DeliverQueuedAsync(emailLog, cancellationToken);
            emailLog.Status = "Sent";
            emailLog.SentAt = DateTime.UtcNow;
            emailLog.LastError = null;
            emailLog.PayloadJson = null;
        }
        catch (EmailDeliverySkippedException exception)
        {
            emailLog.Status = "Skipped";
            emailLog.LastError = Truncate(exception.Message, 4000);
            emailLog.PayloadJson = null;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            emailLog.Status = "Retry";
            emailLog.NextAttemptAt = DateTime.UtcNow;
            throw;
        }
        catch (Exception exception)
        {
            emailLog.LastError = Truncate(exception.Message, 4000);
            if (emailLog.AttemptCount >= emailLog.MaxAttempts)
            {
                emailLog.Status = "Failed";
                emailLog.PayloadJson = null;
            }
            else
            {
                emailLog.Status = "Retry";
                emailLog.NextAttemptAt = DateTime.UtcNow.Add(GetRetryDelay(emailLog.AttemptCount));
            }

            _logger.LogWarning(
                exception,
                "Email {EmailLogId} delivery attempt {Attempt}/{MaxAttempts} failed.",
                emailLog.Id,
                emailLog.AttemptCount,
                emailLog.MaxAttempts);
        }
        finally
        {
            emailLog.ProcessingStartedAt = null;
            emailLog.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(CancellationToken.None);
        }
    }

    private static TimeSpan GetRetryDelay(int attemptCount)
        => TimeSpan.FromMinutes(Math.Pow(2, Math.Max(0, attemptCount - 1)));

    private static string Truncate(string value, int maxLength)
        => value.Length <= maxLength ? value : value[..maxLength];
}
