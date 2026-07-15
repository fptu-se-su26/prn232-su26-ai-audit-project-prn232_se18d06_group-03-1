namespace MoveVN.Application.Modules.Bookings.Services;

public sealed record BookingCancellationCalculation(
    int RefundPercent,
    decimal RefundAmount,
    decimal ForfeitedAmount,
    string PolicyMessage);

public static class BookingCancellationPolicy
{
    public static BookingCancellationCalculation Calculate(
        decimal paidDepositAmount,
        DateTime pickupAt,
        DateTime cancelledAt)
    {
        paidDepositAmount = Math.Max(paidDepositAmount, 0m);
        var timeBeforePickup = pickupAt - cancelledAt;

        var refundPercent = timeBeforePickup >= TimeSpan.FromDays(7)
            ? 100
            : timeBeforePickup >= TimeSpan.FromDays(3)
                ? 50
                : 0;

        var refundAmount = Math.Round(paidDepositAmount * refundPercent / 100m, 0);
        var forfeitedAmount = Math.Max(paidDepositAmount - refundAmount, 0m);
        var message = refundPercent switch
        {
            100 => "Hủy trước giờ nhận xe ít nhất 7 ngày: hoàn 100% tiền cọc.",
            50 => "Hủy trước giờ nhận xe từ 3 đến dưới 7 ngày: hoàn 50% tiền cọc.",
            _ => "Hủy trước giờ nhận xe dưới 3 ngày: không hoàn tiền cọc."
        };

        return new BookingCancellationCalculation(refundPercent, refundAmount, forfeitedAmount, message);
    }
}
