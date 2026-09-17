using MoveVN.Application.Modules.UserSecurity.DTOs;

namespace MoveVN.Application.Modules.UserSecurity.Interfaces;

public interface IPinService
{
    Task<PinStatusResponse> GetStatusAsync(CancellationToken cancellationToken = default);
    Task RequestSetupPinOtpAsync(CancellationToken cancellationToken = default);
    Task SetupPinAsync(SetupPinRequest request, CancellationToken cancellationToken = default);
    Task ChangePinAsync(ChangePinRequest request, CancellationToken cancellationToken = default);
    Task<ViewDocumentPlaintextResponse> VerifyPinAndViewDocumentAsync(VerifyPinViewDocumentRequest request, CancellationToken cancellationToken = default);
    Task RequestForgotPinOtpAsync(ForgotPinRequestOtpRequest request, CancellationToken cancellationToken = default);
    Task ResetPinAsync(ForgotPinResetRequest request, CancellationToken cancellationToken = default);
}