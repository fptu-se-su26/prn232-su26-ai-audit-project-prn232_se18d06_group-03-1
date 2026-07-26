namespace MoveVN.Infrastructure.Services;

public class EmailDeliverySkippedException : Exception
{
    public EmailDeliverySkippedException(string message) : base(message)
    {
    }
}
