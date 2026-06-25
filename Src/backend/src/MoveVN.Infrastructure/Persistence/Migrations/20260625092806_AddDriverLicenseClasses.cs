using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverLicenseClasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "required_license_class_id",
                table: "VehicleModelVariant",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DriverLicenseClasses",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "text", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    system_version = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DriverLicenseClasses", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "DriverLicenseClassCompatibility",
                columns: table => new
                {
                    license_class_id = table.Column<int>(type: "integer", nullable: false),
                    allowed_required_license_class_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DriverLicenseClassCompatibility", x => new { x.license_class_id, x.allowed_required_license_class_id });
                    table.ForeignKey(
                        name: "FK_DriverLicenseClassCompatibility_DriverLicenseClasses_allowe~",
                        column: x => x.allowed_required_license_class_id,
                        principalTable: "DriverLicenseClasses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DriverLicenseClassCompatibility_DriverLicenseClasses_licens~",
                        column: x => x.license_class_id,
                        principalTable: "DriverLicenseClasses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelVariant_required_license_class_id",
                table: "VehicleModelVariant",
                column: "required_license_class_id");

            migrationBuilder.CreateIndex(
                name: "IX_DriverLicenseClassCompatibility_allowed_required_license_cl~",
                table: "DriverLicenseClassCompatibility",
                column: "allowed_required_license_class_id");

            migrationBuilder.CreateIndex(
                name: "IX_DriverLicenseClasses_code",
                table: "DriverLicenseClasses",
                column: "code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleModelVariant_DriverLicenseClasses_required_license_c~",
                table: "VehicleModelVariant",
                column: "required_license_class_id",
                principalTable: "DriverLicenseClasses",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VehicleModelVariant_DriverLicenseClasses_required_license_c~",
                table: "VehicleModelVariant");

            migrationBuilder.DropTable(
                name: "DriverLicenseClassCompatibility");

            migrationBuilder.DropTable(
                name: "DriverLicenseClasses");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelVariant_required_license_class_id",
                table: "VehicleModelVariant");

            migrationBuilder.DropColumn(
                name: "required_license_class_id",
                table: "VehicleModelVariant");
        }
    }
}
