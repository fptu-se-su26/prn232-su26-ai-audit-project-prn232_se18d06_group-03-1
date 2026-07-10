using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerDriverLicenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerDriverLicenses",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_type = table.Column<string>(type: "text", nullable: false),
                    license_number = table.Column<string>(type: "text", nullable: true),
                    license_class = table.Column<string>(type: "text", nullable: true),
                    front_image_url = table.Column<string>(type: "text", nullable: true),
                    front_image_public_id = table.Column<string>(type: "text", nullable: true),
                    verification_request_id = table.Column<long>(type: "bigint", nullable: false),
                    ocr_confidence = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerDriverLicenses", x => x.id);
                    table.ForeignKey(
                        name: "FK_CustomerDriverLicenses_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerDriverLicenses_VerificationRequests_verification_re~",
                        column: x => x.verification_request_id,
                        principalTable: "VerificationRequests",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDriverLicenses_user_id_vehicle_type",
                table: "CustomerDriverLicenses",
                columns: new[] { "user_id", "vehicle_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerDriverLicenses_verification_request_id",
                table: "CustomerDriverLicenses",
                column: "verification_request_id");

            migrationBuilder.Sql("""
                INSERT INTO "CustomerDriverLicenses" (
                    user_id,
                    vehicle_type,
                    license_number,
                    license_class,
                    front_image_url,
                    front_image_public_id,
                    verification_request_id,
                    ocr_confidence,
                    verified_at,
                    created_at)
                SELECT DISTINCT
                    cp.user_id,
                    CASE
                        WHEN trim(vehicle_type.value) = 'Motorcycle' THEN 'Motorbike'
                        ELSE trim(vehicle_type.value)
                    END,
                    cp.driver_license_number,
                    cp.driver_license_class,
                    vr.front_image_url,
                    vr.front_image_public_id,
                    cp.driver_license_verification_request_id,
                    vr.confidence,
                    COALESCE(cp.driver_license_verified_at, vr.processed_at, vr.created_at, NOW()),
                    COALESCE(cp.driver_license_verified_at, vr.created_at, NOW())
                FROM "CustomerProfiles" cp
                JOIN "VerificationRequests" vr ON vr.id = cp.driver_license_verification_request_id
                CROSS JOIN LATERAL unnest(string_to_array(COALESCE(NULLIF(cp.driver_license_verified_vehicle_types, ''), vr.requested_vehicle_type, ''), ',')) AS vehicle_type(value)
                WHERE cp.driver_license_verified = TRUE
                    AND cp.driver_license_verification_request_id IS NOT NULL
                    AND trim(vehicle_type.value) IN ('Car', 'Motorbike', 'Motorcycle')
                ON CONFLICT (user_id, vehicle_type) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerDriverLicenses");
        }
    }
}
