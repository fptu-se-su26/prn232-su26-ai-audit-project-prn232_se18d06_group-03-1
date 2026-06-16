using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MoveVN.Application.Modules.Auth.Interfaces;

namespace MoveVN.Infrastructure.Persistence.Converters;

public class AesValueConverter : ValueConverter<string, string>
{
    public AesValueConverter(IAesEncryptionService encryptionService)
        : base(
            v => encryptionService.Encrypt(v),
            v => encryptionService.Decrypt(v))
    {
    }
}
