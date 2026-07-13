using MoveVN.Domain.Entities;
using System.Linq.Expressions;

namespace MoveVN.Application.Modules.Withdrawals.Interfaces;

public interface IWithdrawalRepository
{
    Task<WithdrawalRequest?> GetByIdAsync(long id, CancellationToken ct = default);
    Task<IReadOnlyList<WithdrawalRequest>> FindAsync(Expression<Func<WithdrawalRequest, bool>> predicate, CancellationToken ct = default);
    Task AddAsync(WithdrawalRequest request, CancellationToken ct = default);
    void Update(WithdrawalRequest request);
    Task<(IReadOnlyList<WithdrawalRequest> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, string? status = null, long? userId = null, CancellationToken ct = default);
}
