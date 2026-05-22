using MoveVN.Application.Interfaces;
using MoveVN.Domain.Common;
using MoveVN.Infrastructure.Persistence.Repositories;
using System.Collections.Concurrent;

namespace MoveVN.Infrastructure.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private readonly ConcurrentDictionary<string, object> _repositories = new();

    public UnitOfWork(AppDbContext context)
    {
        _context = context;
    }

    public void Dispose()
    {
        _context.Dispose();
    }

    public IGenericRepository<T> Repository<T>() where T : BaseEntity
    {
        var typeName = typeof(T).Name;
        var repository = _repositories.GetOrAdd(typeName, _ => new GenericRepository<T>(_context));
        return (IGenericRepository<T>)repository;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
