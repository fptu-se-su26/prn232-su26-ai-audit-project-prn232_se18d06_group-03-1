using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace MoveVN.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBlockedDateCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Area_PricingRegion_pricing_region_id",
                table: "Area");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetRoleClaims_AspNetRoles_role_id",
                table: "AspNetRoleClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserClaims_AspNetUsers_user_id",
                table: "AspNetUserClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserLogins_AspNetUsers_user_id",
                table: "AspNetUserLogins");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserRoles_AspNetRoles_role_id",
                table: "AspNetUserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserRoles_AspNetUsers_user_id",
                table: "AspNetUserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserTokens_AspNetUsers_user_id",
                table: "AspNetUserTokens");

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
                name: "IX_VehicleImages_vehicle_id",
                table: "VehicleImages");

            migrationBuilder.DropIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments");

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

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehiclePricing",
                table: "VehiclePricing");

            migrationBuilder.DropIndex(
                name: "IX_VehiclePricing_vehicle_id",
                table: "VehiclePricing");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleModelPricing",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_model_id_pricing_region_id_year_from_ye~",
                table: "VehicleModelPricing");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModelPricing_pricing_region_id",
                table: "VehicleModelPricing");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleModel",
                table: "VehicleModel");

            migrationBuilder.DropIndex(
                name: "IX_VehicleModel_brand_id_name",
                table: "VehicleModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleFeatureMapping",
                table: "VehicleFeatureMapping");

            migrationBuilder.DropIndex(
                name: "IX_VehicleFeatureMapping_feature_id",
                table: "VehicleFeatureMapping");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleFeature",
                table: "VehicleFeature");

            migrationBuilder.DropIndex(
                name: "IX_VehicleFeature_name_vehicle_type",
                table: "VehicleFeature");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleBrand",
                table: "VehicleBrand");

            migrationBuilder.DropIndex(
                name: "IX_VehicleBrand_name",
                table: "VehicleBrand");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SystemConfig",
                table: "SystemConfig");

            migrationBuilder.DropIndex(
                name: "IX_SystemConfig_config_key",
                table: "SystemConfig");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PricingRegion",
                table: "PricingRegion");

            migrationBuilder.DropIndex(
                name: "IX_PricingRegion_code",
                table: "PricingRegion");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MotorbikeDetail",
                table: "MotorbikeDetail");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CarDetail",
                table: "CarDetail");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BookingStatusHistory",
                table: "BookingStatusHistory");

            migrationBuilder.DropIndex(
                name: "IX_BookingStatusHistory_booking_id",
                table: "BookingStatusHistory");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Area",
                table: "Area");

            migrationBuilder.DropIndex(
                name: "IX_Area_pricing_region_id",
                table: "Area");

            migrationBuilder.DropIndex(
                name: "IX_Area_province_district",
                table: "Area");

            migrationBuilder.RenameTable(
                name: "VehiclePricing",
                newName: "VehiclePricings");

            migrationBuilder.RenameTable(
                name: "VehicleModelPricing",
                newName: "VehicleModelPricings");

            migrationBuilder.RenameTable(
                name: "VehicleModel",
                newName: "VehicleModels");

            migrationBuilder.RenameTable(
                name: "VehicleFeatureMapping",
                newName: "VehicleFeatureMappings");

            migrationBuilder.RenameTable(
                name: "VehicleFeature",
                newName: "VehicleFeatures");

            migrationBuilder.RenameTable(
                name: "VehicleBrand",
                newName: "VehicleBrands");

            migrationBuilder.RenameTable(
                name: "SystemConfig",
                newName: "SystemConfigs");

            migrationBuilder.RenameTable(
                name: "PricingRegion",
                newName: "PricingRegions");

            migrationBuilder.RenameTable(
                name: "MotorbikeDetail",
                newName: "MotorbikeDetails");

            migrationBuilder.RenameTable(
                name: "CarDetail",
                newName: "CarDetails");

            migrationBuilder.RenameTable(
                name: "BookingStatusHistory",
                newName: "BookingStatusHistories");

            migrationBuilder.RenameTable(
                name: "Area",
                newName: "Areas");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "WalletTransactions",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "note",
                table: "WalletTransactions",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "amount",
                table: "WalletTransactions",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "WalletTransactions",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "wallet_id",
                table: "WalletTransactions",
                newName: "WalletId");

            migrationBuilder.RenameColumn(
                name: "reference_id",
                table: "WalletTransactions",
                newName: "ReferenceId");

            migrationBuilder.RenameColumn(
                name: "idempotency_key",
                table: "WalletTransactions",
                newName: "IdempotencyKey");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "WalletTransactions",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "balance_after",
                table: "WalletTransactions",
                newName: "BalanceAfter");

            migrationBuilder.RenameColumn(
                name: "balance",
                table: "Wallets",
                newName: "Balance");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Wallets",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Wallets",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Wallets",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "total_spent",
                table: "Wallets",
                newName: "TotalSpent");

            migrationBuilder.RenameColumn(
                name: "total_earned",
                table: "Wallets",
                newName: "TotalEarned");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "VerificationRequests",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "VerificationRequests",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VerificationRequests",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "VerificationRequests",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "selfie_url",
                table: "VerificationRequests",
                newName: "SelfieUrl");

            migrationBuilder.RenameColumn(
                name: "reviewed_by",
                table: "VerificationRequests",
                newName: "ReviewedBy");

            migrationBuilder.RenameColumn(
                name: "reviewed_at",
                table: "VerificationRequests",
                newName: "ReviewedAt");

            migrationBuilder.RenameColumn(
                name: "rejection_reason",
                table: "VerificationRequests",
                newName: "RejectionReason");

            migrationBuilder.RenameColumn(
                name: "front_image_url",
                table: "VerificationRequests",
                newName: "FrontImageUrl");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "VerificationRequests",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "back_image_url",
                table: "VerificationRequests",
                newName: "BackImageUrl");

            migrationBuilder.RenameColumn(
                name: "year",
                table: "Vehicles",
                newName: "Year");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Vehicles",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "Vehicles",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "Vehicles",
                newName: "Latitude");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Vehicles",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "address",
                table: "Vehicles",
                newName: "Address");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Vehicles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "rejection_reason",
                table: "Vehicles",
                newName: "RejectionReason");

            migrationBuilder.RenameColumn(
                name: "price_per_day",
                table: "Vehicles",
                newName: "PricePerDay");

            migrationBuilder.RenameColumn(
                name: "owner_id",
                table: "Vehicles",
                newName: "OwnerId");

            migrationBuilder.RenameColumn(
                name: "model_id",
                table: "Vehicles",
                newName: "ModelId");

            migrationBuilder.RenameColumn(
                name: "license_plate",
                table: "Vehicles",
                newName: "LicensePlate");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Vehicles",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "brand_id",
                table: "Vehicles",
                newName: "BrandId");

            migrationBuilder.RenameColumn(
                name: "approved_by",
                table: "Vehicles",
                newName: "ApprovedBy");

            migrationBuilder.RenameColumn(
                name: "approved_at",
                table: "Vehicles",
                newName: "ApprovedAt");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleImages",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "VehicleImages",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "sort_order",
                table: "VehicleImages",
                newName: "SortOrder");

            migrationBuilder.RenameColumn(
                name: "is_primary",
                table: "VehicleImages",
                newName: "IsPrimary");

            migrationBuilder.RenameColumn(
                name: "image_url",
                table: "VehicleImages",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "VehicleImages",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "verified",
                table: "VehicleDocuments",
                newName: "Verified");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleDocuments",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "VehicleDocuments",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "file_url",
                table: "VehicleDocuments",
                newName: "FileUrl");

            migrationBuilder.RenameColumn(
                name: "expiry_date",
                table: "VehicleDocuments",
                newName: "ExpiryDate");

            migrationBuilder.RenameColumn(
                name: "doc_type",
                table: "VehicleDocuments",
                newName: "DocType");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "VehicleDocuments",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "UserSessions",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "UserSessions",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "user_agent",
                table: "UserSessions",
                newName: "UserAgent");

            migrationBuilder.RenameColumn(
                name: "last_heartbeat_at",
                table: "UserSessions",
                newName: "LastHeartbeatAt");

            migrationBuilder.RenameColumn(
                name: "ip_address",
                table: "UserSessions",
                newName: "IpAddress");

            migrationBuilder.RenameColumn(
                name: "disconnected_at",
                table: "UserSessions",
                newName: "DisconnectedAt");

            migrationBuilder.RenameColumn(
                name: "device_type",
                table: "UserSessions",
                newName: "DeviceType");

            migrationBuilder.RenameColumn(
                name: "connection_id",
                table: "UserSessions",
                newName: "ConnectionId");

            migrationBuilder.RenameColumn(
                name: "connected_at",
                table: "UserSessions",
                newName: "ConnectedAt");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Users",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "phone",
                table: "Users",
                newName: "Phone");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Users",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "last_seen_at",
                table: "Users",
                newName: "LastSeenAt");

            migrationBuilder.RenameColumn(
                name: "last_login_at",
                table: "Users",
                newName: "LastLoginAt");

            migrationBuilder.RenameColumn(
                name: "is_online",
                table: "Users",
                newName: "IsOnline");

            migrationBuilder.RenameColumn(
                name: "is_email_verified",
                table: "Users",
                newName: "IsEmailVerified");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "Users",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "avatar_url",
                table: "Users",
                newName: "AvatarUrl");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "UserRoles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "UserRoles",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "role_id",
                table: "UserRoles",
                newName: "RoleId");

            migrationBuilder.RenameColumn(
                name: "assigned_by",
                table: "UserRoles",
                newName: "AssignedBy");

            migrationBuilder.RenameColumn(
                name: "assigned_at",
                table: "UserRoles",
                newName: "AssignedAt");

            migrationBuilder.RenameColumn(
                name: "tier",
                table: "TrustScores",
                newName: "Tier");

            migrationBuilder.RenameColumn(
                name: "score",
                table: "TrustScores",
                newName: "Score");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "TrustScores",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "TrustScores",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "report_count",
                table: "TrustScores",
                newName: "ReportCount");

            migrationBuilder.RenameColumn(
                name: "last_calculated_at",
                table: "TrustScores",
                newName: "LastCalculatedAt");

            migrationBuilder.RenameColumn(
                name: "completed_trips",
                table: "TrustScores",
                newName: "CompletedTrips");

            migrationBuilder.RenameColumn(
                name: "cancellation_count",
                table: "TrustScores",
                newName: "CancellationCount");

            migrationBuilder.RenameColumn(
                name: "average_rating",
                table: "TrustScores",
                newName: "AverageRating");

            migrationBuilder.RenameColumn(
                name: "message",
                table: "TicketMessages",
                newName: "Message");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "TicketMessages",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "ticket_id",
                table: "TicketMessages",
                newName: "TicketId");

            migrationBuilder.RenameColumn(
                name: "sender_id",
                table: "TicketMessages",
                newName: "SenderId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "TicketMessages",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "attachment_urls",
                table: "TicketMessages",
                newName: "AttachmentUrls");

            migrationBuilder.RenameColumn(
                name: "subject",
                table: "SupportTickets",
                newName: "Subject");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "SupportTickets",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "priority",
                table: "SupportTickets",
                newName: "Priority");

            migrationBuilder.RenameColumn(
                name: "category",
                table: "SupportTickets",
                newName: "Category");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "SupportTickets",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "SupportTickets",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "ticket_number",
                table: "SupportTickets",
                newName: "TicketNumber");

            migrationBuilder.RenameColumn(
                name: "resolved_at",
                table: "SupportTickets",
                newName: "ResolvedAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "SupportTickets",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "assigned_staff_id",
                table: "SupportTickets",
                newName: "AssignedStaffId");

            migrationBuilder.RenameColumn(
                name: "department",
                table: "StaffProfiles",
                newName: "Department");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "StaffProfiles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "StaffProfiles",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "supervisor_id",
                table: "StaffProfiles",
                newName: "SupervisorId");

            migrationBuilder.RenameColumn(
                name: "employee_code",
                table: "StaffProfiles",
                newName: "EmployeeCode");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Roles",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Roles",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Roles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "permission_id",
                table: "RolePermissions",
                newName: "PermissionId");

            migrationBuilder.RenameColumn(
                name: "role_id",
                table: "RolePermissions",
                newName: "RoleId");

            migrationBuilder.RenameColumn(
                name: "rating",
                table: "Reviews",
                newName: "Rating");

            migrationBuilder.RenameColumn(
                name: "comment",
                table: "Reviews",
                newName: "Comment");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Reviews",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "Reviews",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "support_score",
                table: "Reviews",
                newName: "SupportScore");

            migrationBuilder.RenameColumn(
                name: "reviewer_id",
                table: "Reviews",
                newName: "ReviewerId");

            migrationBuilder.RenameColumn(
                name: "reviewee_id",
                table: "Reviews",
                newName: "RevieweeId");

            migrationBuilder.RenameColumn(
                name: "is_public",
                table: "Reviews",
                newName: "IsPublic");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Reviews",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "cleanliness_score",
                table: "Reviews",
                newName: "CleanlinessScore");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "Reviews",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "accuracy_score",
                table: "Reviews",
                newName: "AccuracyScore");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Reports",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Reports",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Reports",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "reporter_id",
                table: "Reports",
                newName: "ReporterId");

            migrationBuilder.RenameColumn(
                name: "report_type",
                table: "Reports",
                newName: "ReportType");

            migrationBuilder.RenameColumn(
                name: "evidence_urls",
                table: "Reports",
                newName: "EvidenceUrls");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Reports",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "Reports",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "RefreshTokens",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "RefreshTokens",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "token_hash",
                table: "RefreshTokens",
                newName: "TokenHash");

            migrationBuilder.RenameColumn(
                name: "revoked_at",
                table: "RefreshTokens",
                newName: "RevokedAt");

            migrationBuilder.RenameColumn(
                name: "expires_at",
                table: "RefreshTokens",
                newName: "ExpiresAt");

            migrationBuilder.RenameColumn(
                name: "device_info",
                table: "RefreshTokens",
                newName: "DeviceInfo");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "RefreshTokens",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "priority",
                table: "PricingRules",
                newName: "Priority");

            migrationBuilder.RenameColumn(
                name: "multiplier",
                table: "PricingRules",
                newName: "Multiplier");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "PricingRules",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "PricingRules",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "start_date",
                table: "PricingRules",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "rule_type",
                table: "PricingRules",
                newName: "RuleType");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "PricingRules",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "fixed_price",
                table: "PricingRules",
                newName: "FixedPrice");

            migrationBuilder.RenameColumn(
                name: "end_date",
                table: "PricingRules",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "priority",
                table: "PlatformFeeRules",
                newName: "Priority");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "PlatformFeeRules",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "PlatformFeeRules",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "PlatformFeeRules",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "target_type",
                table: "PlatformFeeRules",
                newName: "TargetType");

            migrationBuilder.RenameColumn(
                name: "target_id",
                table: "PlatformFeeRules",
                newName: "TargetId");

            migrationBuilder.RenameColumn(
                name: "start_at",
                table: "PlatformFeeRules",
                newName: "StartAt");

            migrationBuilder.RenameColumn(
                name: "min_fee",
                table: "PlatformFeeRules",
                newName: "MinFee");

            migrationBuilder.RenameColumn(
                name: "max_fee",
                table: "PlatformFeeRules",
                newName: "MaxFee");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "PlatformFeeRules",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "fee_value",
                table: "PlatformFeeRules",
                newName: "FeeValue");

            migrationBuilder.RenameColumn(
                name: "fee_type",
                table: "PlatformFeeRules",
                newName: "FeeType");

            migrationBuilder.RenameColumn(
                name: "end_at",
                table: "PlatformFeeRules",
                newName: "EndAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "PlatformFeeRules",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "Permissions",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "code",
                table: "Permissions",
                newName: "Code");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Permissions",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "Payments",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Payments",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "note",
                table: "Payments",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "gateway",
                table: "Payments",
                newName: "Gateway");

            migrationBuilder.RenameColumn(
                name: "currency",
                table: "Payments",
                newName: "Currency");

            migrationBuilder.RenameColumn(
                name: "amount",
                table: "Payments",
                newName: "Amount");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Payments",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "payer_id",
                table: "Payments",
                newName: "PayerId");

            migrationBuilder.RenameColumn(
                name: "paid_at",
                table: "Payments",
                newName: "PaidAt");

            migrationBuilder.RenameColumn(
                name: "idempotency_key",
                table: "Payments",
                newName: "IdempotencyKey");

            migrationBuilder.RenameColumn(
                name: "gateway_transaction_id",
                table: "Payments",
                newName: "GatewayTransactionId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Payments",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "Payments",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "tier",
                table: "OwnerProfiles",
                newName: "Tier");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "OwnerProfiles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "OwnerProfiles",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "total_trips",
                table: "OwnerProfiles",
                newName: "TotalTrips");

            migrationBuilder.RenameColumn(
                name: "is_verified",
                table: "OwnerProfiles",
                newName: "IsVerified");

            migrationBuilder.RenameColumn(
                name: "commission_rate",
                table: "OwnerProfiles",
                newName: "CommissionRate");

            migrationBuilder.RenameColumn(
                name: "bank_name",
                table: "OwnerProfiles",
                newName: "BankName");

            migrationBuilder.RenameColumn(
                name: "bank_account_number",
                table: "OwnerProfiles",
                newName: "BankAccountNumber");

            migrationBuilder.RenameColumn(
                name: "average_rating",
                table: "OwnerProfiles",
                newName: "AverageRating");

            migrationBuilder.RenameColumn(
                name: "purpose",
                table: "OtpCodes",
                newName: "Purpose");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "OtpCodes",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "attempts",
                table: "OtpCodes",
                newName: "Attempts");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "OtpCodes",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "OtpCodes",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "used_at",
                table: "OtpCodes",
                newName: "UsedAt");

            migrationBuilder.RenameColumn(
                name: "otp_code_hash",
                table: "OtpCodes",
                newName: "OtpCodeHash");

            migrationBuilder.RenameColumn(
                name: "is_used",
                table: "OtpCodes",
                newName: "IsUsed");

            migrationBuilder.RenameColumn(
                name: "ip_address",
                table: "OtpCodes",
                newName: "IpAddress");

            migrationBuilder.RenameColumn(
                name: "expires_at",
                table: "OtpCodes",
                newName: "ExpiresAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "OtpCodes",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "Notifications",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Notifications",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "channel",
                table: "Notifications",
                newName: "Channel");

            migrationBuilder.RenameColumn(
                name: "body",
                table: "Notifications",
                newName: "Body");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Notifications",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Notifications",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "sent_at",
                table: "Notifications",
                newName: "SentAt");

            migrationBuilder.RenameColumn(
                name: "read_at",
                table: "Notifications",
                newName: "ReadAt");

            migrationBuilder.RenameColumn(
                name: "is_read",
                table: "Notifications",
                newName: "IsRead");

            migrationBuilder.RenameColumn(
                name: "data_json",
                table: "Notifications",
                newName: "DataJson");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Notifications",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "NotificationPreferences",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "zalo_enabled",
                table: "NotificationPreferences",
                newName: "ZaloEnabled");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "NotificationPreferences",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "NotificationPreferences",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "sms_enabled",
                table: "NotificationPreferences",
                newName: "SmsEnabled");

            migrationBuilder.RenameColumn(
                name: "quiet_hours_start",
                table: "NotificationPreferences",
                newName: "QuietHoursStart");

            migrationBuilder.RenameColumn(
                name: "quiet_hours_end",
                table: "NotificationPreferences",
                newName: "QuietHoursEnd");

            migrationBuilder.RenameColumn(
                name: "in_app_enabled",
                table: "NotificationPreferences",
                newName: "InAppEnabled");

            migrationBuilder.RenameColumn(
                name: "email_enabled",
                table: "NotificationPreferences",
                newName: "EmailEnabled");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "MLPredictionLogs",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "top_risk_factors",
                table: "MLPredictionLogs",
                newName: "TopRiskFactors");

            migrationBuilder.RenameColumn(
                name: "risk_score",
                table: "MLPredictionLogs",
                newName: "RiskScore");

            migrationBuilder.RenameColumn(
                name: "model_version",
                table: "MLPredictionLogs",
                newName: "ModelVersion");

            migrationBuilder.RenameColumn(
                name: "feature_snapshot",
                table: "MLPredictionLogs",
                newName: "FeatureSnapshot");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "MLPredictionLogs",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "MLPredictionLogs",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "type",
                table: "InspectionReports",
                newName: "Type");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "InspectionReports",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "staff_id",
                table: "InspectionReports",
                newName: "StaffId");

            migrationBuilder.RenameColumn(
                name: "report_pdf_url",
                table: "InspectionReports",
                newName: "ReportPdfUrl");

            migrationBuilder.RenameColumn(
                name: "odometer_km",
                table: "InspectionReports",
                newName: "OdometerKm");

            migrationBuilder.RenameColumn(
                name: "fuel_level",
                table: "InspectionReports",
                newName: "FuelLevel");

            migrationBuilder.RenameColumn(
                name: "damage_noted",
                table: "InspectionReports",
                newName: "DamageNoted");

            migrationBuilder.RenameColumn(
                name: "damage_description",
                table: "InspectionReports",
                newName: "DamageDescription");

            migrationBuilder.RenameColumn(
                name: "customer_signature_url",
                table: "InspectionReports",
                newName: "CustomerSignatureUrl");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "InspectionReports",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "InspectionReports",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "FeatureFlags",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "FeatureFlags",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_by",
                table: "FeatureFlags",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "FeatureFlags",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "rollout_percent",
                table: "FeatureFlags",
                newName: "RolloutPercent");

            migrationBuilder.RenameColumn(
                name: "is_enabled",
                table: "FeatureFlags",
                newName: "IsEnabled");

            migrationBuilder.RenameColumn(
                name: "flag_key",
                table: "FeatureFlags",
                newName: "FlagKey");

            migrationBuilder.RenameColumn(
                name: "allowed_roles",
                table: "FeatureFlags",
                newName: "AllowedRoles");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Disputes",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "resolution",
                table: "Disputes",
                newName: "Resolution");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Disputes",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "resolved_at",
                table: "Disputes",
                newName: "ResolvedAt");

            migrationBuilder.RenameColumn(
                name: "report_id",
                table: "Disputes",
                newName: "ReportId");

            migrationBuilder.RenameColumn(
                name: "opened_by",
                table: "Disputes",
                newName: "OpenedBy");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Disputes",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "compensation_amount",
                table: "Disputes",
                newName: "CompensationAmount");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "Disputes",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "assigned_staff_id",
                table: "Disputes",
                newName: "AssignedStaffId");

            migrationBuilder.RenameColumn(
                name: "district",
                table: "DemandForecasts",
                newName: "District");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "DemandForecasts",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_type",
                table: "DemandForecasts",
                newName: "VehicleType");

            migrationBuilder.RenameColumn(
                name: "predicted_demand",
                table: "DemandForecasts",
                newName: "PredictedDemand");

            migrationBuilder.RenameColumn(
                name: "model_version",
                table: "DemandForecasts",
                newName: "ModelVersion");

            migrationBuilder.RenameColumn(
                name: "forecast_date",
                table: "DemandForecasts",
                newName: "ForecastDate");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "DemandForecasts",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "address",
                table: "CustomerProfiles",
                newName: "Address");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "CustomerProfiles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "CustomerProfiles",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "preferred_vehicle_type",
                table: "CustomerProfiles",
                newName: "PreferredVehicleType");

            migrationBuilder.RenameColumn(
                name: "national_id_verified",
                table: "CustomerProfiles",
                newName: "NationalIdVerified");

            migrationBuilder.RenameColumn(
                name: "national_id",
                table: "CustomerProfiles",
                newName: "NationalId");

            migrationBuilder.RenameColumn(
                name: "driver_license_verified",
                table: "CustomerProfiles",
                newName: "DriverLicenseVerified");

            migrationBuilder.RenameColumn(
                name: "driver_license_number",
                table: "CustomerProfiles",
                newName: "DriverLicenseNumber");

            migrationBuilder.RenameColumn(
                name: "date_of_birth",
                table: "CustomerProfiles",
                newName: "DateOfBirth");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Contracts",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "pdf_url",
                table: "Contracts",
                newName: "PdfUrl");

            migrationBuilder.RenameColumn(
                name: "owner_signed_at",
                table: "Contracts",
                newName: "OwnerSignedAt");

            migrationBuilder.RenameColumn(
                name: "customer_signed_at",
                table: "Contracts",
                newName: "CustomerSignedAt");

            migrationBuilder.RenameColumn(
                name: "customer_signature_data",
                table: "Contracts",
                newName: "CustomerSignatureData");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Contracts",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "contract_number",
                table: "Contracts",
                newName: "ContractNumber");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "Contracts",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "CheckInOutImages",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "uploaded_by",
                table: "CheckInOutImages",
                newName: "UploadedBy");

            migrationBuilder.RenameColumn(
                name: "inspection_id",
                table: "CheckInOutImages",
                newName: "InspectionId");

            migrationBuilder.RenameColumn(
                name: "image_url",
                table: "CheckInOutImages",
                newName: "ImageUrl");

            migrationBuilder.RenameColumn(
                name: "image_type",
                table: "CheckInOutImages",
                newName: "ImageType");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "CheckInOutImages",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "CheckInOutImages",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "CashbackRules",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "CashbackRules",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "trust_tier",
                table: "CashbackRules",
                newName: "TrustTier");

            migrationBuilder.RenameColumn(
                name: "min_deposit_reduction",
                table: "CashbackRules",
                newName: "MinDepositReduction");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "CashbackRules",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "cashback_percent",
                table: "CashbackRules",
                newName: "CashbackPercent");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Bookings",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Bookings",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "Bookings",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Bookings",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "total_days",
                table: "Bookings",
                newName: "TotalDays");

            migrationBuilder.RenameColumn(
                name: "total_amount",
                table: "Bookings",
                newName: "TotalAmount");

            migrationBuilder.RenameColumn(
                name: "start_date",
                table: "Bookings",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "risk_score",
                table: "Bookings",
                newName: "RiskScore");

            migrationBuilder.RenameColumn(
                name: "return_address",
                table: "Bookings",
                newName: "ReturnAddress");

            migrationBuilder.RenameColumn(
                name: "platform_fee_value",
                table: "Bookings",
                newName: "PlatformFeeValue");

            migrationBuilder.RenameColumn(
                name: "platform_fee_type",
                table: "Bookings",
                newName: "PlatformFeeType");

            migrationBuilder.RenameColumn(
                name: "platform_fee_rule_id",
                table: "Bookings",
                newName: "PlatformFeeRuleId");

            migrationBuilder.RenameColumn(
                name: "platform_fee",
                table: "Bookings",
                newName: "PlatformFee");

            migrationBuilder.RenameColumn(
                name: "pickup_address",
                table: "Bookings",
                newName: "PickupAddress");

            migrationBuilder.RenameColumn(
                name: "owner_id",
                table: "Bookings",
                newName: "OwnerId");

            migrationBuilder.RenameColumn(
                name: "end_date",
                table: "Bookings",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "deposit_amount",
                table: "Bookings",
                newName: "DepositAmount");

            migrationBuilder.RenameColumn(
                name: "customer_note",
                table: "Bookings",
                newName: "CustomerNote");

            migrationBuilder.RenameColumn(
                name: "customer_id",
                table: "Bookings",
                newName: "CustomerId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Bookings",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "cancelled_by",
                table: "Bookings",
                newName: "CancelledBy");

            migrationBuilder.RenameColumn(
                name: "cancelled_at",
                table: "Bookings",
                newName: "CancelledAt");

            migrationBuilder.RenameColumn(
                name: "cancel_reason",
                table: "Bookings",
                newName: "CancelReason");

            migrationBuilder.RenameColumn(
                name: "booking_code",
                table: "Bookings",
                newName: "BookingCode");

            migrationBuilder.RenameColumn(
                name: "base_price",
                table: "Bookings",
                newName: "BasePrice");

            migrationBuilder.RenameColumn(
                name: "reason",
                table: "BlockedDates",
                newName: "Reason");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "BlockedDates",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "BlockedDates",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "start_date",
                table: "BlockedDates",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "end_date",
                table: "BlockedDates",
                newName: "EndDate");

            migrationBuilder.RenameColumn(
                name: "action",
                table: "AuditLogs",
                newName: "Action");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "AuditLogs",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_agent",
                table: "AuditLogs",
                newName: "UserAgent");

            migrationBuilder.RenameColumn(
                name: "old_value",
                table: "AuditLogs",
                newName: "OldValue");

            migrationBuilder.RenameColumn(
                name: "new_value",
                table: "AuditLogs",
                newName: "NewValue");

            migrationBuilder.RenameColumn(
                name: "ip_address",
                table: "AuditLogs",
                newName: "IpAddress");

            migrationBuilder.RenameColumn(
                name: "entity_type",
                table: "AuditLogs",
                newName: "EntityType");

            migrationBuilder.RenameColumn(
                name: "entity_id",
                table: "AuditLogs",
                newName: "EntityId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "AuditLogs",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "actor_role",
                table: "AuditLogs",
                newName: "ActorRole");

            migrationBuilder.RenameColumn(
                name: "actor_id",
                table: "AuditLogs",
                newName: "ActorId");

            migrationBuilder.RenameColumn(
                name: "value",
                table: "AspNetUserTokens",
                newName: "Value");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "AspNetUserTokens",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "login_provider",
                table: "AspNetUserTokens",
                newName: "LoginProvider");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "AspNetUserTokens",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "AspNetUsers",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "AspNetUsers",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_name",
                table: "AspNetUsers",
                newName: "UserName");

            migrationBuilder.RenameColumn(
                name: "two_factor_enabled",
                table: "AspNetUsers",
                newName: "TwoFactorEnabled");

            migrationBuilder.RenameColumn(
                name: "security_stamp",
                table: "AspNetUsers",
                newName: "SecurityStamp");

            migrationBuilder.RenameColumn(
                name: "phone_number_confirmed",
                table: "AspNetUsers",
                newName: "PhoneNumberConfirmed");

            migrationBuilder.RenameColumn(
                name: "phone_number",
                table: "AspNetUsers",
                newName: "PhoneNumber");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "AspNetUsers",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "normalized_user_name",
                table: "AspNetUsers",
                newName: "NormalizedUserName");

            migrationBuilder.RenameColumn(
                name: "normalized_email",
                table: "AspNetUsers",
                newName: "NormalizedEmail");

            migrationBuilder.RenameColumn(
                name: "lockout_end",
                table: "AspNetUsers",
                newName: "LockoutEnd");

            migrationBuilder.RenameColumn(
                name: "lockout_enabled",
                table: "AspNetUsers",
                newName: "LockoutEnabled");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "AspNetUsers",
                newName: "FullName");

            migrationBuilder.RenameColumn(
                name: "email_confirmed",
                table: "AspNetUsers",
                newName: "EmailConfirmed");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "AspNetUsers",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "concurrency_stamp",
                table: "AspNetUsers",
                newName: "ConcurrencyStamp");

            migrationBuilder.RenameColumn(
                name: "access_failed_count",
                table: "AspNetUsers",
                newName: "AccessFailedCount");

            migrationBuilder.RenameColumn(
                name: "role_id",
                table: "AspNetUserRoles",
                newName: "RoleId");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "AspNetUserRoles",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserRoles_role_id",
                table: "AspNetUserRoles",
                newName: "IX_AspNetUserRoles_RoleId");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "AspNetUserLogins",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "provider_display_name",
                table: "AspNetUserLogins",
                newName: "ProviderDisplayName");

            migrationBuilder.RenameColumn(
                name: "provider_key",
                table: "AspNetUserLogins",
                newName: "ProviderKey");

            migrationBuilder.RenameColumn(
                name: "login_provider",
                table: "AspNetUserLogins",
                newName: "LoginProvider");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserLogins_user_id",
                table: "AspNetUserLogins",
                newName: "IX_AspNetUserLogins_UserId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "AspNetUserClaims",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "AspNetUserClaims",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "claim_value",
                table: "AspNetUserClaims",
                newName: "ClaimValue");

            migrationBuilder.RenameColumn(
                name: "claim_type",
                table: "AspNetUserClaims",
                newName: "ClaimType");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserClaims_user_id",
                table: "AspNetUserClaims",
                newName: "IX_AspNetUserClaims_UserId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "AspNetRoles",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "AspNetRoles",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "normalized_name",
                table: "AspNetRoles",
                newName: "NormalizedName");

            migrationBuilder.RenameColumn(
                name: "concurrency_stamp",
                table: "AspNetRoles",
                newName: "ConcurrencyStamp");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "AspNetRoleClaims",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "role_id",
                table: "AspNetRoleClaims",
                newName: "RoleId");

            migrationBuilder.RenameColumn(
                name: "claim_value",
                table: "AspNetRoleClaims",
                newName: "ClaimValue");

            migrationBuilder.RenameColumn(
                name: "claim_type",
                table: "AspNetRoleClaims",
                newName: "ClaimType");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetRoleClaims_role_id",
                table: "AspNetRoleClaims",
                newName: "IX_AspNetRoleClaims_RoleId");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehiclePricings",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "VehiclePricings",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "pricing_mode",
                table: "VehiclePricings",
                newName: "PricingMode");

            migrationBuilder.RenameColumn(
                name: "last_updated_at",
                table: "VehiclePricings",
                newName: "LastUpdatedAt");

            migrationBuilder.RenameColumn(
                name: "last_calculated_at",
                table: "VehiclePricings",
                newName: "LastCalculatedAt");

            migrationBuilder.RenameColumn(
                name: "fixed_price_per_day",
                table: "VehiclePricings",
                newName: "FixedPricePerDay");

            migrationBuilder.RenameColumn(
                name: "current_price_per_day",
                table: "VehiclePricings",
                newName: "CurrentPricePerDay");

            migrationBuilder.RenameColumn(
                name: "auto_min_price",
                table: "VehiclePricings",
                newName: "AutoMinPrice");

            migrationBuilder.RenameColumn(
                name: "auto_max_price",
                table: "VehiclePricings",
                newName: "AutoMaxPrice");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleModelPricings",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "year_to",
                table: "VehicleModelPricings",
                newName: "YearTo");

            migrationBuilder.RenameColumn(
                name: "year_from",
                table: "VehicleModelPricings",
                newName: "YearFrom");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "VehicleModelPricings",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "suggested_min_price",
                table: "VehicleModelPricings",
                newName: "SuggestedMinPrice");

            migrationBuilder.RenameColumn(
                name: "suggested_max_price",
                table: "VehicleModelPricings",
                newName: "SuggestedMaxPrice");

            migrationBuilder.RenameColumn(
                name: "pricing_region_id",
                table: "VehicleModelPricings",
                newName: "PricingRegionId");

            migrationBuilder.RenameColumn(
                name: "model_id",
                table: "VehicleModelPricings",
                newName: "ModelId");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "VehicleModelPricings",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "VehicleModelPricings",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "base_price",
                table: "VehicleModelPricings",
                newName: "BasePrice");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "VehicleModels",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleModels",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "VehicleModels",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "brand_id",
                table: "VehicleModels",
                newName: "BrandId");

            migrationBuilder.RenameColumn(
                name: "feature_id",
                table: "VehicleFeatureMappings",
                newName: "FeatureId");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "VehicleFeatureMappings",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "VehicleFeatures",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleFeatures",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_type",
                table: "VehicleFeatures",
                newName: "VehicleType");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "VehicleFeatures",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "VehicleBrands",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "VehicleBrands",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "vehicle_type",
                table: "VehicleBrands",
                newName: "VehicleType");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "VehicleBrands",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "SystemConfigs",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "SystemConfigs",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_by",
                table: "SystemConfigs",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "SystemConfigs",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "data_type",
                table: "SystemConfigs",
                newName: "DataType");

            migrationBuilder.RenameColumn(
                name: "config_value",
                table: "SystemConfigs",
                newName: "ConfigValue");

            migrationBuilder.RenameColumn(
                name: "config_key",
                table: "SystemConfigs",
                newName: "ConfigKey");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "PricingRegions",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "code",
                table: "PricingRegions",
                newName: "Code");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "PricingRegions",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "PricingRegions",
                newName: "IsActive");

            migrationBuilder.RenameColumn(
                name: "engine_capacity",
                table: "MotorbikeDetails",
                newName: "EngineCapacity");

            migrationBuilder.RenameColumn(
                name: "bike_type",
                table: "MotorbikeDetails",
                newName: "BikeType");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "MotorbikeDetails",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "transmission",
                table: "CarDetails",
                newName: "Transmission");

            migrationBuilder.RenameColumn(
                name: "drivetrain",
                table: "CarDetails",
                newName: "Drivetrain");

            migrationBuilder.RenameColumn(
                name: "seat_count",
                table: "CarDetails",
                newName: "SeatCount");

            migrationBuilder.RenameColumn(
                name: "fuel_type",
                table: "CarDetails",
                newName: "FuelType");

            migrationBuilder.RenameColumn(
                name: "body_type",
                table: "CarDetails",
                newName: "BodyType");

            migrationBuilder.RenameColumn(
                name: "vehicle_id",
                table: "CarDetails",
                newName: "VehicleId");

            migrationBuilder.RenameColumn(
                name: "note",
                table: "BookingStatusHistories",
                newName: "Note");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "BookingStatusHistories",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "to_status",
                table: "BookingStatusHistories",
                newName: "ToStatus");

            migrationBuilder.RenameColumn(
                name: "from_status",
                table: "BookingStatusHistories",
                newName: "FromStatus");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "BookingStatusHistories",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "changed_by",
                table: "BookingStatusHistories",
                newName: "ChangedBy");

            migrationBuilder.RenameColumn(
                name: "booking_id",
                table: "BookingStatusHistories",
                newName: "BookingId");

            migrationBuilder.RenameColumn(
                name: "province",
                table: "Areas",
                newName: "Province");

            migrationBuilder.RenameColumn(
                name: "district",
                table: "Areas",
                newName: "District");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Areas",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "pricing_region_id",
                table: "Areas",
                newName: "PricingRegionId");

            migrationBuilder.RenameColumn(
                name: "is_active",
                table: "Areas",
                newName: "IsActive");

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "WalletTransactions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "BalanceAfter",
                table: "WalletTransactions",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Balance",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalSpent",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalEarned",
                table: "Wallets",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Longitude",
                table: "Vehicles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Latitude",
                table: "Vehicles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "PricePerDay",
                table: "Vehicles",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Score",
                table: "TrustScores",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "AverageRating",
                table: "TrustScores",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "AttachmentUrls",
                table: "TicketMessages",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "EvidenceUrls",
                table: "Reports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Multiplier",
                table: "PricingRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FixedPrice",
                table: "PricingRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "MinFee",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "MaxFee",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FeeValue",
                table: "PlatformFeeRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Payments",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "CommissionRate",
                table: "OwnerProfiles",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "AverageRating",
                table: "OwnerProfiles",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "DataJson",
                table: "Notifications",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "TopRiskFactors",
                table: "MLPredictionLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "RiskScore",
                table: "MLPredictionLogs",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<string>(
                name: "FeatureSnapshot",
                table: "MLPredictionLogs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "jsonb");

            migrationBuilder.AlterColumn<string>(
                name: "AllowedRoles",
                table: "FeatureFlags",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CompensationAmount",
                table: "Disputes",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "MinDepositReduction",
                table: "CashbackRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "CashbackPercent",
                table: "CashbackRules",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "RiskScore",
                table: "Bookings",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "PlatformFeeValue",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "PlatformFee",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "DepositAmount",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "BasePrice",
                table: "Bookings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "BlockedDates",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<string>(
                name: "OldValue",
                table: "AuditLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NewValue",
                table: "AuditLogs",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "jsonb",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "FixedPricePerDay",
                table: "VehiclePricings",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "CurrentPricePerDay",
                table: "VehiclePricings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "AutoMinPrice",
                table: "VehiclePricings",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "AutoMaxPrice",
                table: "VehiclePricings",
                type: "numeric",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2,
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "SuggestedMinPrice",
                table: "VehicleModelPricings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "SuggestedMaxPrice",
                table: "VehicleModelPricings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<decimal>(
                name: "BasePrice",
                table: "VehicleModelPricings",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(15,2)",
                oldPrecision: 15,
                oldScale: 2);

            migrationBuilder.AlterColumn<long>(
                name: "VehicleId",
                table: "MotorbikeDetails",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<long>(
                name: "VehicleId",
                table: "CarDetails",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehiclePricings",
                table: "VehiclePricings",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleModelPricings",
                table: "VehicleModelPricings",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleModels",
                table: "VehicleModels",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleFeatureMappings",
                table: "VehicleFeatureMappings",
                columns: new[] { "VehicleId", "FeatureId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleFeatures",
                table: "VehicleFeatures",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleBrands",
                table: "VehicleBrands",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SystemConfigs",
                table: "SystemConfigs",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PricingRegions",
                table: "PricingRegions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MotorbikeDetails",
                table: "MotorbikeDetails",
                column: "VehicleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CarDetails",
                table: "CarDetails",
                column: "VehicleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_BookingStatusHistories",
                table: "BookingStatusHistories",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Areas",
                table: "Areas",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "AuthLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<long>(type: "bigint", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    EventType = table.Column<string>(type: "text", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    DeviceInfo = table.Column<string>(type: "text", nullable: true),
                    Success = table.Column<bool>(type: "boolean", nullable: false),
                    FailReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthLogs", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId",
                principalTable: "AspNetRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                table: "AspNetUserClaims",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                table: "AspNetUserLogins",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId",
                principalTable: "AspNetRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                table: "AspNetUserRoles",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                table: "AspNetUserTokens",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                table: "AspNetRoleClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                table: "AspNetUserClaims");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                table: "AspNetUserLogins");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                table: "AspNetUserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                table: "AspNetUserRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                table: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "AuthLogs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehiclePricings",
                table: "VehiclePricings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleModels",
                table: "VehicleModels");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleModelPricings",
                table: "VehicleModelPricings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleFeatures",
                table: "VehicleFeatures");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleFeatureMappings",
                table: "VehicleFeatureMappings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VehicleBrands",
                table: "VehicleBrands");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SystemConfigs",
                table: "SystemConfigs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PricingRegions",
                table: "PricingRegions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_MotorbikeDetails",
                table: "MotorbikeDetails");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CarDetails",
                table: "CarDetails");

            migrationBuilder.DropPrimaryKey(
                name: "PK_BookingStatusHistories",
                table: "BookingStatusHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Areas",
                table: "Areas");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "BlockedDates");

            migrationBuilder.RenameTable(
                name: "VehiclePricings",
                newName: "VehiclePricing");

            migrationBuilder.RenameTable(
                name: "VehicleModels",
                newName: "VehicleModel");

            migrationBuilder.RenameTable(
                name: "VehicleModelPricings",
                newName: "VehicleModelPricing");

            migrationBuilder.RenameTable(
                name: "VehicleFeatures",
                newName: "VehicleFeature");

            migrationBuilder.RenameTable(
                name: "VehicleFeatureMappings",
                newName: "VehicleFeatureMapping");

            migrationBuilder.RenameTable(
                name: "VehicleBrands",
                newName: "VehicleBrand");

            migrationBuilder.RenameTable(
                name: "SystemConfigs",
                newName: "SystemConfig");

            migrationBuilder.RenameTable(
                name: "PricingRegions",
                newName: "PricingRegion");

            migrationBuilder.RenameTable(
                name: "MotorbikeDetails",
                newName: "MotorbikeDetail");

            migrationBuilder.RenameTable(
                name: "CarDetails",
                newName: "CarDetail");

            migrationBuilder.RenameTable(
                name: "BookingStatusHistories",
                newName: "BookingStatusHistory");

            migrationBuilder.RenameTable(
                name: "Areas",
                newName: "Area");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "WalletTransactions",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "WalletTransactions",
                newName: "note");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "WalletTransactions",
                newName: "amount");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "WalletTransactions",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "WalletId",
                table: "WalletTransactions",
                newName: "wallet_id");

            migrationBuilder.RenameColumn(
                name: "ReferenceId",
                table: "WalletTransactions",
                newName: "reference_id");

            migrationBuilder.RenameColumn(
                name: "IdempotencyKey",
                table: "WalletTransactions",
                newName: "idempotency_key");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "WalletTransactions",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BalanceAfter",
                table: "WalletTransactions",
                newName: "balance_after");

            migrationBuilder.RenameColumn(
                name: "Balance",
                table: "Wallets",
                newName: "balance");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Wallets",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Wallets",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Wallets",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "TotalSpent",
                table: "Wallets",
                newName: "total_spent");

            migrationBuilder.RenameColumn(
                name: "TotalEarned",
                table: "Wallets",
                newName: "total_earned");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "VerificationRequests",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "VerificationRequests",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VerificationRequests",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "VerificationRequests",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "SelfieUrl",
                table: "VerificationRequests",
                newName: "selfie_url");

            migrationBuilder.RenameColumn(
                name: "ReviewedBy",
                table: "VerificationRequests",
                newName: "reviewed_by");

            migrationBuilder.RenameColumn(
                name: "ReviewedAt",
                table: "VerificationRequests",
                newName: "reviewed_at");

            migrationBuilder.RenameColumn(
                name: "RejectionReason",
                table: "VerificationRequests",
                newName: "rejection_reason");

            migrationBuilder.RenameColumn(
                name: "FrontImageUrl",
                table: "VerificationRequests",
                newName: "front_image_url");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "VerificationRequests",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BackImageUrl",
                table: "VerificationRequests",
                newName: "back_image_url");

            migrationBuilder.RenameColumn(
                name: "Year",
                table: "Vehicles",
                newName: "year");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Vehicles",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "Vehicles",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "Vehicles",
                newName: "latitude");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Vehicles",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Address",
                table: "Vehicles",
                newName: "address");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Vehicles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "RejectionReason",
                table: "Vehicles",
                newName: "rejection_reason");

            migrationBuilder.RenameColumn(
                name: "PricePerDay",
                table: "Vehicles",
                newName: "price_per_day");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "Vehicles",
                newName: "owner_id");

            migrationBuilder.RenameColumn(
                name: "ModelId",
                table: "Vehicles",
                newName: "model_id");

            migrationBuilder.RenameColumn(
                name: "LicensePlate",
                table: "Vehicles",
                newName: "license_plate");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Vehicles",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BrandId",
                table: "Vehicles",
                newName: "brand_id");

            migrationBuilder.RenameColumn(
                name: "ApprovedBy",
                table: "Vehicles",
                newName: "approved_by");

            migrationBuilder.RenameColumn(
                name: "ApprovedAt",
                table: "Vehicles",
                newName: "approved_at");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleImages",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "VehicleImages",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "SortOrder",
                table: "VehicleImages",
                newName: "sort_order");

            migrationBuilder.RenameColumn(
                name: "IsPrimary",
                table: "VehicleImages",
                newName: "is_primary");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "VehicleImages",
                newName: "image_url");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "VehicleImages",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Verified",
                table: "VehicleDocuments",
                newName: "verified");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleDocuments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "VehicleDocuments",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "FileUrl",
                table: "VehicleDocuments",
                newName: "file_url");

            migrationBuilder.RenameColumn(
                name: "ExpiryDate",
                table: "VehicleDocuments",
                newName: "expiry_date");

            migrationBuilder.RenameColumn(
                name: "DocType",
                table: "VehicleDocuments",
                newName: "doc_type");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "VehicleDocuments",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "UserSessions",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserSessions",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UserAgent",
                table: "UserSessions",
                newName: "user_agent");

            migrationBuilder.RenameColumn(
                name: "LastHeartbeatAt",
                table: "UserSessions",
                newName: "last_heartbeat_at");

            migrationBuilder.RenameColumn(
                name: "IpAddress",
                table: "UserSessions",
                newName: "ip_address");

            migrationBuilder.RenameColumn(
                name: "DisconnectedAt",
                table: "UserSessions",
                newName: "disconnected_at");

            migrationBuilder.RenameColumn(
                name: "DeviceType",
                table: "UserSessions",
                newName: "device_type");

            migrationBuilder.RenameColumn(
                name: "ConnectionId",
                table: "UserSessions",
                newName: "connection_id");

            migrationBuilder.RenameColumn(
                name: "ConnectedAt",
                table: "UserSessions",
                newName: "connected_at");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Users",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Phone",
                table: "Users",
                newName: "phone");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Users",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "Users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "LastSeenAt",
                table: "Users",
                newName: "last_seen_at");

            migrationBuilder.RenameColumn(
                name: "LastLoginAt",
                table: "Users",
                newName: "last_login_at");

            migrationBuilder.RenameColumn(
                name: "IsOnline",
                table: "Users",
                newName: "is_online");

            migrationBuilder.RenameColumn(
                name: "IsEmailVerified",
                table: "Users",
                newName: "is_email_verified");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Users",
                newName: "full_name");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Users",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "AvatarUrl",
                table: "Users",
                newName: "avatar_url");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "UserRoles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserRoles",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "RoleId",
                table: "UserRoles",
                newName: "role_id");

            migrationBuilder.RenameColumn(
                name: "AssignedBy",
                table: "UserRoles",
                newName: "assigned_by");

            migrationBuilder.RenameColumn(
                name: "AssignedAt",
                table: "UserRoles",
                newName: "assigned_at");

            migrationBuilder.RenameColumn(
                name: "Tier",
                table: "TrustScores",
                newName: "tier");

            migrationBuilder.RenameColumn(
                name: "Score",
                table: "TrustScores",
                newName: "score");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "TrustScores",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "TrustScores",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "ReportCount",
                table: "TrustScores",
                newName: "report_count");

            migrationBuilder.RenameColumn(
                name: "LastCalculatedAt",
                table: "TrustScores",
                newName: "last_calculated_at");

            migrationBuilder.RenameColumn(
                name: "CompletedTrips",
                table: "TrustScores",
                newName: "completed_trips");

            migrationBuilder.RenameColumn(
                name: "CancellationCount",
                table: "TrustScores",
                newName: "cancellation_count");

            migrationBuilder.RenameColumn(
                name: "AverageRating",
                table: "TrustScores",
                newName: "average_rating");

            migrationBuilder.RenameColumn(
                name: "Message",
                table: "TicketMessages",
                newName: "message");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "TicketMessages",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "TicketId",
                table: "TicketMessages",
                newName: "ticket_id");

            migrationBuilder.RenameColumn(
                name: "SenderId",
                table: "TicketMessages",
                newName: "sender_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "TicketMessages",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "AttachmentUrls",
                table: "TicketMessages",
                newName: "attachment_urls");

            migrationBuilder.RenameColumn(
                name: "Subject",
                table: "SupportTickets",
                newName: "subject");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "SupportTickets",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Priority",
                table: "SupportTickets",
                newName: "priority");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "SupportTickets",
                newName: "category");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "SupportTickets",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "SupportTickets",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "TicketNumber",
                table: "SupportTickets",
                newName: "ticket_number");

            migrationBuilder.RenameColumn(
                name: "ResolvedAt",
                table: "SupportTickets",
                newName: "resolved_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "SupportTickets",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "AssignedStaffId",
                table: "SupportTickets",
                newName: "assigned_staff_id");

            migrationBuilder.RenameColumn(
                name: "Department",
                table: "StaffProfiles",
                newName: "department");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "StaffProfiles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "StaffProfiles",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "SupervisorId",
                table: "StaffProfiles",
                newName: "supervisor_id");

            migrationBuilder.RenameColumn(
                name: "EmployeeCode",
                table: "StaffProfiles",
                newName: "employee_code");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Roles",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Roles",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Roles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PermissionId",
                table: "RolePermissions",
                newName: "permission_id");

            migrationBuilder.RenameColumn(
                name: "RoleId",
                table: "RolePermissions",
                newName: "role_id");

            migrationBuilder.RenameColumn(
                name: "Rating",
                table: "Reviews",
                newName: "rating");

            migrationBuilder.RenameColumn(
                name: "Comment",
                table: "Reviews",
                newName: "comment");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Reviews",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "Reviews",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "SupportScore",
                table: "Reviews",
                newName: "support_score");

            migrationBuilder.RenameColumn(
                name: "ReviewerId",
                table: "Reviews",
                newName: "reviewer_id");

            migrationBuilder.RenameColumn(
                name: "RevieweeId",
                table: "Reviews",
                newName: "reviewee_id");

            migrationBuilder.RenameColumn(
                name: "IsPublic",
                table: "Reviews",
                newName: "is_public");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Reviews",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "CleanlinessScore",
                table: "Reviews",
                newName: "cleanliness_score");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "Reviews",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "AccuracyScore",
                table: "Reviews",
                newName: "accuracy_score");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Reports",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Reports",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Reports",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ReporterId",
                table: "Reports",
                newName: "reporter_id");

            migrationBuilder.RenameColumn(
                name: "ReportType",
                table: "Reports",
                newName: "report_type");

            migrationBuilder.RenameColumn(
                name: "EvidenceUrls",
                table: "Reports",
                newName: "evidence_urls");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Reports",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "Reports",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "RefreshTokens",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "RefreshTokens",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "TokenHash",
                table: "RefreshTokens",
                newName: "token_hash");

            migrationBuilder.RenameColumn(
                name: "RevokedAt",
                table: "RefreshTokens",
                newName: "revoked_at");

            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                table: "RefreshTokens",
                newName: "expires_at");

            migrationBuilder.RenameColumn(
                name: "DeviceInfo",
                table: "RefreshTokens",
                newName: "device_info");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "RefreshTokens",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Priority",
                table: "PricingRules",
                newName: "priority");

            migrationBuilder.RenameColumn(
                name: "Multiplier",
                table: "PricingRules",
                newName: "multiplier");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "PricingRules",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "PricingRules",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "PricingRules",
                newName: "start_date");

            migrationBuilder.RenameColumn(
                name: "RuleType",
                table: "PricingRules",
                newName: "rule_type");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "PricingRules",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "FixedPrice",
                table: "PricingRules",
                newName: "fixed_price");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "PricingRules",
                newName: "end_date");

            migrationBuilder.RenameColumn(
                name: "Priority",
                table: "PlatformFeeRules",
                newName: "priority");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "PlatformFeeRules",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "PlatformFeeRules",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "PlatformFeeRules",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "TargetType",
                table: "PlatformFeeRules",
                newName: "target_type");

            migrationBuilder.RenameColumn(
                name: "TargetId",
                table: "PlatformFeeRules",
                newName: "target_id");

            migrationBuilder.RenameColumn(
                name: "StartAt",
                table: "PlatformFeeRules",
                newName: "start_at");

            migrationBuilder.RenameColumn(
                name: "MinFee",
                table: "PlatformFeeRules",
                newName: "min_fee");

            migrationBuilder.RenameColumn(
                name: "MaxFee",
                table: "PlatformFeeRules",
                newName: "max_fee");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "PlatformFeeRules",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "FeeValue",
                table: "PlatformFeeRules",
                newName: "fee_value");

            migrationBuilder.RenameColumn(
                name: "FeeType",
                table: "PlatformFeeRules",
                newName: "fee_type");

            migrationBuilder.RenameColumn(
                name: "EndAt",
                table: "PlatformFeeRules",
                newName: "end_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "PlatformFeeRules",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "Permissions",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "Permissions",
                newName: "code");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Permissions",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Payments",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Payments",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "Payments",
                newName: "note");

            migrationBuilder.RenameColumn(
                name: "Gateway",
                table: "Payments",
                newName: "gateway");

            migrationBuilder.RenameColumn(
                name: "Currency",
                table: "Payments",
                newName: "currency");

            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "Payments",
                newName: "amount");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Payments",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PayerId",
                table: "Payments",
                newName: "payer_id");

            migrationBuilder.RenameColumn(
                name: "PaidAt",
                table: "Payments",
                newName: "paid_at");

            migrationBuilder.RenameColumn(
                name: "IdempotencyKey",
                table: "Payments",
                newName: "idempotency_key");

            migrationBuilder.RenameColumn(
                name: "GatewayTransactionId",
                table: "Payments",
                newName: "gateway_transaction_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Payments",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "Payments",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Tier",
                table: "OwnerProfiles",
                newName: "tier");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "OwnerProfiles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "OwnerProfiles",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "TotalTrips",
                table: "OwnerProfiles",
                newName: "total_trips");

            migrationBuilder.RenameColumn(
                name: "IsVerified",
                table: "OwnerProfiles",
                newName: "is_verified");

            migrationBuilder.RenameColumn(
                name: "CommissionRate",
                table: "OwnerProfiles",
                newName: "commission_rate");

            migrationBuilder.RenameColumn(
                name: "BankName",
                table: "OwnerProfiles",
                newName: "bank_name");

            migrationBuilder.RenameColumn(
                name: "BankAccountNumber",
                table: "OwnerProfiles",
                newName: "bank_account_number");

            migrationBuilder.RenameColumn(
                name: "AverageRating",
                table: "OwnerProfiles",
                newName: "average_rating");

            migrationBuilder.RenameColumn(
                name: "Purpose",
                table: "OtpCodes",
                newName: "purpose");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "OtpCodes",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Attempts",
                table: "OtpCodes",
                newName: "attempts");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "OtpCodes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "OtpCodes",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UsedAt",
                table: "OtpCodes",
                newName: "used_at");

            migrationBuilder.RenameColumn(
                name: "OtpCodeHash",
                table: "OtpCodes",
                newName: "otp_code_hash");

            migrationBuilder.RenameColumn(
                name: "IsUsed",
                table: "OtpCodes",
                newName: "is_used");

            migrationBuilder.RenameColumn(
                name: "IpAddress",
                table: "OtpCodes",
                newName: "ip_address");

            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                table: "OtpCodes",
                newName: "expires_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "OtpCodes",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "Notifications",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "Notifications",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "Channel",
                table: "Notifications",
                newName: "channel");

            migrationBuilder.RenameColumn(
                name: "Body",
                table: "Notifications",
                newName: "body");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Notifications",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "Notifications",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "SentAt",
                table: "Notifications",
                newName: "sent_at");

            migrationBuilder.RenameColumn(
                name: "ReadAt",
                table: "Notifications",
                newName: "read_at");

            migrationBuilder.RenameColumn(
                name: "IsRead",
                table: "Notifications",
                newName: "is_read");

            migrationBuilder.RenameColumn(
                name: "DataJson",
                table: "Notifications",
                newName: "data_json");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Notifications",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "NotificationPreferences",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ZaloEnabled",
                table: "NotificationPreferences",
                newName: "zalo_enabled");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "NotificationPreferences",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "NotificationPreferences",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "SmsEnabled",
                table: "NotificationPreferences",
                newName: "sms_enabled");

            migrationBuilder.RenameColumn(
                name: "QuietHoursStart",
                table: "NotificationPreferences",
                newName: "quiet_hours_start");

            migrationBuilder.RenameColumn(
                name: "QuietHoursEnd",
                table: "NotificationPreferences",
                newName: "quiet_hours_end");

            migrationBuilder.RenameColumn(
                name: "InAppEnabled",
                table: "NotificationPreferences",
                newName: "in_app_enabled");

            migrationBuilder.RenameColumn(
                name: "EmailEnabled",
                table: "NotificationPreferences",
                newName: "email_enabled");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "MLPredictionLogs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "TopRiskFactors",
                table: "MLPredictionLogs",
                newName: "top_risk_factors");

            migrationBuilder.RenameColumn(
                name: "RiskScore",
                table: "MLPredictionLogs",
                newName: "risk_score");

            migrationBuilder.RenameColumn(
                name: "ModelVersion",
                table: "MLPredictionLogs",
                newName: "model_version");

            migrationBuilder.RenameColumn(
                name: "FeatureSnapshot",
                table: "MLPredictionLogs",
                newName: "feature_snapshot");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "MLPredictionLogs",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "MLPredictionLogs",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "InspectionReports",
                newName: "type");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "InspectionReports",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "StaffId",
                table: "InspectionReports",
                newName: "staff_id");

            migrationBuilder.RenameColumn(
                name: "ReportPdfUrl",
                table: "InspectionReports",
                newName: "report_pdf_url");

            migrationBuilder.RenameColumn(
                name: "OdometerKm",
                table: "InspectionReports",
                newName: "odometer_km");

            migrationBuilder.RenameColumn(
                name: "FuelLevel",
                table: "InspectionReports",
                newName: "fuel_level");

            migrationBuilder.RenameColumn(
                name: "DamageNoted",
                table: "InspectionReports",
                newName: "damage_noted");

            migrationBuilder.RenameColumn(
                name: "DamageDescription",
                table: "InspectionReports",
                newName: "damage_description");

            migrationBuilder.RenameColumn(
                name: "CustomerSignatureUrl",
                table: "InspectionReports",
                newName: "customer_signature_url");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "InspectionReports",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "InspectionReports",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "FeatureFlags",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "FeatureFlags",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "FeatureFlags",
                newName: "updated_by");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "FeatureFlags",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "RolloutPercent",
                table: "FeatureFlags",
                newName: "rollout_percent");

            migrationBuilder.RenameColumn(
                name: "IsEnabled",
                table: "FeatureFlags",
                newName: "is_enabled");

            migrationBuilder.RenameColumn(
                name: "FlagKey",
                table: "FeatureFlags",
                newName: "flag_key");

            migrationBuilder.RenameColumn(
                name: "AllowedRoles",
                table: "FeatureFlags",
                newName: "allowed_roles");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Disputes",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Resolution",
                table: "Disputes",
                newName: "resolution");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Disputes",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ResolvedAt",
                table: "Disputes",
                newName: "resolved_at");

            migrationBuilder.RenameColumn(
                name: "ReportId",
                table: "Disputes",
                newName: "report_id");

            migrationBuilder.RenameColumn(
                name: "OpenedBy",
                table: "Disputes",
                newName: "opened_by");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Disputes",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "CompensationAmount",
                table: "Disputes",
                newName: "compensation_amount");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "Disputes",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "AssignedStaffId",
                table: "Disputes",
                newName: "assigned_staff_id");

            migrationBuilder.RenameColumn(
                name: "District",
                table: "DemandForecasts",
                newName: "district");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "DemandForecasts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleType",
                table: "DemandForecasts",
                newName: "vehicle_type");

            migrationBuilder.RenameColumn(
                name: "PredictedDemand",
                table: "DemandForecasts",
                newName: "predicted_demand");

            migrationBuilder.RenameColumn(
                name: "ModelVersion",
                table: "DemandForecasts",
                newName: "model_version");

            migrationBuilder.RenameColumn(
                name: "ForecastDate",
                table: "DemandForecasts",
                newName: "forecast_date");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "DemandForecasts",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "Address",
                table: "CustomerProfiles",
                newName: "address");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "CustomerProfiles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "CustomerProfiles",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "PreferredVehicleType",
                table: "CustomerProfiles",
                newName: "preferred_vehicle_type");

            migrationBuilder.RenameColumn(
                name: "NationalIdVerified",
                table: "CustomerProfiles",
                newName: "national_id_verified");

            migrationBuilder.RenameColumn(
                name: "NationalId",
                table: "CustomerProfiles",
                newName: "national_id");

            migrationBuilder.RenameColumn(
                name: "DriverLicenseVerified",
                table: "CustomerProfiles",
                newName: "driver_license_verified");

            migrationBuilder.RenameColumn(
                name: "DriverLicenseNumber",
                table: "CustomerProfiles",
                newName: "driver_license_number");

            migrationBuilder.RenameColumn(
                name: "DateOfBirth",
                table: "CustomerProfiles",
                newName: "date_of_birth");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Contracts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PdfUrl",
                table: "Contracts",
                newName: "pdf_url");

            migrationBuilder.RenameColumn(
                name: "OwnerSignedAt",
                table: "Contracts",
                newName: "owner_signed_at");

            migrationBuilder.RenameColumn(
                name: "CustomerSignedAt",
                table: "Contracts",
                newName: "customer_signed_at");

            migrationBuilder.RenameColumn(
                name: "CustomerSignatureData",
                table: "Contracts",
                newName: "customer_signature_data");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Contracts",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ContractNumber",
                table: "Contracts",
                newName: "contract_number");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "Contracts",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "CheckInOutImages",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UploadedBy",
                table: "CheckInOutImages",
                newName: "uploaded_by");

            migrationBuilder.RenameColumn(
                name: "InspectionId",
                table: "CheckInOutImages",
                newName: "inspection_id");

            migrationBuilder.RenameColumn(
                name: "ImageUrl",
                table: "CheckInOutImages",
                newName: "image_url");

            migrationBuilder.RenameColumn(
                name: "ImageType",
                table: "CheckInOutImages",
                newName: "image_type");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "CheckInOutImages",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "CheckInOutImages",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "CashbackRules",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "CashbackRules",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "TrustTier",
                table: "CashbackRules",
                newName: "trust_tier");

            migrationBuilder.RenameColumn(
                name: "MinDepositReduction",
                table: "CashbackRules",
                newName: "min_deposit_reduction");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "CashbackRules",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CashbackPercent",
                table: "CashbackRules",
                newName: "cashback_percent");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Bookings",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Bookings",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "Bookings",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Bookings",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "TotalDays",
                table: "Bookings",
                newName: "total_days");

            migrationBuilder.RenameColumn(
                name: "TotalAmount",
                table: "Bookings",
                newName: "total_amount");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "Bookings",
                newName: "start_date");

            migrationBuilder.RenameColumn(
                name: "RiskScore",
                table: "Bookings",
                newName: "risk_score");

            migrationBuilder.RenameColumn(
                name: "ReturnAddress",
                table: "Bookings",
                newName: "return_address");

            migrationBuilder.RenameColumn(
                name: "PlatformFeeValue",
                table: "Bookings",
                newName: "platform_fee_value");

            migrationBuilder.RenameColumn(
                name: "PlatformFeeType",
                table: "Bookings",
                newName: "platform_fee_type");

            migrationBuilder.RenameColumn(
                name: "PlatformFeeRuleId",
                table: "Bookings",
                newName: "platform_fee_rule_id");

            migrationBuilder.RenameColumn(
                name: "PlatformFee",
                table: "Bookings",
                newName: "platform_fee");

            migrationBuilder.RenameColumn(
                name: "PickupAddress",
                table: "Bookings",
                newName: "pickup_address");

            migrationBuilder.RenameColumn(
                name: "OwnerId",
                table: "Bookings",
                newName: "owner_id");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "Bookings",
                newName: "end_date");

            migrationBuilder.RenameColumn(
                name: "DepositAmount",
                table: "Bookings",
                newName: "deposit_amount");

            migrationBuilder.RenameColumn(
                name: "CustomerNote",
                table: "Bookings",
                newName: "customer_note");

            migrationBuilder.RenameColumn(
                name: "CustomerId",
                table: "Bookings",
                newName: "customer_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "Bookings",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "CancelledBy",
                table: "Bookings",
                newName: "cancelled_by");

            migrationBuilder.RenameColumn(
                name: "CancelledAt",
                table: "Bookings",
                newName: "cancelled_at");

            migrationBuilder.RenameColumn(
                name: "CancelReason",
                table: "Bookings",
                newName: "cancel_reason");

            migrationBuilder.RenameColumn(
                name: "BookingCode",
                table: "Bookings",
                newName: "booking_code");

            migrationBuilder.RenameColumn(
                name: "BasePrice",
                table: "Bookings",
                newName: "base_price");

            migrationBuilder.RenameColumn(
                name: "Reason",
                table: "BlockedDates",
                newName: "reason");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "BlockedDates",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "BlockedDates",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                table: "BlockedDates",
                newName: "start_date");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                table: "BlockedDates",
                newName: "end_date");

            migrationBuilder.RenameColumn(
                name: "Action",
                table: "AuditLogs",
                newName: "action");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "AuditLogs",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserAgent",
                table: "AuditLogs",
                newName: "user_agent");

            migrationBuilder.RenameColumn(
                name: "OldValue",
                table: "AuditLogs",
                newName: "old_value");

            migrationBuilder.RenameColumn(
                name: "NewValue",
                table: "AuditLogs",
                newName: "new_value");

            migrationBuilder.RenameColumn(
                name: "IpAddress",
                table: "AuditLogs",
                newName: "ip_address");

            migrationBuilder.RenameColumn(
                name: "EntityType",
                table: "AuditLogs",
                newName: "entity_type");

            migrationBuilder.RenameColumn(
                name: "EntityId",
                table: "AuditLogs",
                newName: "entity_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "AuditLogs",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ActorRole",
                table: "AuditLogs",
                newName: "actor_role");

            migrationBuilder.RenameColumn(
                name: "ActorId",
                table: "AuditLogs",
                newName: "actor_id");

            migrationBuilder.RenameColumn(
                name: "Value",
                table: "AspNetUserTokens",
                newName: "value");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "AspNetUserTokens",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "LoginProvider",
                table: "AspNetUserTokens",
                newName: "login_provider");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AspNetUserTokens",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "AspNetUsers",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "AspNetUsers",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserName",
                table: "AspNetUsers",
                newName: "user_name");

            migrationBuilder.RenameColumn(
                name: "TwoFactorEnabled",
                table: "AspNetUsers",
                newName: "two_factor_enabled");

            migrationBuilder.RenameColumn(
                name: "SecurityStamp",
                table: "AspNetUsers",
                newName: "security_stamp");

            migrationBuilder.RenameColumn(
                name: "PhoneNumberConfirmed",
                table: "AspNetUsers",
                newName: "phone_number_confirmed");

            migrationBuilder.RenameColumn(
                name: "PhoneNumber",
                table: "AspNetUsers",
                newName: "phone_number");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "AspNetUsers",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "NormalizedUserName",
                table: "AspNetUsers",
                newName: "normalized_user_name");

            migrationBuilder.RenameColumn(
                name: "NormalizedEmail",
                table: "AspNetUsers",
                newName: "normalized_email");

            migrationBuilder.RenameColumn(
                name: "LockoutEnd",
                table: "AspNetUsers",
                newName: "lockout_end");

            migrationBuilder.RenameColumn(
                name: "LockoutEnabled",
                table: "AspNetUsers",
                newName: "lockout_enabled");

            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "AspNetUsers",
                newName: "full_name");

            migrationBuilder.RenameColumn(
                name: "EmailConfirmed",
                table: "AspNetUsers",
                newName: "email_confirmed");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "AspNetUsers",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ConcurrencyStamp",
                table: "AspNetUsers",
                newName: "concurrency_stamp");

            migrationBuilder.RenameColumn(
                name: "AccessFailedCount",
                table: "AspNetUsers",
                newName: "access_failed_count");

            migrationBuilder.RenameColumn(
                name: "RoleId",
                table: "AspNetUserRoles",
                newName: "role_id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AspNetUserRoles",
                newName: "user_id");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                newName: "IX_AspNetUserRoles_role_id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AspNetUserLogins",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "ProviderDisplayName",
                table: "AspNetUserLogins",
                newName: "provider_display_name");

            migrationBuilder.RenameColumn(
                name: "ProviderKey",
                table: "AspNetUserLogins",
                newName: "provider_key");

            migrationBuilder.RenameColumn(
                name: "LoginProvider",
                table: "AspNetUserLogins",
                newName: "login_provider");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                newName: "IX_AspNetUserLogins_user_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "AspNetUserClaims",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "AspNetUserClaims",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "ClaimValue",
                table: "AspNetUserClaims",
                newName: "claim_value");

            migrationBuilder.RenameColumn(
                name: "ClaimType",
                table: "AspNetUserClaims",
                newName: "claim_type");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                newName: "IX_AspNetUserClaims_user_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "AspNetRoles",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "AspNetRoles",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "NormalizedName",
                table: "AspNetRoles",
                newName: "normalized_name");

            migrationBuilder.RenameColumn(
                name: "ConcurrencyStamp",
                table: "AspNetRoles",
                newName: "concurrency_stamp");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "AspNetRoleClaims",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "RoleId",
                table: "AspNetRoleClaims",
                newName: "role_id");

            migrationBuilder.RenameColumn(
                name: "ClaimValue",
                table: "AspNetRoleClaims",
                newName: "claim_value");

            migrationBuilder.RenameColumn(
                name: "ClaimType",
                table: "AspNetRoleClaims",
                newName: "claim_type");

            migrationBuilder.RenameIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                newName: "IX_AspNetRoleClaims_role_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehiclePricing",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "VehiclePricing",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "PricingMode",
                table: "VehiclePricing",
                newName: "pricing_mode");

            migrationBuilder.RenameColumn(
                name: "LastUpdatedAt",
                table: "VehiclePricing",
                newName: "last_updated_at");

            migrationBuilder.RenameColumn(
                name: "LastCalculatedAt",
                table: "VehiclePricing",
                newName: "last_calculated_at");

            migrationBuilder.RenameColumn(
                name: "FixedPricePerDay",
                table: "VehiclePricing",
                newName: "fixed_price_per_day");

            migrationBuilder.RenameColumn(
                name: "CurrentPricePerDay",
                table: "VehiclePricing",
                newName: "current_price_per_day");

            migrationBuilder.RenameColumn(
                name: "AutoMinPrice",
                table: "VehiclePricing",
                newName: "auto_min_price");

            migrationBuilder.RenameColumn(
                name: "AutoMaxPrice",
                table: "VehiclePricing",
                newName: "auto_max_price");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "VehicleModel",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleModel",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "VehicleModel",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "BrandId",
                table: "VehicleModel",
                newName: "brand_id");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleModelPricing",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "YearTo",
                table: "VehicleModelPricing",
                newName: "year_to");

            migrationBuilder.RenameColumn(
                name: "YearFrom",
                table: "VehicleModelPricing",
                newName: "year_from");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "VehicleModelPricing",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "SuggestedMinPrice",
                table: "VehicleModelPricing",
                newName: "suggested_min_price");

            migrationBuilder.RenameColumn(
                name: "SuggestedMaxPrice",
                table: "VehicleModelPricing",
                newName: "suggested_max_price");

            migrationBuilder.RenameColumn(
                name: "PricingRegionId",
                table: "VehicleModelPricing",
                newName: "pricing_region_id");

            migrationBuilder.RenameColumn(
                name: "ModelId",
                table: "VehicleModelPricing",
                newName: "model_id");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "VehicleModelPricing",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "VehicleModelPricing",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "BasePrice",
                table: "VehicleModelPricing",
                newName: "base_price");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "VehicleFeature",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleFeature",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleType",
                table: "VehicleFeature",
                newName: "vehicle_type");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "VehicleFeature",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "FeatureId",
                table: "VehicleFeatureMapping",
                newName: "feature_id");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "VehicleFeatureMapping",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "VehicleBrand",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "VehicleBrand",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "VehicleType",
                table: "VehicleBrand",
                newName: "vehicle_type");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "VehicleBrand",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "SystemConfig",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "SystemConfig",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "SystemConfig",
                newName: "updated_by");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "SystemConfig",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "DataType",
                table: "SystemConfig",
                newName: "data_type");

            migrationBuilder.RenameColumn(
                name: "ConfigValue",
                table: "SystemConfig",
                newName: "config_value");

            migrationBuilder.RenameColumn(
                name: "ConfigKey",
                table: "SystemConfig",
                newName: "config_key");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "PricingRegion",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "PricingRegion",
                newName: "code");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "PricingRegion",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "PricingRegion",
                newName: "is_active");

            migrationBuilder.RenameColumn(
                name: "EngineCapacity",
                table: "MotorbikeDetail",
                newName: "engine_capacity");

            migrationBuilder.RenameColumn(
                name: "BikeType",
                table: "MotorbikeDetail",
                newName: "bike_type");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "MotorbikeDetail",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "Transmission",
                table: "CarDetail",
                newName: "transmission");

            migrationBuilder.RenameColumn(
                name: "Drivetrain",
                table: "CarDetail",
                newName: "drivetrain");

            migrationBuilder.RenameColumn(
                name: "SeatCount",
                table: "CarDetail",
                newName: "seat_count");

            migrationBuilder.RenameColumn(
                name: "FuelType",
                table: "CarDetail",
                newName: "fuel_type");

            migrationBuilder.RenameColumn(
                name: "BodyType",
                table: "CarDetail",
                newName: "body_type");

            migrationBuilder.RenameColumn(
                name: "VehicleId",
                table: "CarDetail",
                newName: "vehicle_id");

            migrationBuilder.RenameColumn(
                name: "Note",
                table: "BookingStatusHistory",
                newName: "note");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "BookingStatusHistory",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "ToStatus",
                table: "BookingStatusHistory",
                newName: "to_status");

            migrationBuilder.RenameColumn(
                name: "FromStatus",
                table: "BookingStatusHistory",
                newName: "from_status");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "BookingStatusHistory",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "ChangedBy",
                table: "BookingStatusHistory",
                newName: "changed_by");

            migrationBuilder.RenameColumn(
                name: "BookingId",
                table: "BookingStatusHistory",
                newName: "booking_id");

            migrationBuilder.RenameColumn(
                name: "Province",
                table: "Area",
                newName: "province");

            migrationBuilder.RenameColumn(
                name: "District",
                table: "Area",
                newName: "district");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Area",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "PricingRegionId",
                table: "Area",
                newName: "pricing_region_id");

            migrationBuilder.RenameColumn(
                name: "IsActive",
                table: "Area",
                newName: "is_active");

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
                name: "balance_after",
                table: "WalletTransactions",
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
                name: "price_per_day",
                table: "Vehicles",
                type: "numeric(15,2)",
                precision: 15,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

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

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "MotorbikeDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AlterColumn<long>(
                name: "vehicle_id",
                table: "CarDetail",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint")
                .OldAnnotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn);

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehiclePricing",
                table: "VehiclePricing",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleModel",
                table: "VehicleModel",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleModelPricing",
                table: "VehicleModelPricing",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleFeature",
                table: "VehicleFeature",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleFeatureMapping",
                table: "VehicleFeatureMapping",
                columns: new[] { "vehicle_id", "feature_id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_VehicleBrand",
                table: "VehicleBrand",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SystemConfig",
                table: "SystemConfig",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PricingRegion",
                table: "PricingRegion",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_MotorbikeDetail",
                table: "MotorbikeDetail",
                column: "vehicle_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CarDetail",
                table: "CarDetail",
                column: "vehicle_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_BookingStatusHistory",
                table: "BookingStatusHistory",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Area",
                table: "Area",
                column: "id");

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
                name: "IX_VehicleImages_vehicle_id",
                table: "VehicleImages",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleDocuments_vehicle_id",
                table: "VehicleDocuments",
                column: "vehicle_id");

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
                name: "IX_VehiclePricing_vehicle_id",
                table: "VehiclePricing",
                column: "vehicle_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleModel_brand_id_name",
                table: "VehicleModel",
                columns: new[] { "brand_id", "name" },
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
                name: "IX_VehicleFeature_name_vehicle_type",
                table: "VehicleFeature",
                columns: new[] { "name", "vehicle_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VehicleFeatureMapping_feature_id",
                table: "VehicleFeatureMapping",
                column: "feature_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehicleBrand_name",
                table: "VehicleBrand",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SystemConfig_config_key",
                table: "SystemConfig",
                column: "config_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PricingRegion_code",
                table: "PricingRegion",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingStatusHistory_booking_id",
                table: "BookingStatusHistory",
                column: "booking_id");

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
                name: "FK_AspNetRoleClaims_AspNetRoles_role_id",
                table: "AspNetRoleClaims",
                column: "role_id",
                principalTable: "AspNetRoles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserClaims_AspNetUsers_user_id",
                table: "AspNetUserClaims",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserLogins_AspNetUsers_user_id",
                table: "AspNetUserLogins",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserRoles_AspNetRoles_role_id",
                table: "AspNetUserRoles",
                column: "role_id",
                principalTable: "AspNetRoles",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserRoles_AspNetUsers_user_id",
                table: "AspNetUserRoles",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUserTokens_AspNetUsers_user_id",
                table: "AspNetUserTokens",
                column: "user_id",
                principalTable: "AspNetUsers",
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
