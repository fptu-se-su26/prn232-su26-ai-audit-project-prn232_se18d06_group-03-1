using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefundRemainingDisputeDeposit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO "Wallets" (user_id, balance, total_earned, total_spent, updated_at)
                SELECT DISTINCT b.customer_id, 0, 0, 0, NOW()
                FROM "Disputes" AS d
                INNER JOIN "Bookings" AS b ON b.id = d.booking_id
                WHERE d.compensation_direction = 'CustomerPaysOwner'
                  AND d.platform_settlement_completed_at IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM "Wallets" AS wallet WHERE wallet.user_id = b.customer_id
                  );

                WITH candidates AS (
                    SELECT DISTINCT ON (b.id)
                        d.id AS dispute_id,
                        b.customer_id,
                        b.booking_code,
                        GREATEST(
                            b.deposit_amount
                            - COALESCE((
                                SELECT SUM(settled.platform_settled_amount)
                                FROM "Disputes" AS settled
                                WHERE settled.booking_id = b.id
                                  AND settled.platform_settlement_completed_at IS NOT NULL
                            ), 0)
                            - COALESCE((
                                SELECT SUM(transaction.amount)
                                FROM "WalletTransactions" AS transaction
                                WHERE transaction.idempotency_key = 'booking_earning_' || b.id::text
                                  AND transaction.status = 'Completed'
                                  AND transaction.amount > 0
                            ), 0),
                            0
                        ) AS refund_amount
                    FROM "Disputes" AS d
                    INNER JOIN "Bookings" AS b ON b.id = d.booking_id
                    WHERE d.compensation_direction = 'CustomerPaysOwner'
                      AND d.platform_settlement_completed_at IS NOT NULL
                      AND NOT EXISTS (
                          SELECT 1
                          FROM "WalletTransactions" AS refund
                          WHERE refund.idempotency_key = 'dispute_deposit_refund_' || d.id::text
                      )
                    ORDER BY b.id, d.platform_settlement_completed_at DESC
                ),
                updated_wallets AS (
                    UPDATE "Wallets" AS wallet
                    SET balance = wallet.balance + candidate.refund_amount,
                        total_spent = GREATEST(wallet.total_spent - candidate.refund_amount, 0),
                        updated_at = NOW()
                    FROM candidates AS candidate
                    WHERE wallet.user_id = candidate.customer_id
                      AND candidate.refund_amount > 0
                    RETURNING
                        wallet.id AS wallet_id,
                        wallet.balance AS balance_after,
                        candidate.dispute_id,
                        candidate.booking_code,
                        candidate.refund_amount
                )
                INSERT INTO "WalletTransactions" (
                    wallet_id,
                    type,
                    amount,
                    balance_after,
                    reference_id,
                    idempotency_key,
                    note,
                    status,
                    created_at)
                SELECT
                    updated.wallet_id,
                    'Refund',
                    updated.refund_amount,
                    updated.balance_after,
                    updated.dispute_id,
                    'dispute_deposit_refund_' || updated.dispute_id::text,
                    'Hoàn tiền cọc còn dư dispute #' || updated.dispute_id::text || ' của booking ' || updated.booking_code,
                    'Completed',
                    NOW()
                FROM updated_wallets AS updated;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Wallet refunds cannot be safely reversed after customers use their balance.
        }
    }
}
