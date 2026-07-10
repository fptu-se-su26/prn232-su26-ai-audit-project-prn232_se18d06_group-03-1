using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDriverLicenseProfileDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerProfiles_VerificationRequests_driver_license_verifi~",
                table: "CustomerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfiles_driver_license_verification_request_id",
                table: "CustomerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfiles_driver_license_verified_vehicle_types",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_class",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_number",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_verification_request_id",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_verified_at",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_verified_vehicle_types",
                table: "CustomerProfiles");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "driver_license_class",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_number",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "driver_license_verification_request_id",
                table: "CustomerProfiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "driver_license_verified_at",
                table: "CustomerProfiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "driver_license_verified_vehicle_types",
                table: "CustomerProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfiles_driver_license_verification_request_id",
                table: "CustomerProfiles",
                column: "driver_license_verification_request_id");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfiles_driver_license_verified_vehicle_types",
                table: "CustomerProfiles",
                column: "driver_license_verified_vehicle_types");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerProfiles_VerificationRequests_driver_license_verifi~",
                table: "CustomerProfiles",
                column: "driver_license_verification_request_id",
                principalTable: "VerificationRequests",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
