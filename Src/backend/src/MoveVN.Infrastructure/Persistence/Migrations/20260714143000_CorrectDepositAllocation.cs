using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260714143000_CorrectDepositAllocation")]
    public partial class CorrectDepositAllocation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DO $$
                DECLARE
                    earning RECORD;
                    booking_row RECORD;
                    admin_user_id bigint;
                    admin_wallet_id bigint;
                    customer_wallet_id bigint;
                    balance_after numeric;
                    fee_amount numeric;
                    paid_compensation numeric;
                    refunded_amount numeric;
                    security_refund numeric;
                BEGIN
                    -- Deposit money is held money, never rental income for the owner.
                    FOR earning IN
                        SELECT transaction.wallet_id, transaction.amount, booking.id AS booking_id, booking.booking_code
                        FROM "WalletTransactions" AS transaction
                        INNER JOIN "Bookings" AS booking
                            ON transaction.idempotency_key = 'booking_earning_' || booking.id::text
                        WHERE transaction.status = 'Completed'
                          AND transaction.amount > 0
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
                            'Thu hồi khoản tiền cọc đã chuyển nhầm cho chủ xe của booking ' || earning.booking_code,
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
                        RAISE EXCEPTION 'Cannot correct deposit allocation because no admin account exists.';
                    END IF;

                    SELECT id INTO admin_wallet_id FROM "Wallets" WHERE user_id = admin_user_id LIMIT 1;
                    IF admin_wallet_id IS NULL THEN
                        INSERT INTO "Wallets" (user_id, balance, total_earned, total_spent, updated_at)
                        VALUES (admin_user_id, 0, 0, 0, NOW())
                        RETURNING id INTO admin_wallet_id;
                    END IF;

                    -- Allocate only completed bookings without an active dispute.
                    FOR booking_row IN
                        SELECT booking.*
                        FROM "Bookings" AS booking
                        WHERE booking.status = 'Completed'
                          AND booking.deposit_amount > 0
                          AND NOT EXISTS (
                              SELECT 1 FROM "Disputes" AS dispute
                              WHERE dispute.booking_id = booking.id
                                AND dispute.status <> 'Resolved'
                          )
                    LOOP
                        fee_amount := LEAST(GREATEST(booking_row.platform_fee, 0), GREATEST(booking_row.deposit_amount, 0));
                        IF fee_amount > 0 AND NOT EXISTS (
                            SELECT 1 FROM "WalletTransactions" AS transaction
                            WHERE transaction.idempotency_key = 'booking_platform_fee_' || booking_row.id::text
                        ) THEN
                            UPDATE "Wallets"
                            SET balance = balance + fee_amount,
                                total_earned = total_earned + fee_amount,
                                updated_at = NOW()
                            WHERE id = admin_wallet_id
                            RETURNING balance INTO balance_after;

                            INSERT INTO "WalletTransactions" (
                                wallet_id, type, amount, balance_after, reference_id,
                                idempotency_key, note, status, created_at)
                            VALUES (
                                admin_wallet_id,
                                'PlatformFeeRevenue',
                                fee_amount,
                                balance_after,
                                booking_row.id,
                                'booking_platform_fee_' || booking_row.id::text,
                                'Phí nền tảng từ booking ' || booking_row.booking_code,
                                'Completed',
                                NOW());
                        END IF;

                        SELECT COALESCE(SUM(dispute.platform_settled_amount), 0) INTO paid_compensation
                        FROM "Disputes" AS dispute
                        WHERE dispute.booking_id = booking_row.id
                          AND dispute.platform_settlement_completed_at IS NOT NULL;

                        SELECT COALESCE(SUM(transaction.amount), 0) INTO refunded_amount
                        FROM "WalletTransactions" AS transaction
                        WHERE transaction.type = 'Refund'
                          AND transaction.status = 'Completed'
                          AND (
                              transaction.idempotency_key = 'booking_deposit_refund_' || booking_row.id::text
                              OR (
                                  transaction.idempotency_key LIKE 'dispute_deposit_refund_%'
                                  AND EXISTS (
                                      SELECT 1 FROM "Disputes" AS dispute
                                      WHERE dispute.id = transaction.reference_id
                                        AND dispute.booking_id = booking_row.id
                                  )
                              )
                          );

                        security_refund := GREATEST(
                            booking_row.deposit_amount - fee_amount - paid_compensation - refunded_amount,
                            0);

                        IF security_refund > 0 AND NOT EXISTS (
                            SELECT 1 FROM "WalletTransactions" AS transaction
                            WHERE transaction.idempotency_key = 'booking_deposit_refund_' || booking_row.id::text
                        ) THEN
                            SELECT id INTO customer_wallet_id
                            FROM "Wallets"
                            WHERE user_id = booking_row.customer_id
                            LIMIT 1;

                            IF customer_wallet_id IS NULL THEN
                                INSERT INTO "Wallets" (user_id, balance, total_earned, total_spent, updated_at)
                                VALUES (booking_row.customer_id, 0, 0, 0, NOW())
                                RETURNING id INTO customer_wallet_id;
                            END IF;

                            UPDATE "Wallets"
                            SET balance = balance + security_refund,
                                total_spent = GREATEST(total_spent - security_refund, 0),
                                updated_at = NOW()
                            WHERE id = customer_wallet_id
                            RETURNING balance INTO balance_after;

                            INSERT INTO "WalletTransactions" (
                                wallet_id, type, amount, balance_after, reference_id,
                                idempotency_key, note, status, created_at)
                            VALUES (
                                customer_wallet_id,
                                'Refund',
                                security_refund,
                                balance_after,
                                booking_row.id,
                                'booking_deposit_refund_' || booking_row.id::text,
                                'Hoàn tiền bảo đảm booking ' || booking_row.booking_code,
                                'Completed',
                                NOW());
                        END IF;
                    END LOOP;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Wallet ledger corrections cannot be safely reversed after balances are used.
        }
    }
}
