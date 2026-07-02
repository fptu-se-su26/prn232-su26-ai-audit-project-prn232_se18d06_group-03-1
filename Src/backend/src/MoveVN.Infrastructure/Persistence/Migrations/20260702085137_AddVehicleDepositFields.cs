using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleDepositFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "deposit_amount",
                table: "Vehicles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "requires_deposit",
                table: "Vehicles",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "deposit_amount",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "requires_deposit",
                table: "Vehicles");
        }
    }
}
