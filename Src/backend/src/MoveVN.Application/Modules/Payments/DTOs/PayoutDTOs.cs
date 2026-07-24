namespace MoveVN.Application.Modules.Payments.DTOs;

public record PayoutBalanceDto(decimal Balance);

public record PayoutStatusDto(
    string PayoutId,
    string State,
    int Amount
);
