using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260618090500_AddOwnerApplicationAndVerificationFields")]
public partial class AddOwnerApplicationAndVerificationFields : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(
            name: "front_image_url",
            table: "VerificationRequests",
            type: "text",
            nullable: true,
            oldClrType: typeof(string),
            oldType: "text");

        migrationBuilder.AddColumn<string>(
            name: "front_image_public_id",
            table: "VerificationRequests",
            type: "text",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "back_image_public_id",
            table: "VerificationRequests",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "external_provider",
            table: "VerificationRequests",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "external_result_json",
            table: "VerificationRequests",
            type: "jsonb",
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "confidence",
            table: "VerificationRequests",
            type: "numeric(15,2)",
            precision: 15,
            scale: 2,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "decision_reason",
            table: "VerificationRequests",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "processed_at",
            table: "VerificationRequests",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "expires_at",
            table: "VerificationRequests",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "deleted_at",
            table: "VerificationRequests",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "bank_account_holder_name",
            table: "OwnerProfiles",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<DateTime>(
            name: "verified_at",
            table: "OwnerProfiles",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "national_id_hash",
            table: "CustomerProfiles",
            type: "text",
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "national_id_masked",
            table: "CustomerProfiles",
            type: "text",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "OwnerApplications",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                user_id = table.Column<long>(type: "bigint", nullable: false),
                status = table.Column<string>(type: "text", nullable: false),
                national_id_verification_request_id = table.Column<long>(type: "bigint", nullable: true),
                bank_name = table.Column<string>(type: "text", nullable: true),
                bank_account_number = table.Column<string>(type: "text", nullable: true),
                bank_account_holder_name = table.Column<string>(type: "text", nullable: true),
                submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                approved_by = table.Column<long>(type: "bigint", nullable: true),
                rejected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                rejected_by = table.Column<long>(type: "bigint", nullable: true),
                rejection_reason = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OwnerApplications", x => x.id);
                table.ForeignKey(
                    name: "FK_OwnerApplications_Users_user_id",
                    column: x => x.user_id,
                    principalTable: "Users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_OwnerApplications_VerificationRequests_national_id_verification_request_id",
                    column: x => x.national_id_verification_request_id,
                    principalTable: "VerificationRequests",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CustomerProfiles_national_id_hash",
            table: "CustomerProfiles",
            column: "national_id_hash");

        migrationBuilder.CreateIndex(
            name: "IX_OwnerApplications_national_id_verification_request_id",
            table: "OwnerApplications",
            column: "national_id_verification_request_id");

        migrationBuilder.CreateIndex(
            name: "IX_OwnerApplications_user_id_status",
            table: "OwnerApplications",
            columns: new[] { "user_id", "status" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "OwnerApplications");

        migrationBuilder.DropIndex(
            name: "IX_CustomerProfiles_national_id_hash",
            table: "CustomerProfiles");

        migrationBuilder.DropColumn(
            name: "front_image_public_id",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "back_image_public_id",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "external_provider",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "external_result_json",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "confidence",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "decision_reason",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "processed_at",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "expires_at",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "deleted_at",
            table: "VerificationRequests");

        migrationBuilder.DropColumn(
            name: "bank_account_holder_name",
            table: "OwnerProfiles");

        migrationBuilder.DropColumn(
            name: "verified_at",
            table: "OwnerProfiles");

        migrationBuilder.DropColumn(
            name: "national_id_hash",
            table: "CustomerProfiles");

        migrationBuilder.DropColumn(
            name: "national_id_masked",
            table: "CustomerProfiles");

        migrationBuilder.AlterColumn<string>(
            name: "front_image_url",
            table: "VerificationRequests",
            type: "text",
            nullable: false,
            defaultValue: "",
            oldClrType: typeof(string),
            oldType: "text",
            oldNullable: true);
    }
}
