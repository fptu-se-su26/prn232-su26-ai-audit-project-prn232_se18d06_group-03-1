using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations;

public partial class AddFavoriteVehicles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "FavoriteVehicles",
            columns: table => new
            {
                id = table.Column<long>(type: "bigint", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                customer_id = table.Column<long>(type: "bigint", nullable: false),
                vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_FavoriteVehicles", x => x.id);
                table.ForeignKey(
                    name: "FK_FavoriteVehicles_Users_customer_id",
                    column: x => x.customer_id,
                    principalTable: "Users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_FavoriteVehicles_Vehicles_vehicle_id",
                    column: x => x.vehicle_id,
                    principalTable: "Vehicles",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_FavoriteVehicles_customer_id_vehicle_id",
            table: "FavoriteVehicles",
            columns: new[] { "customer_id", "vehicle_id" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_FavoriteVehicles_vehicle_id",
            table: "FavoriteVehicles",
            column: "vehicle_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "FavoriteVehicles");
    }
}
