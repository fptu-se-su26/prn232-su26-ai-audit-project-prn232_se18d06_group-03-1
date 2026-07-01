using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyPricingRegionModelAndRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropColumn(
                name: "pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropColumn(
                name: "vehicle_id",
                table: "PricingRules");

            migrationBuilder.AddColumn<int>(
                name: "brand_id",
                table: "PricingRules",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "model_id",
                table: "PricingRules",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "PricingRules",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "pricing_region_id",
                table: "PricingRules",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "coefficient",
                table: "PricingRegion",
                type: "numeric",
                nullable: false,
                defaultValue: 1.00m);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelPricing_model_id",
                table: "VehicleModelPricing",
                column: "model_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingRules_brand_id",
                table: "PricingRules",
                column: "brand_id");

            migrationBuilder.CreateIndex(
                name: "IX_PricingRules_model_id",
                table: "PricingRules",
                column: "model_id");

            migrationBuilder.CreateIndex(
                name: "IX_PricingRules_pricing_region_id",
                table: "PricingRules",
                column: "pricing_region_id");

            migrationBuilder.AddForeignKey(
                name: "FK_PricingRules_PricingRegion_pricing_region_id",
                table: "PricingRules",
                column: "pricing_region_id",
                principalTable: "PricingRegion",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PricingRules_VehicleBrand_brand_id",
                table: "PricingRules",
                column: "brand_id",
                principalTable: "VehicleBrand",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PricingRules_VehicleModel_model_id",
                table: "PricingRules",
                column: "model_id",
                principalTable: "VehicleModel",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleModelPricing_VehicleModel_model_id",
                table: "VehicleModelPricing",
                column: "model_id",
                principalTable: "VehicleModel",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PricingRules_PricingRegion_pricing_region_id",
                table: "PricingRules");

            migrationBuilder.DropForeignKey(
                name: "FK_PricingRules_VehicleBrand_brand_id",
                table: "PricingRules");

            migrationBuilder.DropForeignKey(
                name: "FK_PricingRules_VehicleModel_model_id",
                table: "PricingRules");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleModelPricing_VehicleModel_model_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_model_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_PricingRules_brand_id",
                table: "PricingRules");

            migrationBuilder.DropIndex(
                name: "IX_PricingRules_model_id",
                table: "PricingRules");

            migrationBuilder.DropIndex(
                name: "IX_PricingRules_pricing_region_id",
                table: "PricingRules");

            migrationBuilder.DropColumn(
                name: "brand_id",
                table: "PricingRules");

            migrationBuilder.DropColumn(
                name: "model_id",
                table: "PricingRules");

            migrationBuilder.DropColumn(
                name: "name",
                table: "PricingRules");

            migrationBuilder.DropColumn(
                name: "pricing_region_id",
                table: "PricingRules");

            migrationBuilder.DropColumn(
                name: "coefficient",
                table: "PricingRegion");

            migrationBuilder.AddColumn<int>(
                name: "pricing_region_id",
                table: "VehicleModelPricing",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<long>(
                name: "vehicle_id",
                table: "PricingRules",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id",
                table: "VehicleModelPricing",
                columns: new[] { "model_id", "pricing_region_id" },
                unique: true);
        }
    }
}
