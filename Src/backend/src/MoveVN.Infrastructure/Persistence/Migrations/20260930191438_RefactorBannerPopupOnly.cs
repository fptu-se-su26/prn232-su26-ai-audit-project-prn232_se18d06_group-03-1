using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RefactorBannerPopupOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Backfill existing rows from real data before enforcing NOT NULL.
            // PopupTitle falls back to the banner's own Title.
            migrationBuilder.Sql(
                @"UPDATE ""Banners"" SET popup_title = title
                  WHERE popup_title IS NULL OR btrim(popup_title) = '';");

            // PopupDescription falls back to the linked Promotion description (real data only).
            migrationBuilder.Sql(
                @"UPDATE ""Banners"" b SET popup_description = p.description
                  FROM ""Promotions"" p
                  WHERE b.promotion_id = p.id
                    AND (b.popup_description IS NULL OR btrim(b.popup_description) = '')
                    AND p.description IS NOT NULL
                    AND btrim(p.description) <> '';");

            // PopupCtaLabel falls back to the business default (same default as the API).
            migrationBuilder.Sql(
                @"UPDATE ""Banners"" SET popup_cta_label = 'Nhận voucher'
                  WHERE popup_cta_label IS NULL OR btrim(popup_cta_label) = '';");

            // Defensive deactivation: never delete records; hide incomplete ones for Admin review.
            migrationBuilder.Sql(
                @"UPDATE ""Banners"" SET is_active = false
                  WHERE popup_title IS NULL OR btrim(popup_title) = ''
                     OR popup_description IS NULL OR btrim(popup_description) = ''
                     OR popup_cta_label IS NULL OR btrim(popup_cta_label) = '';");

            migrationBuilder.AlterColumn<string>(
                name: "popup_title",
                table: "Banners",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "popup_description",
                table: "Banners",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "popup_cta_label",
                table: "Banners",
                type: "text",
                nullable: false,
                defaultValue: "Nhận voucher",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "popup_title",
                table: "Banners",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "popup_description",
                table: "Banners",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "popup_cta_label",
                table: "Banners",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
