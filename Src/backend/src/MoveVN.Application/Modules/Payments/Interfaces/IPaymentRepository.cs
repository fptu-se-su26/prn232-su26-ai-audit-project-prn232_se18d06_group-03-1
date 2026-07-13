using MoveVN.Domain.Entities;
using System.Linq.Expressions;

namespace MoveVN.Application.Modules.Payments.Interfaces;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(long id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Payment>> FindAsync(Expression<Func<Payment, bool>> predicate, CancellationToken cancellationToken = default);
    Task AddAsync(Payment payment, CancellationToken cancellationToken = default);
    void Update(Payment payment);
}
