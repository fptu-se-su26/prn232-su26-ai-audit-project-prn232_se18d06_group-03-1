using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleDocumentVerificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "decision_reason",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocr_brand",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocr_chassis_number",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ocr_confidence",
                table: "VehicleDocuments",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocr_engine_number",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocr_license_plate",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocr_model",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "processed_at",
                table: "VehicleDocuments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "verification_provider",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "verification_status",
                table: "VehicleDocuments",
                type: "text",
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDocuments_verification_status",
                table: "VehicleDocuments",
                column: "verification_status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments");

            migrationBuilder.DropIndex(
                name: "IX_VehicleDocuments_verification_status",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "decision_reason",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_brand",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_chassis_number",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_confidence",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_engine_number",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_license_plate",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "ocr_model",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "processed_at",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "verification_provider",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "verification_status",
                table: "VehicleDocuments");
        }
    }
}
