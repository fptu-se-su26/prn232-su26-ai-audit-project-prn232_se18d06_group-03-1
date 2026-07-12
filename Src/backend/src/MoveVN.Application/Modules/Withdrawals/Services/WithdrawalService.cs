using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.AuditLogs.Interfaces;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Application.Modules.Notifications.DTOs;
using MoveVN.Application.Modules.Notifications.Interfaces;
using MoveVN.Application.Modules.Payments.Interfaces;
using MoveVN.Application.Modules.Withdrawals.DTOs;
using MoveVN.Application.Modules.Withdrawals.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace MoveVN.Application.Modules.Withdrawals.Services;

public class WithdrawalService : IWithdrawalService
{
    private readonly IWithdrawalRepository _withdrawalRepo;
    private readonly IWalletRepository _walletRepo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IAuditLogService _auditLog;
    private readonly INotificationService _notificationService;
    private readonly IOtpService _otpService;
    private readonly IPayOsService _payOsService;
    private readonly ILogger<WithdrawalService> _logger;

    public WithdrawalService(
        IWithdrawalRepository withdrawalRepo,
        IWalletRepository walletRepo,
        IUserRepository userRepo,
        IUnitOfWork unitOfWork,
        IAuditLogService auditLog,
        INotificationService notificationService,
        IOtpService otpService,
        IPayOsService payOsService,
        ILogger<WithdrawalService> logger)
    {
        _withdrawalRepo = withdrawalRepo;
        _walletRepo = walletRepo;
        _userRepo = userRepo;
        _unitOfWork = unitOfWork;
        _auditLog = auditLog;
        _notificationService = notificationService;
        _otpService = otpService;
        _payOsService = payOsService;
        _logger = logger;
    }

    // ──────────────────────────────────────────────
    //  OWNER: Tạo yêu cầu rút tiền
    // ──────────────────────────────────────────────
    public async Task<WithdrawalRequestDto> CreateAsync(long userId, CreateWithdrawalRequest request, CancellationToken ct = default)
    {
        if (request.Amount < 50000)
            throw new ValidationException(new[] { "Số tiền rút tối thiểu là 50.000đ." });

        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        var ownerProfile = await _userRepo.GetOwnerProfileByUserIdAsync(userId, ct)
            ?? throw new ValidationException(new[] { "Bạn chưa có hồ sơ chủ xe." });

        if (string.IsNullOrEmpty(ownerProfile.BankAccountNumber) || string.IsNullOrEmpty(ownerProfile.BankName))
            throw new ValidationException(new[] { "Bạn chưa cập nhật tài khoản ngân hàng nhận tiền. Vui lòng cập nhật trước khi rút." });

        // Check pending withdrawals
        var pendingWithdrawals = await _withdrawalRepo.FindAsync(w => w.UserId == userId && (w.Status == "Pending" || w.Status == "Approved"), ct);
        if (pendingWithdrawals.Any())
            throw new ValidationException(new[] { "Bạn đang có yêu cầu rút tiền chưa xử lý. Vui lòng chờ hoàn tất trước khi tạo yêu cầu mới." });

        // Check wallet balance
        var wallets = await _walletRepo.FindAsync(w => w.UserId == userId, ct);
        var wallet = wallets.FirstOrDefault()
            ?? throw new ValidationException(new[] { "Ví của bạn chưa được khởi tạo." });

        if (wallet.Balance < request.Amount)
            throw new ValidationException(new[] { $"Số dư không đủ. Số dư hiện tại: {wallet.Balance:N0}đ." });

        // Freeze the amount: deduct from wallet
        var tx = new WalletTransaction
        {
            WalletId = wallet.Id,
            Type = WalletTransactionType.Withdrawal,
            Amount = -request.Amount,
            BalanceAfter = wallet.Balance - request.Amount,
            IdempotencyKey = $"withdrawal_freeze_{userId}_{DateTime.UtcNow.Ticks}",
            Note = "Đóng băng tiền cho yêu cầu rút",
            Status = "Pending"
        };
        await _walletRepo.AddTransactionAsync(tx, ct);
        wallet.Balance -= request.Amount;
        wallet.TotalSpent += request.Amount;
        _walletRepo.Update(wallet);
        await _unitOfWork.SaveChangesAsync(ct);

        // Create withdrawal request
        var withdrawal = new WithdrawalRequest
        {
            UserId = userId,
            WalletTransactionId = tx.Id,
            Amount = request.Amount,
            BankAccountNumber = ownerProfile.BankAccountNumber!,
            BankName = ownerProfile.BankName!,
            BankAccountHolderName = ownerProfile.BankAccountHolderName ?? user.FullName,
            BankBin = ownerProfile.BankBin,
            Status = "Pending"
        };
        await _withdrawalRepo.AddAsync(withdrawal, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        _logger.LogInformation("Withdrawal request #{Id} created by User #{UserId}, Amount={Amount}", withdrawal.Id, userId, request.Amount);

        return MapToDto(withdrawal, user.FullName, user.Email);
    }

    // ──────────────────────────────────────────────
    //  OWNER: Xem lịch sử rút tiền
    // ──────────────────────────────────────────────
    public async Task<(List<WithdrawalRequestDto> Items, int TotalCount)> GetMyWithdrawalsAsync(long userId, WithdrawalListRequest request, CancellationToken ct = default)
    {
        var (items, totalCount) = await _withdrawalRepo.GetPagedAsync(request.Page, request.PageSize, request.Status, userId, ct);
        var user = await _userRepo.GetByIdAsync(userId, ct);

        var dtos = items.Select(w => MapToDto(w, user?.FullName, user?.Email)).ToList();
        return (dtos, totalCount);
    }

    // ──────────────────────────────────────────────
    //  STAFF: Xem tất cả yêu cầu rút tiền
    // ──────────────────────────────────────────────
    public async Task<(List<WithdrawalRequestDto> Items, int TotalCount)> GetAllWithdrawalsAsync(WithdrawalListRequest request, CancellationToken ct = default)
    {
        var (items, totalCount) = await _withdrawalRepo.GetPagedAsync(request.Page, request.PageSize, request.Status, null, ct);

        var dtos = new List<WithdrawalRequestDto>();
        foreach (var w in items)
        {
            var user = await _userRepo.GetByIdAsync(w.UserId, ct);
            string? processedByName = null;
            if (w.ProcessedBy.HasValue)
            {
                var processor = await _userRepo.GetByIdAsync(w.ProcessedBy.Value, ct);
                processedByName = processor?.FullName;
            }
            dtos.Add(MapToDto(w, user?.FullName, user?.Email, processedByName));
        }
        return (dtos, totalCount);
    }

    // ──────────────────────────────────────────────
    //  STAFF: Duyệt yêu cầu rút tiền
    // ──────────────────────────────────────────────
    public async Task<WithdrawalRequestDto> ApproveAsync(long withdrawalId, long staffId, ProcessWithdrawalRequest request, CancellationToken ct = default)
    {
        var withdrawal = await _withdrawalRepo.GetByIdAsync(withdrawalId, ct)
            ?? throw new NotFoundException("Yêu cầu rút tiền không tồn tại.");

        if (withdrawal.Status != "Pending")
            throw new ValidationException(new[] { "Chỉ có thể duyệt yêu cầu đang ở trạng thái Chờ xử lý." });

        // Trigger PayOS Payout (Chi hộ)
        try
        {
            var payoutInput = new CreatePayoutInput
            {
                ReferenceId = $"wd_{withdrawal.Id}_{DateTime.UtcNow.Ticks}",
                Amount = (int)withdrawal.Amount,
                Description = $"WITHDRAW {withdrawal.Id}",
                ToBin = withdrawal.BankBin ?? "",
                ToAccountNumber = withdrawal.BankAccountNumber
            };

            var payoutResult = await _payOsService.CreatePayoutAsync(payoutInput);
            
            withdrawal.ExternalTransactionRef = payoutResult.PayoutId; // Store Payout ID
            withdrawal.ProcessNote = $"Tự động tạo lô chi hộ PayOS: ID={payoutResult.PayoutId}, State={payoutResult.State}. {request.Note}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create PayOS payout for withdrawal #{WithdrawalId}", withdrawalId);
            throw new ValidationException(new[] { $"Lỗi cổng chi hộ PayOS: {ex.Message}. Vui lòng kiểm tra cấu hình kênh chuyển tiền." });
        }

        withdrawal.Status = "Approved";
        withdrawal.ProcessedBy = staffId;
        withdrawal.ProcessedAt = DateTime.UtcNow;
        _withdrawalRepo.Update(withdrawal);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLog.LogAsync(staffId, "Staff", "Withdrawal.Approve", "WithdrawalRequest", withdrawalId,
            new { OldStatus = "Pending" }, new { NewStatus = "Approved", request.Note }, ct: ct);

        _logger.LogInformation("Staff #{StaffId} approved withdrawal #{WithdrawalId} with PayOS auto-payout", staffId, withdrawalId);

        var user = await _userRepo.GetByIdAsync(withdrawal.UserId, ct);
        return MapToDto(withdrawal, user?.FullName, user?.Email);
    }

    // ──────────────────────────────────────────────
    //  STAFF: Xác nhận đã chuyển khoản xong
    // ──────────────────────────────────────────────
    public async Task<WithdrawalRequestDto> CompleteAsync(long withdrawalId, long staffId, ProcessWithdrawalRequest request, CancellationToken ct = default)
    {
        var withdrawal = await _withdrawalRepo.GetByIdAsync(withdrawalId, ct)
            ?? throw new NotFoundException("Yêu cầu rút tiền không tồn tại.");

        if (withdrawal.Status != "Approved")
            throw new ValidationException(new[] { "Chỉ có thể hoàn tất yêu cầu đã được duyệt." });

        withdrawal.Status = "Completed";
        withdrawal.ProcessedBy = staffId;
        withdrawal.ExternalTransactionRef = request.ExternalTransactionRef;
        withdrawal.ProcessNote = request.Note;
        withdrawal.ProcessedAt = DateTime.UtcNow;
        _withdrawalRepo.Update(withdrawal);

        // Update wallet transaction status
        var walletTxs = await _walletRepo.FindAsync(w => w.UserId == withdrawal.UserId, ct);
        // Mark the frozen transaction as completed — it stays deducted

        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLog.LogAsync(staffId, "Staff", "Withdrawal.Complete", "WithdrawalRequest", withdrawalId,
            new { OldStatus = "Approved" },
            new { NewStatus = "Completed", request.ExternalTransactionRef, request.Note }, ct: ct);

        // Notify user
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = withdrawal.UserId,
            Type = "System",
            Title = "Rút tiền thành công",
            Body = $"Yêu cầu rút {withdrawal.Amount:N0}đ đã được xử lý. Tiền đã chuyển vào tài khoản {withdrawal.BankAccountNumber} ({withdrawal.BankName}).",
            DataJson = "{}",
            Channel = "InApp"
        }, ct);

        _logger.LogInformation("Staff #{StaffId} completed withdrawal #{WithdrawalId}, ExternalRef={Ref}", staffId, withdrawalId, request.ExternalTransactionRef);

        var user = await _userRepo.GetByIdAsync(withdrawal.UserId, ct);
        return MapToDto(withdrawal, user?.FullName, user?.Email);
    }

    // ──────────────────────────────────────────────
    //  STAFF: Từ chối yêu cầu + hoàn tiền
    // ──────────────────────────────────────────────
    public async Task<WithdrawalRequestDto> RejectAsync(long withdrawalId, long staffId, RejectWithdrawalRequest request, CancellationToken ct = default)
    {
        var withdrawal = await _withdrawalRepo.GetByIdAsync(withdrawalId, ct)
            ?? throw new NotFoundException("Yêu cầu rút tiền không tồn tại.");

        if (withdrawal.Status != "Pending" && withdrawal.Status != "Approved")
            throw new ValidationException(new[] { "Không thể từ chối yêu cầu ở trạng thái này." });

        var oldStatus = withdrawal.Status;

        // Refund the frozen amount back to wallet
        var wallets = await _walletRepo.FindAsync(w => w.UserId == withdrawal.UserId, ct);
        var wallet = wallets.FirstOrDefault();
        if (wallet != null)
        {
            var refundTx = new WalletTransaction
            {
                WalletId = wallet.Id,
                Type = WalletTransactionType.PayoutReversal,
                Amount = withdrawal.Amount,
                BalanceAfter = wallet.Balance + withdrawal.Amount,
                IdempotencyKey = $"withdrawal_refund_{withdrawalId}",
                Note = $"Hoàn tiền do yêu cầu rút bị từ chối: {request.Reason}",
                Status = "Completed"
            };
            await _walletRepo.AddTransactionAsync(refundTx, ct);
            wallet.Balance += withdrawal.Amount;
            wallet.TotalSpent -= withdrawal.Amount;
            _walletRepo.Update(wallet);
        }

        withdrawal.Status = "Rejected";
        withdrawal.ProcessedBy = staffId;
        withdrawal.ProcessNote = request.Reason;
        withdrawal.ProcessedAt = DateTime.UtcNow;
        _withdrawalRepo.Update(withdrawal);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLog.LogAsync(staffId, "Staff", "Withdrawal.Reject", "WithdrawalRequest", withdrawalId,
            new { OldStatus = oldStatus }, new { NewStatus = "Rejected", request.Reason }, ct: ct);

        // Notify user
        await _notificationService.CreateAsync(new CreateNotificationRequest
        {
            UserId = withdrawal.UserId,
            Type = "System",
            Title = "Yêu cầu rút tiền bị từ chối",
            Body = $"Yêu cầu rút {withdrawal.Amount:N0}đ đã bị từ chối. Lý do: {request.Reason}. Tiền đã được hoàn lại vào ví.",
            DataJson = "{}",
            Channel = "InApp"
        }, ct);

        _logger.LogInformation("Staff #{StaffId} rejected withdrawal #{WithdrawalId}, Reason={Reason}", staffId, withdrawalId, request.Reason);

        var user = await _userRepo.GetByIdAsync(withdrawal.UserId, ct);
        return MapToDto(withdrawal, user?.FullName, user?.Email);
    }

    // ──────────────────────────────────────────────
    //  OWNER: Lấy thông tin tài khoản ngân hàng hiện tại
    // ──────────────────────────────────────────────
    public async Task<OwnerBankDetailsDto> GetBankAccountAsync(long userId, CancellationToken ct = default)
    {
        var ownerProfile = await _userRepo.GetOwnerProfileByUserIdAsync(userId, ct)
            ?? throw new ValidationException(new[] { "Bạn chưa có hồ sơ chủ xe." });

        return new OwnerBankDetailsDto(
            ownerProfile.BankAccountNumber,
            ownerProfile.BankName,
            ownerProfile.BankAccountHolderName,
            ownerProfile.BankBin
        );
    }

    // ──────────────────────────────────────────────
    //  OWNER: Gửi OTP để xác thực tài khoản NH
    // ──────────────────────────────────────────────
    public async Task RequestBankAccountOtpAsync(long userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        await _otpService.CreateOtpAsync(user.Email, OtpPurpose.BankAccountUpdate, userId, null, ct);
    }

    // ──────────────────────────────────────────────
    //  OWNER: Xác thực OTP + lưu thông tin NH
    // ──────────────────────────────────────────────
    public async Task VerifyBankAccountOtpAsync(long userId, VerifyBankAccountOtpRequest request, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new NotFoundException("Người dùng không tồn tại.");

        // Verify OTP
        await _otpService.VerifyOtpAsync(user.Email, request.Otp, OtpPurpose.BankAccountUpdate, ct);

        // Update bank account info
        var ownerProfile = await _userRepo.GetOwnerProfileByUserIdAsync(userId, ct)
            ?? throw new ValidationException(new[] { "Bạn chưa có hồ sơ chủ xe." });

        var oldBank = new
        {
            ownerProfile.BankAccountNumber,
            ownerProfile.BankName,
            ownerProfile.BankAccountHolderName,
            ownerProfile.BankBin
        };

        ownerProfile.BankAccountNumber = request.BankAccountNumber;
        ownerProfile.BankName = request.BankName;
        ownerProfile.BankAccountHolderName = request.BankAccountHolderName;
        ownerProfile.BankBin = request.BankBin;

        _userRepo.UpdateOwnerProfile(ownerProfile);
        await _unitOfWork.SaveChangesAsync(ct);

        await _auditLog.LogAsync(userId, "Owner", "BankAccount.Update", "OwnerProfile", ownerProfile.Id, oldBank,
            new { request.BankAccountNumber, request.BankName, request.BankAccountHolderName, request.BankBin }, ct: ct);

        _logger.LogInformation("User #{UserId} updated bank account to {Bank} {Account}", userId, request.BankName, request.BankAccountNumber);
    }

    // ──────────────────────────────────────────────
    //  Helper: Map entity → DTO
    // ──────────────────────────────────────────────
    private static WithdrawalRequestDto MapToDto(WithdrawalRequest w, string? userFullName = null, string? userEmail = null, string? processedByName = null)
    {
        return new WithdrawalRequestDto(
            w.Id, w.UserId, userFullName, userEmail,
            w.Amount, w.BankAccountNumber, w.BankName, w.BankAccountHolderName, w.BankBin,
            w.Status, w.ProcessedBy, processedByName, w.ProcessNote, w.ExternalTransactionRef,
            w.ProcessedAt, w.CreatedAt
        );
    }
}
