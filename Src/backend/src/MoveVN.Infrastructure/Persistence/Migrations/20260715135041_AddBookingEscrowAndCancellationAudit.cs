using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBookingEscrowAndCancellationAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "refunded_amount",
                table: "Payments",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "refunded_at",
                table: "Payments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "cancellation_forfeited_amount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "cancellation_owner_compensation",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "cancellation_platform_fee",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "cancellation_policy_tier",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "cancellation_refund_amount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "cancellation_source",
                table: "Bookings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "escrow_amount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "escrow_held_at",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "escrow_settled_at",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "escrow_status",
                table: "Bookings",
                type: "text",
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<DateTime>(
                name: "payment_due_at",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_status_payment_due_at",
                table: "Bookings",
                columns: new[] { "status", "payment_due_at" });

            migrationBuilder.Sql(
                """
                UPDATE "Bookings" AS b
                SET escrow_amount = paid.amount,
                    escrow_status = CASE WHEN b.status = 'Completed' THEN 'Released' ELSE 'Held' END,
                    escrow_held_at = paid.paid_at,
                    escrow_settled_at = CASE WHEN b.status = 'Completed' THEN COALESCE(b.updated_at, NOW()) ELSE NULL END
                FROM (
                    SELECT booking_id, SUM(amount) AS amount, MIN(paid_at) AS paid_at
                    FROM "Payments"
                    WHERE type = 'BookingDeposit' AND status = 'Paid' AND booking_id IS NOT NULL
                    GROUP BY booking_id
                ) AS paid
                WHERE b.id = paid.booking_id
                  AND b.status IN ('DepositPaid', 'Confirmed', 'InProgress', 'Completed');

                UPDATE "Bookings"
                SET payment_due_at = LEAST(NOW() + INTERVAL '2 hours', start_date)
                WHERE status = 'Approved' AND payment_due_at IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Bookings_status_payment_due_at",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "refunded_amount",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "refunded_at",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "cancellation_forfeited_amount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "cancellation_owner_compensation",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "cancellation_platform_fee",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "cancellation_policy_tier",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "cancellation_refund_amount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "cancellation_source",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "escrow_amount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "escrow_held_at",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "escrow_settled_at",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "escrow_status",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "payment_due_at",
                table: "Bookings");
        }
    }
}
