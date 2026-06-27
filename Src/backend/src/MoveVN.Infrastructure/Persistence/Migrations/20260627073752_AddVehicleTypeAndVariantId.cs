using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleTypeAndVariantId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "odometer_km",
                table: "Vehicles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "variant_id",
                table: "Vehicles",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "vehicle_type",
                table: "Vehicles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_owner_id_status_vehicle_type",
                table: "Vehicles",
                columns: new[] { "owner_id", "status", "vehicle_type" });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_variant_id",
                table: "Vehicles",
                column: "variant_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_VehicleModelVariant_variant_id",
                table: "Vehicles",
                column: "variant_id",
                principalTable: "VehicleModelVariant",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_VehicleModelVariant_variant_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_owner_id_status_vehicle_type",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_variant_id",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "odometer_km",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "variant_id",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "vehicle_type",
                table: "Vehicles");
        }
    }
}
