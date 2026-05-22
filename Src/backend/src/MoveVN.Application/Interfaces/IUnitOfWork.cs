namespace MoveVN.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<T> Repository<T>() where T : MoveVN.Domain.Common.BaseEntity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
