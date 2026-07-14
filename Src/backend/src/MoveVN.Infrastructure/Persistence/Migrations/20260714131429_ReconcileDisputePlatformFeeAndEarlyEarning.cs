using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReconcileDisputePlatformFeeAndEarlyEarning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    earning RECORD;
                    balance_after numeric;
                    admin_user_id bigint;
                    admin_wallet_id bigint;
                    fee RECORD;
                    refund RECORD;
                    customer_wallet_id bigint;
                BEGIN
                    FOR earning IN
                        SELECT transaction.id, transaction.wallet_id, transaction.amount, booking.id AS booking_id, booking.booking_code
                        FROM "WalletTransactions" AS transaction
                        INNER JOIN "Bookings" AS booking
                            ON transaction.idempotency_key = 'booking_earning_' || booking.id::text
                        WHERE transaction.status = 'Completed'
                          AND transaction.amount > 0
                          AND booking.deposit_amount > booking.platform_fee
                          AND EXISTS (
                              SELECT 1 FROM "Disputes" AS dispute
                              WHERE dispute.booking_id = booking.id
                                AND dispute.platform_settlement_completed_at IS NOT NULL
                          )
                          AND NOT EXISTS (
                              SELECT 1 FROM "WalletTransactions" AS reversal
                              WHERE reversal.idempotency_key = 'booking_earning_reversal_' || booking.id::text
                          )
                    LOOP
                        UPDATE "Wallets"
                        SET balance = balance - earning.amount,
                            total_earned = GREATEST(total_earned - earning.amount, 0),
                            updated_at = NOW()
                        WHERE id = earning.wallet_id
                        RETURNING balance INTO balance_after;

                        INSERT INTO "WalletTransactions" (
                            wallet_id, type, amount, balance_after, reference_id,
                            idempotency_key, note, status, created_at)
                        VALUES (
                            earning.wallet_id,
                            'BookingEarningReversal',
                            -earning.amount,
                            balance_after,
                            earning.booking_id,
                            'booking_earning_reversal_' || earning.booking_id::text,
                            'Thu hồi khoản giải ngân trùng của booking ' || earning.booking_code,
                            'Completed',
                            NOW());
                    END LOOP;

                    SELECT user_role.user_id INTO admin_user_id
                    FROM "UserRoles" AS user_role
                    INNER JOIN "Roles" AS role ON role.id = user_role.role_id
                    WHERE role.name = 'Admin'
                    ORDER BY user_role.user_id
                    LIMIT 1;

                    IF admin_user_id IS NULL THEN
                        RAISE EXCEPTION 'Cannot reconcile platform fees because no admin account exists.';
                    END IF;

                    SELECT id INTO admin_wallet_id FROM "Wallets" WHERE user_id = admin_user_id LIMIT 1;
                    IF admin_wallet_id IS NULL THEN
                        INSERT INTO "Wallets" (user_id, balance, total_earned, total_spent, updated_at)
                        VALUES (admin_user_id, 0, 0, 0, NOW())
                        RETURNING id INTO admin_wallet_id;
                    END IF;

                    FOR fee IN
                        SELECT DISTINCT ON (booking.id)
                            booking.id AS booking_id,
                            booking.booking_code,
                            booking.platform_fee
                        FROM "Bookings" AS booking
                        INNER JOIN "Disputes" AS dispute ON dispute.booking_id = booking.id
                        WHERE booking.deposit_amount > booking.platform_fee
                          AND dispute.platform_settlement_completed_at IS NOT NULL
                          AND NOT EXISTS (
                              SELECT 1 FROM "WalletTransactions" AS transaction
                              WHERE transaction.idempotency_key = 'booking_platform_fee_' || booking.id::text
                          )
                        ORDER BY booking.id, dispute.platform_settlement_completed_at DESC
                    LOOP
                        UPDATE "Wallets"
                        SET balance = balance + fee.platform_fee,
                            total_earned = total_earned + fee.platform_fee,
                            updated_at = NOW()
                        WHERE id = admin_wallet_id
                        RETURNING balance INTO balance_after;

                        INSERT INTO "WalletTransactions" (
                            wallet_id, type, amount, balance_after, reference_id,
                            idempotency_key, note, status, created_at)
                        VALUES (
                            admin_wallet_id,
                            'PlatformFeeRevenue',
                            fee.platform_fee,
                            balance_after,
                            fee.booking_id,
                            'booking_platform_fee_' || fee.booking_id::text,
                            'Phí nền tảng từ booking ' || fee.booking_code,
                            'Completed',
                            NOW());
                    END LOOP;

                    FOR refund IN
                        SELECT DISTINCT ON (booking.id)
                            dispute.id AS dispute_id,
                            booking.customer_id,
                            booking.booking_code,
                            GREATEST(
                                booking.deposit_amount - booking.platform_fee - COALESCE((
                                    SELECT SUM(settled.platform_settled_amount)
                                    FROM "Disputes" AS settled
                                    WHERE settled.booking_id = booking.id
                                      AND settled.platform_settlement_completed_at IS NOT NULL
                                ), 0),
                                0
                            ) AS refund_amount
                        FROM "Bookings" AS booking
                        INNER JOIN "Disputes" AS dispute ON dispute.booking_id = booking.id
                        WHERE booking.deposit_amount > booking.platform_fee
                          AND dispute.platform_settlement_completed_at IS NOT NULL
                          AND NOT EXISTS (
                              SELECT 1 FROM "WalletTransactions" AS transaction
                              WHERE transaction.idempotency_key = 'dispute_deposit_refund_' || dispute.id::text
                          )
                        ORDER BY booking.id, dispute.platform_settlement_completed_at DESC
                    LOOP
                        IF refund.refund_amount > 0 THEN
                            SELECT id INTO customer_wallet_id FROM "Wallets" WHERE user_id = refund.customer_id LIMIT 1;
                            IF customer_wallet_id IS NULL THEN
                                INSERT INTO "Wallets" (user_id, balance, total_earned, total_spent, updated_at)
                                VALUES (refund.customer_id, 0, 0, 0, NOW())
                                RETURNING id INTO customer_wallet_id;
                            END IF;

                            UPDATE "Wallets"
                            SET balance = balance + refund.refund_amount,
                                total_spent = GREATEST(total_spent - refund.refund_amount, 0),
                                updated_at = NOW()
                            WHERE id = customer_wallet_id
                            RETURNING balance INTO balance_after;

                            INSERT INTO "WalletTransactions" (
                                wallet_id, type, amount, balance_after, reference_id,
                                idempotency_key, note, status, created_at)
                            VALUES (
                                customer_wallet_id,
                                'Refund',
                                refund.refund_amount,
                                balance_after,
                                refund.dispute_id,
                                'dispute_deposit_refund_' || refund.dispute_id::text,
                                'Hoàn tiền cọc còn dư dispute #' || refund.dispute_id::text || ' của booking ' || refund.booking_code,
                                'Completed',
                                NOW());
                        END IF;
                    END LOOP;
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Ledger reconciliation cannot be safely reversed after balances are used.
        }
    }
}
