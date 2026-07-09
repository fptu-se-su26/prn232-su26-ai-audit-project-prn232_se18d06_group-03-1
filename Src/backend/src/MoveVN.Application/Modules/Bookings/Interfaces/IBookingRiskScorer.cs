using MoveVN.Application.Modules.Bookings.DTOs;

namespace MoveVN.Application.Modules.Bookings.Interfaces;

public interface IBookingRiskScorer
{
    BookingRiskResult Calculate(BookingRiskContext context);
}
