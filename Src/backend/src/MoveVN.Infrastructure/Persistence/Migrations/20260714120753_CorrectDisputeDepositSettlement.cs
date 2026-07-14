using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CorrectDisputeDepositSettlement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                WITH recalculated AS (
                    SELECT
                        d.id,
                        COALESCE(d.admin_approved_amount, d.compensation_amount, 0) AS decision_amount,
                        LEAST(
                            COALESCE(d.admin_approved_amount, d.compensation_amount, 0),
                            GREATEST(
                                b.deposit_amount - COALESCE((
                                    SELECT SUM(previous.platform_settled_amount)
                                    FROM "Disputes" AS previous
                                    WHERE previous.booking_id = d.booking_id
                                      AND previous.id <> d.id
                                      AND previous.platform_settlement_completed_at IS NOT NULL
                                ), 0),
                                0
                            )
                        ) AS platform_amount
                    FROM "Disputes" AS d
                    INNER JOIN "Bookings" AS b ON b.id = d.booking_id
                    WHERE d.status = 'AwaitingExternalSettlement'
                      AND d.compensation_direction = 'CustomerPaysOwner'
                      AND d.platform_settlement_completed_at IS NULL
                      AND d.customer_external_confirmed = FALSE
                      AND d.owner_external_confirmed = FALSE
                      AND NOT EXISTS (
                          SELECT 1
                          FROM "WalletTransactions" AS transaction
                          WHERE transaction.idempotency_key = 'booking_earning_' || b.id::text
                      )
                )
                UPDATE "Disputes" AS dispute
                SET platform_settled_amount = recalculated.platform_amount,
                    external_settlement_amount = recalculated.decision_amount - recalculated.platform_amount,
                    updated_at = NOW()
                FROM recalculated
                WHERE dispute.id = recalculated.id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Data correction cannot be safely reversed after a settlement is confirmed.
        }
    }
}
