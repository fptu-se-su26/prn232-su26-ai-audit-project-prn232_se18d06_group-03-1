using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverLicenseVehicleTypeVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "requested_vehicle_type",
                table: "VerificationRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_verified_vehicle_types",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_user_id_type_requested_vehicle_type",
                table: "VerificationRequests",
                columns: new[] { "user_id", "type", "requested_vehicle_type" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfiles_driver_license_verified_vehicle_types",
                table: "CustomerProfiles",
                column: "driver_license_verified_vehicle_types");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VerificationRequests_user_id_type_requested_vehicle_type",
                table: "VerificationRequests");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfiles_driver_license_verified_vehicle_types",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "requested_vehicle_type",
                table: "VerificationRequests");

            migrationBuilder.DropColumn(
                name: "driver_license_verified_vehicle_types",
                table: "CustomerProfiles");
        }
    }
}
