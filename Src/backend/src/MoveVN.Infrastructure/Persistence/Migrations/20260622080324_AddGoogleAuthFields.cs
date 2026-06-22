using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Area_PricingRegion_pricing_region_id",
                table: "Area");

            migrationBuilder.DropForeignKey(
                name: "FK_BlockedDates_Vehicles_vehicle_id",
                table: "BlockedDates");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_PlatformFeeRules_platform_fee_rule_id",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Users_customer_id",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Vehicles_vehicle_id",
                table: "Bookings");

            migrationBuilder.DropForeignKey(
                name: "FK_BookingStatusHistory_Bookings_booking_id",
                table: "BookingStatusHistory");

            migrationBuilder.DropForeignKey(
                name: "FK_CarDetail_Vehicles_vehicle_id",
                table: "CarDetail");

            migrationBuilder.DropForeignKey(
                name: "FK_CheckInOutImages_Bookings_booking_id",
                table: "CheckInOutImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Bookings_booking_id",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_CustomerProfiles_Users_user_id",
                table: "CustomerProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_Disputes_Bookings_booking_id",
                table: "Disputes");

            migrationBuilder.DropForeignKey(
                name: "FK_InspectionReports_Bookings_booking_id",
                table: "InspectionReports");

            migrationBuilder.DropForeignKey(
                name: "FK_MotorbikeDetail_Vehicles_vehicle_id",
                table: "MotorbikeDetail");

            migrationBuilder.DropForeignKey(
                name: "FK_NotificationPreferences_Users_user_id",
                table: "NotificationPreferences");

            migrationBuilder.DropForeignKey(
                name: "FK_Notifications_Users_user_id",
                table: "Notifications");

            migrationBuilder.DropForeignKey(
                name: "FK_OtpCodes_Users_user_id",
                table: "OtpCodes");

            migrationBuilder.DropForeignKey(
                name: "FK_OwnerProfiles_Users_user_id",
                table: "OwnerProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Bookings_booking_id",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_PricingRules_Vehicles_vehicle_id",
                table: "PricingRules");

            migrationBuilder.DropForeignKey(
                name: "FK_RefreshTokens_Users_user_id",
                table: "RefreshTokens");

            migrationBuilder.DropForeignKey(
                name: "FK_Reports_Bookings_booking_id",
                table: "Reports");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Bookings_booking_id",
                table: "Reviews");

            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_Permissions_permission_id",
                table: "RolePermissions");

            migrationBuilder.DropForeignKey(
                name: "FK_RolePermissions_Roles_role_id",
                table: "RolePermissions");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffProfiles_Users_user_id",
                table: "StaffProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_SupportTickets_Users_user_id",
                table: "SupportTickets");

            migrationBuilder.DropForeignKey(
                name: "FK_TicketMessages_SupportTickets_ticket_id",
                table: "TicketMessages");

            migrationBuilder.DropForeignKey(
                name: "FK_TrustScores_Users_user_id",
                table: "TrustScores");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Roles_role_id",
                table: "UserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRoles_Users_user_id",
                table: "UserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_UserSessions_Users_user_id",
                table: "UserSessions");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleDocuments_Vehicles_vehicle_id",
                table: "VehicleDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleFeatureMapping_VehicleFeature_feature_id",
                table: "VehicleFeatureMapping");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleFeatureMapping_Vehicles_vehicle_id",
                table: "VehicleFeatureMapping");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleImages_Vehicles_vehicle_id",
                table: "VehicleImages");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleModel_VehicleBrand_brand_id",
                table: "VehicleModel");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleModelPricing_PricingRegion_pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropForeignKey(
                name: "FK_VehicleModelPricing_VehicleModel_model_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropForeignKey(
                name: "FK_VehiclePricing_Vehicles_vehicle_id",
                table: "VehiclePricing");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_Users_owner_id",
                table: "Vehicles");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_VehicleBrand_brand_id",
                table: "Vehicles");

            migrationBuilder.DropForeignKey(
                name: "FK_Vehicles_VehicleModel_model_id",
                table: "Vehicles");

            migrationBuilder.DropForeignKey(
                name: "FK_VerificationRequests_Users_user_id",
                table: "VerificationRequests");

            migrationBuilder.DropForeignKey(
                name: "FK_Wallets_Users_user_id",
                table: "Wallets");

            migrationBuilder.DropForeignKey(
                name: "FK_WalletTransactions_Wallets_wallet_id",
                table: "WalletTransactions");

            migrationBuilder.DropIndex(
                name: "IX_WalletTransactions_idempotency_key",
                table: "WalletTransactions");

            migrationBuilder.DropIndex(
                name: "IX_WalletTransactions_wallet_id",
                table: "WalletTransactions");

            migrationBuilder.DropIndex(
                name: "IX_Wallets_user_id",
                table: "Wallets");

            migrationBuilder.DropIndex(
                name: "IX_VerificationRequests_user_id_status",
                table: "VerificationRequests");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_brand_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_license_plate",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_model_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_owner_id",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_Vehicles_status",
                table: "Vehicles");

            migrationBuilder.DropIndex(
                name: "IX_VehiclePricing_vehicle_id",
                table: "VehiclePricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id_year_from_ye~",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModel_brand_id_name",
                table: "VehicleModel");

            migrationBuilder.DropIndex(
                name: "IX_VehicleImages_vehicle_id",
                table: "VehicleImages");

            migrationBuilder.DropIndex(
                name: "IX_VehicleFeatureMapping_feature_id",
                table: "VehicleFeatureMapping");

            migrationBuilder.DropIndex(
                name: "IX_VehicleFeature_name_vehicle_type",
                table: "VehicleFeature");

            migrationBuilder.DropIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments");

            migrationBuilder.DropIndex(
                name: "IX_VehicleBrand_name",
                table: "VehicleBrand");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_connection_id",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_UserSessions_user_id_last_heartbeat_at",
                table: "UserSessions");

            migrationBuilder.DropIndex(
                name: "IX_Users_email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_last_seen_at",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_phone",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_status",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_role_id",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_UserRoles_user_id_role_id",
                table: "UserRoles");

            migrationBuilder.DropIndex(
                name: "IX_TrustScores_user_id",
                table: "TrustScores");

            migrationBuilder.DropIndex(
                name: "IX_TicketMessages_ticket_id",
                table: "TicketMessages");

            migrationBuilder.DropIndex(
                name: "IX_SystemConfig_config_key",
                table: "SystemConfig");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_status",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_ticket_number",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_SupportTickets_user_id",
                table: "SupportTickets");

            migrationBuilder.DropIndex(
                name: "IX_StaffProfiles_employee_code",
                table: "StaffProfiles");

            migrationBuilder.DropIndex(
                name: "IX_StaffProfiles_user_id",
                table: "StaffProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Roles_name",
                table: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_RolePermissions_permission_id",
                table: "RolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_booking_id_reviewer_id",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reports_booking_id_status",
                table: "Reports");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_token_hash",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_RefreshTokens_user_id_expires_at",
                table: "RefreshTokens");

            migrationBuilder.DropIndex(
                name: "IX_PricingRules_vehicle_id_is_active",
                table: "PricingRules");

            migrationBuilder.DropIndex(
                name: "IX_PricingRegion_code",
                table: "PricingRegion");

            migrationBuilder.DropIndex(
                name: "IX_PlatformFeeRules_target_type_target_id_priority_is_active",
                table: "PlatformFeeRules");

            migrationBuilder.DropIndex(
                name: "IX_Permissions_code",
                table: "Permissions");

            migrationBuilder.DropIndex(
                name: "IX_Payments_booking_id",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_gateway_transaction_id",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_Payments_idempotency_key",
                table: "Payments");

            migrationBuilder.DropIndex(
                name: "IX_OwnerProfiles_user_id",
                table: "OwnerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_OtpCodes_email_purpose_expires_at",
                table: "OtpCodes");

            migrationBuilder.DropIndex(
                name: "IX_OtpCodes_user_id",
                table: "OtpCodes");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_type",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications");

            migrationBuilder.DropIndex(
                name: "IX_NotificationPreferences_user_id",
                table: "NotificationPreferences");

            migrationBuilder.DropIndex(
                name: "IX_MLPredictionLogs_booking_id",
                table: "MLPredictionLogs");

            migrationBuilder.DropIndex(
                name: "IX_InspectionReports_booking_id_type",
                table: "InspectionReports");

            migrationBuilder.DropIndex(
                name: "IX_FeatureFlags_flag_key",
                table: "FeatureFlags");

            migrationBuilder.DropIndex(
                name: "IX_Disputes_booking_id_status",
                table: "Disputes");

            migrationBuilder.DropIndex(
                name: "IX_DemandForecasts_district_vehicle_type_forecast_date",
                table: "DemandForecasts");

            migrationBuilder.DropIndex(
                name: "IX_CustomerProfiles_user_id",
                table: "CustomerProfiles");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_booking_id",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_contract_number",
                table: "Contracts");

            migrationBuilder.DropIndex(
                name: "IX_CheckInOutImages_booking_id",
                table: "CheckInOutImages");

            migrationBuilder.DropIndex(
                name: "IX_CashbackRules_trust_tier",
                table: "CashbackRules");

            migrationBuilder.DropIndex(
                name: "IX_BookingStatusHistory_booking_id",
                table: "BookingStatusHistory");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_booking_code",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_customer_id_vehicle_id_start_date_end_date",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_platform_fee_rule_id",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_vehicle_id",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_BlockedDates_vehicle_id_start_date_end_date",
                table: "BlockedDates");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_created_at",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_entity_type_entity_id",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_Area_pricing_region_id",
                table: "Area");

            migrationBuilder.DropIndex(
                name: "IX_Area_province_district",
                table: "Area");

            migrationBuilder.AlterColumn<decimal>(
                name: "balance_after",
                table: "WalletTransactions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "amount",
                table: "WalletTransactions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_spent",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_earned",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "balance",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "price_per_day",
                table: "Vehicles",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "longitude",
                table: "Vehicles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "latitude",
                table: "Vehicles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fixed_price_per_day",
                table: "VehiclePricing",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "current_price_per_day",
                table: "VehiclePricing",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "auto_min_price",
                table: "VehiclePricing",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "auto_max_price",
                table: "VehiclePricing",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "suggested_min_price",
                table: "VehicleModelPricing",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "suggested_max_price",
                table: "VehicleModelPricing",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "base_price",
                table: "VehicleModelPricing",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "password_hash",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "auth_provider",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "external_id",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "score",
                table: "TrustScores",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "average_rating",
                table: "TrustScores",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "attachment_urls",
                table: "TicketMessages",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "evidence_urls",
                table: "Reports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "multiplier",
                table: "PricingRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fixed_price",
                table: "PricingRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_fee",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "max_fee",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fee_value",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "amount",
                table: "Payments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "commission_rate",
                table: "OwnerProfiles",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "average_rating",
                table: "OwnerProfiles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "data_json",
                table: "Notifications",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "MotorbikeDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<string>(
                name: "top_risk_factors",
                table: "MLPredictionLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "risk_score",
                table: "MLPredictionLogs",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "feature_snapshot",
                table: "MLPredictionLogs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "allowed_roles",
                table: "FeatureFlags",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "compensation_amount",
                table: "Disputes",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_deposit_reduction",
                table: "CashbackRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "cashback_percent",
                table: "CashbackRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "CarDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_amount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "risk_score",
                table: "Bookings",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "platform_fee_value",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "platform_fee",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "deposit_amount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "base_price",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "old_value",
                table: "AuditLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "new_value",
                table: "AuditLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "auth_provider",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "external_id",
                table: "Users");

            migrationBuilder.AlterColumn<decimal>(
                name: "balance_after",
                table: "WalletTransactions",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "amount",
                table: "WalletTransactions",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_spent",
                table: "Wallets",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_earned",
                table: "Wallets",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "balance",
                table: "Wallets",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "price_per_day",
                table: "Vehicles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "longitude",
                table: "Vehicles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "latitude",
                table: "Vehicles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fixed_price_per_day",
                table: "VehiclePricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "current_price_per_day",
                table: "VehiclePricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "auto_min_price",
                table: "VehiclePricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "auto_max_price",
                table: "VehiclePricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "suggested_min_price",
                table: "VehicleModelPricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "suggested_max_price",
                table: "VehicleModelPricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "base_price",
                table: "VehicleModelPricing",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "password_hash",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "score",
                table: "TrustScores",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "average_rating",
                table: "TrustScores",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "attachment_urls",
                table: "TicketMessages",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "evidence_urls",
                table: "Reports",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "multiplier",
                table: "PricingRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fixed_price",
                table: "PricingRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_fee",
                table: "PlatformFeeRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "max_fee",
                table: "PlatformFeeRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "fee_value",
                table: "PlatformFeeRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "amount",
                table: "Payments",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "commission_rate",
                table: "OwnerProfiles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "average_rating",
                table: "OwnerProfiles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "data_json",
                table: "Notifications",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "MotorbikeDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<string>(
                name: "top_risk_factors",
                table: "MLPredictionLogs",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "risk_score",
                table: "MLPredictionLogs",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "feature_snapshot",
                table: "MLPredictionLogs",
                type: "jsonb",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "allowed_roles",
                table: "FeatureFlags",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "compensation_amount",
                table: "Disputes",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "min_deposit_reduction",
                table: "CashbackRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "cashback_percent",
                table: "CashbackRules",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "CarDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_amount",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "risk_score",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "platform_fee_value",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "platform_fee",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "deposit_amount",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<decimal>(
                name: "base_price",
                table: "Bookings",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "old_value",
                table: "AuditLogs",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "new_value",
                table: "AuditLogs",
                type: "jsonb",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_idempotency_key",
                table: "WalletTransactions",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_wallet_id",
                table: "WalletTransactions",
                column: "wallet_id");

            migrationBuilder.CreateIndex(
                name: "IX_Wallets_user_id",
                table: "Wallets",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_user_id_status",
                table: "VerificationRequests",
                columns: new[] { "user_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_brand_id",
                table: "Vehicles",
                column: "brand_id");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_license_plate",
                table: "Vehicles",
                column: "license_plate",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_model_id",
                table: "Vehicles",
                column: "model_id");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_owner_id",
                table: "Vehicles",
                column: "owner_id");

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_status",
                table: "Vehicles",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_VehiclePricing_vehicle_id",
                table: "VehiclePricing",
                column: "vehicle_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id_year_from_ye~",
                table: "VehicleModelPricing",
                columns: new[] { "model_id", "pricing_region_id", "year_from", "year_to" });

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModelPricing_pricing_region_id",
                table: "VehicleModelPricing",
                column: "pricing_region_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModel_brand_id_name",
                table: "VehicleModel",
                columns: new[] { "brand_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleImages_vehicle_id",
                table: "VehicleImages",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleFeatureMapping_feature_id",
                table: "VehicleFeatureMapping",
                column: "feature_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleFeature_name_vehicle_type",
                table: "VehicleFeature",
                columns: new[] { "name", "vehicle_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBrand_name",
                table: "VehicleBrand",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_connection_id",
                table: "UserSessions",
                column: "connection_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserSessions_user_id_last_heartbeat_at",
                table: "UserSessions",
                columns: new[] { "user_id", "last_heartbeat_at" });

            migrationBuilder.CreateIndex(
                name: "IX_Users_email",
                table: "Users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_last_seen_at",
                table: "Users",
                column: "last_seen_at");

            migrationBuilder.CreateIndex(
                name: "IX_Users_phone",
                table: "Users",
                column: "phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_status",
                table: "Users",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_role_id",
                table: "UserRoles",
                column: "role_id");

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_user_id_role_id",
                table: "UserRoles",
                columns: new[] { "user_id", "role_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrustScores_user_id",
                table: "TrustScores",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_ticket_id",
                table: "TicketMessages",
                column: "ticket_id");

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfig_config_key",
                table: "SystemConfig",
                column: "config_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_status",
                table: "SupportTickets",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_ticket_number",
                table: "SupportTickets",
                column: "ticket_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_user_id",
                table: "SupportTickets",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_StaffProfiles_employee_code",
                table: "StaffProfiles",
                column: "employee_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StaffProfiles_user_id",
                table: "StaffProfiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Roles_name",
                table: "Roles",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RolePermissions_permission_id",
                table: "RolePermissions",
                column: "permission_id");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_booking_id_reviewer_id",
                table: "Reviews",
                columns: new[] { "booking_id", "reviewer_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reports_booking_id_status",
                table: "Reports",
                columns: new[] { "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_token_hash",
                table: "RefreshTokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshTokens_user_id_expires_at",
                table: "RefreshTokens",
                columns: new[] { "user_id", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "IX_PricingRules_vehicle_id_is_active",
                table: "PricingRules",
                columns: new[] { "vehicle_id", "is_active" });

            migrationBuilder.CreateIndex(
                name: "IX_PricingRegion_code",
                table: "PricingRegion",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlatformFeeRules_target_type_target_id_priority_is_active",
                table: "PlatformFeeRules",
                columns: new[] { "target_type", "target_id", "priority", "is_active" });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_code",
                table: "Permissions",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_booking_id",
                table: "Payments",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_gateway_transaction_id",
                table: "Payments",
                column: "gateway_transaction_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Payments_idempotency_key",
                table: "Payments",
                column: "idempotency_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OwnerProfiles_user_id",
                table: "OwnerProfiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_email_purpose_expires_at",
                table: "OtpCodes",
                columns: new[] { "email", "purpose", "expires_at" });

            migrationBuilder.CreateIndex(
                name: "IX_OtpCodes_user_id",
                table: "OtpCodes",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_type",
                table: "Notifications",
                column: "type");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_user_id",
                table: "Notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_NotificationPreferences_user_id",
                table: "NotificationPreferences",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MLPredictionLogs_booking_id",
                table: "MLPredictionLogs",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_InspectionReports_booking_id_type",
                table: "InspectionReports",
                columns: new[] { "booking_id", "type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FeatureFlags_flag_key",
                table: "FeatureFlags",
                column: "flag_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Disputes_booking_id_status",
                table: "Disputes",
                columns: new[] { "booking_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_DemandForecasts_district_vehicle_type_forecast_date",
                table: "DemandForecasts",
                columns: new[] { "district", "vehicle_type", "forecast_date" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerProfiles_user_id",
                table: "CustomerProfiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_booking_id",
                table: "Contracts",
                column: "booking_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_contract_number",
                table: "Contracts",
                column: "contract_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CheckInOutImages_booking_id",
                table: "CheckInOutImages",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_CashbackRules_trust_tier",
                table: "CashbackRules",
                column: "trust_tier",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingStatusHistory_booking_id",
                table: "BookingStatusHistory",
                column: "booking_id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_booking_code",
                table: "Bookings",
                column: "booking_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_customer_id_vehicle_id_start_date_end_date",
                table: "Bookings",
                columns: new[] { "customer_id", "vehicle_id", "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_platform_fee_rule_id",
                table: "Bookings",
                column: "platform_fee_rule_id");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_vehicle_id",
                table: "Bookings",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_BlockedDates_vehicle_id_start_date_end_date",
                table: "BlockedDates",
                columns: new[] { "vehicle_id", "start_date", "end_date" });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_created_at",
                table: "AuditLogs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_entity_type_entity_id",
                table: "AuditLogs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "IX_Area_pricing_region_id",
                table: "Area",
                column: "pricing_region_id");

            migrationBuilder.CreateIndex(
                name: "IX_Area_province_district",
                table: "Area",
                columns: new[] { "province", "district" });

            migrationBuilder.AddForeignKey(
                name: "FK_Area_PricingRegion_pricing_region_id",
                table: "Area",
                column: "pricing_region_id",
                principalTable: "PricingRegion",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BlockedDates_Vehicles_vehicle_id",
                table: "BlockedDates",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_PlatformFeeRules_platform_fee_rule_id",
                table: "Bookings",
                column: "platform_fee_rule_id",
                principalTable: "PlatformFeeRules",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Users_customer_id",
                table: "Bookings",
                column: "customer_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Vehicles_vehicle_id",
                table: "Bookings",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_BookingStatusHistory_Bookings_booking_id",
                table: "BookingStatusHistory",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CarDetail_Vehicles_vehicle_id",
                table: "CarDetail",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CheckInOutImages_Bookings_booking_id",
                table: "CheckInOutImages",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Bookings_booking_id",
                table: "Contracts",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerProfiles_Users_user_id",
                table: "CustomerProfiles",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Disputes_Bookings_booking_id",
                table: "Disputes",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InspectionReports_Bookings_booking_id",
                table: "InspectionReports",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_MotorbikeDetail_Vehicles_vehicle_id",
                table: "MotorbikeDetail",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_NotificationPreferences_Users_user_id",
                table: "NotificationPreferences",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Notifications_Users_user_id",
                table: "Notifications",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OtpCodes_Users_user_id",
                table: "OtpCodes",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_OwnerProfiles_Users_user_id",
                table: "OwnerProfiles",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Bookings_booking_id",
                table: "Payments",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PricingRules_Vehicles_vehicle_id",
                table: "PricingRules",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RefreshTokens_Users_user_id",
                table: "RefreshTokens",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reports_Bookings_booking_id",
                table: "Reports",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Bookings_booking_id",
                table: "Reviews",
                column: "booking_id",
                principalTable: "Bookings",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_Permissions_permission_id",
                table: "RolePermissions",
                column: "permission_id",
                principalTable: "Permissions",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_RolePermissions_Roles_role_id",
                table: "RolePermissions",
                column: "role_id",
                principalTable: "Roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffProfiles_Users_user_id",
                table: "StaffProfiles",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SupportTickets_Users_user_id",
                table: "SupportTickets",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TicketMessages_SupportTickets_ticket_id",
                table: "TicketMessages",
                column: "ticket_id",
                principalTable: "SupportTickets",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TrustScores_Users_user_id",
                table: "TrustScores",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Roles_role_id",
                table: "UserRoles",
                column: "role_id",
                principalTable: "Roles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRoles_Users_user_id",
                table: "UserRoles",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserSessions_Users_user_id",
                table: "UserSessions",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleDocuments_Vehicles_vehicle_id",
                table: "VehicleDocuments",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleFeatureMapping_VehicleFeature_feature_id",
                table: "VehicleFeatureMapping",
                column: "feature_id",
                principalTable: "VehicleFeature",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleFeatureMapping_Vehicles_vehicle_id",
                table: "VehicleFeatureMapping",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleImages_Vehicles_vehicle_id",
                table: "VehicleImages",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleModel_VehicleBrand_brand_id",
                table: "VehicleModel",
                column: "brand_id",
                principalTable: "VehicleBrand",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleModelPricing_PricingRegion_pricing_region_id",
                table: "VehicleModelPricing",
                column: "pricing_region_id",
                principalTable: "PricingRegion",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehicleModelPricing_VehicleModel_model_id",
                table: "VehicleModelPricing",
                column: "model_id",
                principalTable: "VehicleModel",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VehiclePricing_Vehicles_vehicle_id",
                table: "VehiclePricing",
                column: "vehicle_id",
                principalTable: "Vehicles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_Users_owner_id",
                table: "Vehicles",
                column: "owner_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_VehicleBrand_brand_id",
                table: "Vehicles",
                column: "brand_id",
                principalTable: "VehicleBrand",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vehicles_VehicleModel_model_id",
                table: "Vehicles",
                column: "model_id",
                principalTable: "VehicleModel",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VerificationRequests_Users_user_id",
                table: "VerificationRequests",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Wallets_Users_user_id",
                table: "Wallets",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_WalletTransactions_Wallets_wallet_id",
                table: "WalletTransactions",
                column: "wallet_id",
                principalTable: "Wallets",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
