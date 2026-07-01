using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVehicleBrandUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_VehicleBrand_name";""");
            migrationBuilder.Sql("""CREATE UNIQUE INDEX IF NOT EXISTS "IX_VehicleBrand_name_vehicle_type" ON "VehicleBrand" ("name", "vehicle_type");""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_VehicleBrand_name_vehicle_type";""");
            migrationBuilder.Sql("""CREATE UNIQUE INDEX IF NOT EXISTS "IX_VehicleBrand_name" ON "VehicleBrand" ("name");""");
        }
    }
}
