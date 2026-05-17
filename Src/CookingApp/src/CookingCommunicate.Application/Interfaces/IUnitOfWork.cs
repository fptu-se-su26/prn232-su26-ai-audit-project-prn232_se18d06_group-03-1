namespace CookingCommunicate.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<T> Repository<T>() where T : CookingCommunicate.Domain.Common.BaseEntity;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
