using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDisputeSettlementMethod : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "settlement_method",
                table: "Disputes",
                type: "text",
                nullable: false,
                defaultValue: "DepositThenExternal");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "settlement_method",
                table: "Disputes");
        }
    }
}
