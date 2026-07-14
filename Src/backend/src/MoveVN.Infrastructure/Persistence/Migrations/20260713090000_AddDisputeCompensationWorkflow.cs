using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using MoveVN.Infrastructure.Persistence;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260713090000_AddDisputeCompensationWorkflow")]
    public partial class AddDisputeCompensationWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "compensation_direction",
                table: "Disputes",
                type: "text",
                nullable: false,
                defaultValue: "NoCompensation");

            migrationBuilder.AddColumn<decimal>(
                name: "admin_approved_amount",
                table: "Disputes",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "escalated_by",
                table: "Disputes",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "escalated_at",
                table: "Disputes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "evidence_requested_from",
                table: "Disputes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "evidence_request_message",
                table: "Disputes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "evidence_requested_at",
                table: "Disputes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "evidence_responded_at",
                table: "Disputes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "Disputes",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "updated_at", table: "Disputes");
            migrationBuilder.DropColumn(name: "evidence_responded_at", table: "Disputes");
            migrationBuilder.DropColumn(name: "evidence_requested_at", table: "Disputes");
            migrationBuilder.DropColumn(name: "evidence_request_message", table: "Disputes");
            migrationBuilder.DropColumn(name: "evidence_requested_from", table: "Disputes");
            migrationBuilder.DropColumn(name: "escalated_at", table: "Disputes");
            migrationBuilder.DropColumn(name: "escalated_by", table: "Disputes");
            migrationBuilder.DropColumn(name: "admin_approved_amount", table: "Disputes");
            migrationBuilder.DropColumn(name: "compensation_direction", table: "Disputes");
        }
    }
}
