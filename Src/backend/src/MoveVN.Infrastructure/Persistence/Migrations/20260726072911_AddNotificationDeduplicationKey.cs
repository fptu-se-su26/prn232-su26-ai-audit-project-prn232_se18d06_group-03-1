using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MoveVN.Infrastructure.Persistence;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260726072911_AddNotificationDeduplicationKey")]
public partial class AddNotificationDeduplicationKey : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "deduplication_key",
            table: "Notifications",
            type: "text",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Notifications_user_id_deduplication_key",
            table: "Notifications",
            columns: new[] { "user_id", "deduplication_key" },
            unique: true,
            filter: "deduplication_key IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Notifications_user_id_deduplication_key",
            table: "Notifications");

        migrationBuilder.DropColumn(
            name: "deduplication_key",
            table: "Notifications");
    }
}
