using Microsoft.EntityFrameworkCore;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Infrastructure.Persistence;
using System.Linq.Expressions;

namespace MoveVN.Infrastructure.Persistence.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        await _context.Payments.AddAsync(payment, cancellationToken);
    }

    public async Task<IReadOnlyList<Payment>> FindAsync(Expression<Func<Payment, bool>> predicate, CancellationToken cancellationToken = default)
    {
        return await _context.Payments.Where(predicate).ToListAsync(cancellationToken);
    }

    public async Task<Payment?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        return await _context.Payments.FindAsync(new object[] { id }, cancellationToken);
    }

    public void Update(Payment payment)
    {
        _context.Payments.Update(payment);
    }
}
