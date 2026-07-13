using Microsoft.AspNetCore.Mvc;
using MoveVN.Application.Interfaces;
using MoveVN.Application.Modules.Payments.DTOs;
using MoveVN.Application.Modules.Payments.Interfaces;
using System.Text.Json;
using PayOS.Models.Webhooks;

namespace MoveVN.Api.Controllers;

[ApiController]
[Route("api/webhooks")]
public class WebhookController : ControllerBase
{
    private readonly IPaymentService _paymentService;
    private readonly IPayOsService _payOsService;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(
        IPaymentService paymentService, 
        IPayOsService payOsService, 
        ILogger<WebhookController> logger)
    {
        _paymentService = paymentService;
        _payOsService = payOsService;
        _logger = logger;
    }

    [HttpPost("payos")]
    public async Task<IActionResult> HandlePayOsWebhook(CancellationToken cancellationToken)
    {
        try
        {
            using var reader = new StreamReader(Request.Body);
            var rawBody = await reader.ReadToEndAsync(cancellationToken);

            var webhook = JsonSerializer.Deserialize<Webhook>(rawBody);
            if (webhook == null)
            {
                return BadRequest("Invalid webhook data");
            }

            // PayOS sends a confirmation webhook upon setup with no Data
            if (webhook.Data == null)
            {
                return Ok(new { success = true });
            }
            
            if (webhook.Code != "00")
            {
                _logger.LogInformation("Webhook received with code {Code}. Ignoring.", webhook.Code);
                return Ok(new { success = true });
            }

            var isValid = _payOsService.VerifyWebhookSignature(rawBody, webhook.Signature);
            if (!isValid)
            {
                _logger.LogWarning("Invalid webhook signature.");
                return BadRequest("Invalid signature");
            }

            var paymentData = new WebhookPaymentData(
                webhook.Data.OrderCode,
                webhook.Data.Amount,
                webhook.Data.Reference,
                webhook.Data.PaymentLinkId
            );

            await _paymentService.HandlePaymentConfirmedAsync(paymentData, cancellationToken);

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing PayOS webhook.");
            // PayOS expects 200 OK or it will retry. If we fail internally (e.g. database error), we return 500 to let them retry.
            return StatusCode(500, new { success = false, message = "Internal error" });
        }
    }
}
