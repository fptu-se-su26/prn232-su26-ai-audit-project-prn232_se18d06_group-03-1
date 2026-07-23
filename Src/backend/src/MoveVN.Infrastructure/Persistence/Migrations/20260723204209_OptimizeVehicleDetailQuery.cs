using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeVehicleDetailQuery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_Vehicles_brand_id\" ON \"Vehicles\" (\"brand_id\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_Vehicles_model_id\" ON \"Vehicles\" (\"model_id\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_Vehicles_owner_id\" ON \"Vehicles\" (\"owner_id\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_VehiclePricing_vehicle_id\" ON \"VehiclePricing\" (\"vehicle_id\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_VehicleImages_vehicle_id\" ON \"VehicleImages\" (\"vehicle_id\");");

            migrationBuilder.Sql(@"
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Vehicles_VehicleBrand_brand_id') THEN
        ALTER TABLE ""Vehicles"" ADD CONSTRAINT ""FK_Vehicles_VehicleBrand_brand_id""
            FOREIGN KEY (""brand_id"") REFERENCES ""VehicleBrand"" (""id"") ON DELETE RESTRICT;
    END IF;
END $$;");

            migrationBuilder.Sql(@"
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_Vehicles_VehicleModel_model_id') THEN
        ALTER TABLE ""Vehicles"" ADD CONSTRAINT ""FK_Vehicles_VehicleModel_model_id""
            FOREIGN KEY (""model_id"") REFERENCES ""VehicleModel"" (""id"") ON DELETE RESTRICT;
    END IF;
END $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Vehicles_brand_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Vehicles_model_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_Vehicles_owner_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_VehiclePricing_vehicle_id\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_VehicleImages_vehicle_id\";");

            migrationBuilder.Sql("ALTER TABLE \"Vehicles\" DROP CONSTRAINT IF EXISTS \"FK_Vehicles_VehicleBrand_brand_id\";");
            migrationBuilder.Sql("ALTER TABLE \"Vehicles\" DROP CONSTRAINT IF EXISTS \"FK_Vehicles_VehicleModel_model_id\";");
        }
    }
}
