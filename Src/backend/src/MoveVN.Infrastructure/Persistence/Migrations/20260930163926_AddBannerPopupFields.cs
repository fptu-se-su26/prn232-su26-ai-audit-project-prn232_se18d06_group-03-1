using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBannerPopupFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "click_action",
                table: "Banners",
                type: "text",
                nullable: false,
                defaultValue: "Link");

            migrationBuilder.AddColumn<string>(
                name: "popup_cta_label",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "popup_cta_url",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "popup_description",
                table: "Banners",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "popup_title",
                table: "Banners",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "click_action",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "popup_cta_label",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "popup_cta_url",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "popup_description",
                table: "Banners");

            migrationBuilder.DropColumn(
                name: "popup_title",
                table: "Banners");
        }
    }
}
