using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleAreaAndSimplifyModelPricing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "year_from",
                table: "VehicleModelPricing");

            migrationBuilder.DropColumn(
                name: "year_to",
                table: "VehicleModelPricing");

            migrationBuilder.AddColumn<int>(
                name: "area_id",
                table: "Vehicles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_area_id",
                table: "Vehicles",
                column: "area_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id",
                table: "VehicleModelPricing",
                columns: new[] { "model_id", "pricing_region_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Area_province_district",
                table: "Area",
                columns: new[] { "province", "district" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Area_area_id",
                table: "Vehicles",
                column: "area_id",
                principalTable: "Area",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Area_area_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_area_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_Area_province_district",
                table: "Area");

            migrationBuilder.DropColumn(
                name: "area_id",
                table: "Vehicles");

            migrationBuilder.AddColumn<short>(
                name: "year_from",
                table: "VehicleModelPricing",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.AddColumn<short>(
                name: "year_to",
                table: "VehicleModelPricing",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);

            migrationBuilder.CreateIndex(
                name: "IX_Area_province_district",
                table: "Area",
                columns: new[] { "province", "district" });
        }
    }
}
