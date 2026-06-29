using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleDocumentFileLifecycleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "delete_reason",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "VehicleDocuments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "file_public_id",
                table: "VehicleDocuments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_current",
                table: "VehicleDocuments",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDocuments_vehicle_id_is_current",
                table: "VehicleDocuments",
                columns: new[] { "vehicle_id", "is_current" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_VehicleDocuments_vehicle_id_is_current",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "delete_reason",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "file_public_id",
                table: "VehicleDocuments");

            migrationBuilder.DropColumn(
                name: "is_current",
                table: "VehicleDocuments");
        }
    }
}
