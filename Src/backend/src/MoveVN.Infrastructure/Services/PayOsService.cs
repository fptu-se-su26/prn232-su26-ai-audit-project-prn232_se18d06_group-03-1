using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MoveVN.Application.Interfaces;
using PayOS;
using PayOS.Models.V1.Payouts;
using PayOS.Models.V1.PayoutsAccount;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace MoveVN.Infrastructure.Services;

public class PayOsService : IPayOsService
{
    private readonly PayOSClient _payOS;
    private readonly PayOsSettings _settings;
    private readonly ILogger<PayOsService> _logger;

    public PayOsService(IOptions<PayOsSettings> settings, ILogger<PayOsService> logger)
    {
        _settings = settings.Value;
        _logger = logger;
        _payOS = new PayOSClient(_settings.ClientId, _settings.ApiKey, _settings.ChecksumKey);
    }

    public async Task<PaymentLinkResult> CreatePaymentLinkAsync(CreatePaymentLinkInput input)
    {
        var items = input.Items?.Select(i => new PaymentLinkItem { Name = i.Name, Quantity = i.Quantity, Price = i.Price }).ToList()
                    ?? new List<PaymentLinkItem> { new PaymentLinkItem { Name = "Thanh toan dat xe", Quantity = 1, Price = input.Amount } };

        var expiredAt = input.ExpireAfterMinutes.HasValue
            ? (int)DateTimeOffset.UtcNow.AddMinutes(input.ExpireAfterMinutes.Value).ToUnixTimeSeconds()
            : 0;

        var paymentData = new CreatePaymentLinkRequest
        {
            OrderCode = input.OrderCode,
            Amount = input.Amount,
            Description = TruncateDescription(input.Description),
            Items = items,
            CancelUrl = input.CancelUrl ?? _settings.CancelUrl,
            ReturnUrl = input.ReturnUrl ?? _settings.ReturnUrl,
            ExpiredAt = expiredAt > 0 ? expiredAt : null
        };

        _logger.LogInformation("Creating PayOS payment link: OrderCode={OrderCode}, Amount={Amount}",
            input.OrderCode, input.Amount);

        var response = await _payOS.PaymentRequests.CreateAsync(paymentData);

        return new PaymentLinkResult
        {
            CheckoutUrl = response.CheckoutUrl,
            QrCode = response.QrCode,
            PaymentLinkId = response.PaymentLinkId,
            OrderCode = response.OrderCode
        };
    }

    public async Task<PaymentLinkInfo> GetPaymentLinkInfoAsync(long orderCode)
    {
        var response = await _payOS.PaymentRequests.GetAsync(orderCode);

        return new PaymentLinkInfo
        {
            OrderCode = response.OrderCode,
            Amount = (int)response.Amount,
            AmountPaid = (int)response.AmountPaid,
            Status = response.Status.ToString()
        };
    }

    public async Task CancelPaymentLinkAsync(long orderCode, string reason)
    {
        _logger.LogInformation("Cancelling PayOS payment link: OrderCode={OrderCode}, Reason={Reason}",
            orderCode, reason);

        await _payOS.PaymentRequests.CancelAsync(orderCode, reason);
    }

    public async Task<PayoutResult> CreatePayoutAsync(CreatePayoutInput input)
    {
        _logger.LogInformation("Creating PayOS payout: Ref={ReferenceId}, Amount={Amount}, Bank={BankBin}/{Account}",
            input.ReferenceId, input.Amount, input.ToBin, input.ToAccountNumber);

        var payoutRequest = new PayoutRequest
        {
            ReferenceId = input.ReferenceId,
            Amount = input.Amount,
            Description = TruncateDescription(input.Description),
            ToBin = input.ToBin,
            ToAccountNumber = input.ToAccountNumber
        };

        var response = await _payOS.Payouts.CreateAsync(payoutRequest);

        return new PayoutResult
        {
            PayoutId = response.Id,
            ReferenceId = response.ReferenceId,
            State = response.ApprovalState.ToString()
        };
    }

    public async Task<PayoutInfo> GetPayoutInfoAsync(string payoutId)
    {
        var response = await _payOS.Payouts.GetAsync(payoutId);

        return new PayoutInfo
        {
            PayoutId = response.Id,
            State = response.ApprovalState.ToString(),
            Amount = response.Transactions != null && response.Transactions.Count > 0 
                ? (int)response.Transactions[0].Amount 
                : 0
        };
    }

    public async Task<decimal> GetPayoutBalanceAsync()
    {
        var response = await _payOS.PayoutsAccount.GetBalanceAsync();
        if (decimal.TryParse(response.Balance, out var balance))
        {
            return balance;
        }
        return 0;
    }

    public bool VerifyWebhookSignature(string rawBody, string signature)
    {
        try
        {
            var webhook = JsonSerializer.Deserialize<Webhook>(rawBody);
            if (webhook == null) return false;
            
            // Note: VerifyAsync requires the full Webhook object
            var verifiedData = _payOS.Webhooks.VerifyAsync(webhook).GetAwaiter().GetResult();
            return verifiedData != null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "PayOS webhook signature verification failed");
            return false;
        }
    }

    /// <summary>
    /// PayOS description is limited to 25 characters.
    /// </summary>
    private static string TruncateDescription(string description)
    {
        if (string.IsNullOrWhiteSpace(description))
            return "MOVEVN";

        var clean = description
            .Replace(" ", "")
            .ToUpperInvariant();

        return clean.Length <= 25 ? clean : clean[..25];
    }
}
