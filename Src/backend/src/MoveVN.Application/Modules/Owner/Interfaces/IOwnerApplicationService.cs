using MoveVN.Application.Modules.Owner.DTOs;

namespace MoveVN.Application.Modules.Owner.Interfaces;

public interface IOwnerApplicationService
{
    Task<CreateOwnerApplicationResponse> CreateApplicationAsync(CancellationToken cancellationToken = default);
    Task<OwnerApplicationResponse> GetCurrentApplicationAsync(CancellationToken cancellationToken = default);
    Task<OwnerApplicationResponse> UpdateBankInfoAsync(UpdateBankInfoRequest request, CancellationToken cancellationToken = default);
    Task<SubmitOwnerApplicationResponse> SubmitApplicationAsync(CancellationToken cancellationToken = default);
    Task<NationalIdUploadResponse> UploadNationalIdAsync(Stream frontImage, string frontFileName, Stream backImage, string backFileName, CancellationToken cancellationToken = default);
    Task<OwnerOnboardingRegisterResponse> RegisterOwnerOnboardingAsync(OwnerOnboardingRegisterRequest request, CancellationToken cancellationToken = default);
}
