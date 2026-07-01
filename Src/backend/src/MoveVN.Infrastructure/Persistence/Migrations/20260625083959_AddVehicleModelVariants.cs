using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleModelVariants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "model_variant_id",
                table: "MotorbikeDetail",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "model_variant_id",
                table: "CarDetail",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "VehicleModelVariant",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    model_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    vehicle_type = table.Column<string>(type: "text", nullable: false),
                    seat_count = table.Column<byte>(type: "smallint", nullable: true),
                    transmission = table.Column<string>(type: "text", nullable: true),
                    fuel_type = table.Column<string>(type: "text", nullable: true),
                    body_type = table.Column<string>(type: "text", nullable: true),
                    drivetrain = table.Column<string>(type: "text", nullable: true),
                    bike_type = table.Column<string>(type: "text", nullable: true),
                    engine_capacity = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VehicleModelVariant", x => x.id);
                    table.ForeignKey(
                        name: "FK_VehicleModelVariant_VehicleModel_model_id",
                        column: x => x.model_id,
                        principalTable: "VehicleModel",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MotorbikeDetail_model_variant_id",
                table: "MotorbikeDetail",
                column: "model_variant_id");

            migrationBuilder.CreateIndex(
                name: "IX_CarDetail_model_variant_id",
                table: "CarDetail",
                column: "model_variant_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelVariant_model_id_name",
                table: "VehicleModelVariant",
                columns: new[] { "model_id", "name" });

            migrationBuilder.Sql(
                """
                CREATE TEMP TABLE temp_car_variant_map AS
                SELECT
                    cd.vehicle_id,
                    nextval(pg_get_serial_sequence('"VehicleModelVariant"', 'id'))::integer AS variant_id,
                    v.model_id,
                    cd.seat_count,
                    cd.transmission,
                    cd.fuel_type,
                    cd.body_type,
                    cd.drivetrain
                FROM "CarDetail" cd
                INNER JOIN "Vehicles" v ON v.id = cd.vehicle_id;

                INSERT INTO "VehicleModelVariant" (
                    id,
                    model_id,
                    name,
                    vehicle_type,
                    seat_count,
                    transmission,
                    fuel_type,
                    body_type,
                    drivetrain,
                    is_active,
                    created_at,
                    updated_at
                )
                SELECT
                    variant_id,
                    model_id,
                    'Migrated car variant ' || vehicle_id,
                    'Car',
                    seat_count,
                    transmission,
                    fuel_type,
                    body_type,
                    drivetrain,
                    TRUE,
                    NOW(),
                    NOW()
                FROM temp_car_variant_map;

                UPDATE "CarDetail" cd
                SET model_variant_id = map.variant_id
                FROM temp_car_variant_map map
                WHERE cd.vehicle_id = map.vehicle_id;

                DROP TABLE temp_car_variant_map;
                """);

            migrationBuilder.Sql(
                """
                CREATE TEMP TABLE temp_motorbike_variant_map AS
                SELECT
                    md.vehicle_id,
                    nextval(pg_get_serial_sequence('"VehicleModelVariant"', 'id'))::integer AS variant_id,
                    v.model_id,
                    md.bike_type,
                    md.engine_capacity
                FROM "MotorbikeDetail" md
                INNER JOIN "Vehicles" v ON v.id = md.vehicle_id;

                INSERT INTO "VehicleModelVariant" (
                    id,
                    model_id,
                    name,
                    vehicle_type,
                    bike_type,
                    engine_capacity,
                    is_active,
                    created_at,
                    updated_at
                )
                SELECT
                    variant_id,
                    model_id,
                    'Migrated motorbike variant ' || vehicle_id,
                    'Motorbike',
                    bike_type,
                    engine_capacity,
                    TRUE,
                    NOW(),
                    NOW()
                FROM temp_motorbike_variant_map;

                UPDATE "MotorbikeDetail" md
                SET model_variant_id = map.variant_id
                FROM temp_motorbike_variant_map map
                WHERE md.vehicle_id = map.vehicle_id;

                DROP TABLE temp_motorbike_variant_map;
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_CarDetail_VehicleModelVariant_model_variant_id",
                table: "CarDetail",
                column: "model_variant_id",
                principalTable: "VehicleModelVariant",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MotorbikeDetail_VehicleModelVariant_model_variant_id",
                table: "MotorbikeDetail",
                column: "model_variant_id",
                principalTable: "VehicleModelVariant",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropColumn(
                name: "bike_type",
                table: "MotorbikeDetail");

            migrationBuilder.DropColumn(
                name: "engine_capacity",
                table: "MotorbikeDetail");

            migrationBuilder.DropColumn(
                name: "body_type",
                table: "CarDetail");

            migrationBuilder.DropColumn(
                name: "drivetrain",
                table: "CarDetail");

            migrationBuilder.DropColumn(
                name: "fuel_type",
                table: "CarDetail");

            migrationBuilder.DropColumn(
                name: "seat_count",
                table: "CarDetail");

            migrationBuilder.DropColumn(
                name: "transmission",
                table: "CarDetail");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CarDetail_VehicleModelVariant_model_variant_id",
                table: "CarDetail");

            migrationBuilder.DropForeignKey(
                name: "FK_MotorbikeDetail_VehicleModelVariant_model_variant_id",
                table: "MotorbikeDetail");

            migrationBuilder.AddColumn<string>(
                name: "bike_type",
                table: "MotorbikeDetail",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "engine_capacity",
                table: "MotorbikeDetail",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "body_type",
                table: "CarDetail",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "drivetrain",
                table: "CarDetail",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "fuel_type",
                table: "CarDetail",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<byte>(
                name: "seat_count",
                table: "CarDetail",
                type: "smallint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "transmission",
                table: "CarDetail",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql(
                """
                UPDATE "CarDetail" cd
                SET
                    seat_count = COALESCE(vmv.seat_count, 0),
                    transmission = COALESCE(vmv.transmission, ''),
                    fuel_type = COALESCE(vmv.fuel_type, ''),
                    body_type = COALESCE(vmv.body_type, ''),
                    drivetrain = vmv.drivetrain
                FROM "VehicleModelVariant" vmv
                WHERE cd.model_variant_id = vmv.id;

                UPDATE "MotorbikeDetail" md
                SET
                    bike_type = COALESCE(vmv.bike_type, ''),
                    engine_capacity = vmv.engine_capacity
                FROM "VehicleModelVariant" vmv
                WHERE md.model_variant_id = vmv.id;
                """);

            migrationBuilder.DropTable(
                name: "VehicleModelVariant");

            migrationBuilder.DropIndex(
                name: "IX_MotorbikeDetail_model_variant_id",
                table: "MotorbikeDetail");

            migrationBuilder.DropIndex(
                name: "IX_CarDetail_model_variant_id",
                table: "CarDetail");

            migrationBuilder.DropColumn(
                name: "model_variant_id",
                table: "MotorbikeDetail");

            migrationBuilder.DropColumn(
                name: "model_variant_id",
                table: "CarDetail");
        }
    }
}
