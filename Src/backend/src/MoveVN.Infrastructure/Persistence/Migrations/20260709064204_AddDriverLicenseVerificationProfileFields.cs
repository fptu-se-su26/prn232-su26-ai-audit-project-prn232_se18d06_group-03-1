using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverLicenseVerificationProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "driver_license_class",
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

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_user_id_type_created_at",
                table: "VerificationRequests",
                columns: new[] { "user_id", "type", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_user_id_type_status",
                table: "VerificationRequests",
                columns: new[] { "user_id", "type", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfiles_driver_license_verification_request_id",
                table: "CustomerProfiles",
                column: "driver_license_verification_request_id");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerProfiles_VerificationRequests_driver_license_verifi~",
                table: "CustomerProfiles",
                column: "driver_license_verification_request_id",
                principalTable: "VerificationRequests",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerProfiles_VerificationRequests_driver_license_verifi~",
                table: "CustomerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_VerificationRequests_user_id_type_created_at",
                table: "VerificationRequests");

            migrationBuilder.DropIndex(
                name: "IX_VerificationRequests_user_id_type_status",
                table: "VerificationRequests");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfiles_driver_license_verification_request_id",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_class",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_verification_request_id",
                table: "CustomerProfiles");

            migrationBuilder.DropColumn(
                name: "driver_license_verified_at",
                table: "CustomerProfiles");
        }
    }
}
