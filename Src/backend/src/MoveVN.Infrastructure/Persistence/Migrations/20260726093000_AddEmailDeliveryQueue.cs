using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260726093000_AddEmailDeliveryQueue")]
public partial class AddEmailDeliveryQueue : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "EmailLogs",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                email_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                recipient_email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                recipient_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                subject = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                payload_json = table.Column<string>(type: "text", nullable: true),
                status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                attempt_count = table.Column<int>(type: "integer", nullable: false),
                max_attempts = table.Column<int>(type: "integer", nullable: false),
                next_attempt_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                processing_started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                last_error = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_EmailLogs", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_EmailLogs_status_next_attempt_at",
            table: "EmailLogs",
            columns: new[] { "status", "next_attempt_at" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "EmailLogs");
    }
}
