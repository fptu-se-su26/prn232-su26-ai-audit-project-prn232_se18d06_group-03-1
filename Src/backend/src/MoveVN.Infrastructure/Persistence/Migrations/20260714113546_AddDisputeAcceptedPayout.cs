using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDisputeAcceptedPayout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "platform_settlement_completed_at",
                table: "Disputes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_idempotency_key",
                table: "WalletTransactions",
                column: "idempotency_key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WalletTransactions_idempotency_key",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "platform_settlement_completed_at",
                table: "Disputes");
        }
    }
}
