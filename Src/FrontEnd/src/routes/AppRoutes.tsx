import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import AccountPage from "@/pages/account/AccountPage";
import ProfilePage from "@/pages/account/ProfilePage";
import VerificationOverviewPage from "@/pages/account/VerificationOverviewPage";
import ChangePasswordPage from "@/pages/account/ChangePasswordPage";
import LogoutPage from "@/pages/account/LogoutPage";
import LoginSessionsPage from "@/pages/account/LoginSessionsPage";
import UnderDevelopment from "@/components/common/UnderDevelopment";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminCustomerListPage from "@/pages/admin/AdminCustomerListPage";
import AdminOwnerListPage from "@/pages/admin/AdminOwnerListPage";
import AdminStaffListPage from "@/pages/admin/AdminStaffListPage";
import AdminUserDetailPage from "@/pages/admin/AdminUserDetailPage";
import AdminModerationDashboardPage from "@/pages/admin/AdminModerationDashboardPage";
import AdminVehicleCatalogPage from "@/pages/admin/AdminVehicleCatalogPage";
import AdminVehicleBrandsPage from "@/pages/admin/AdminVehicleBrandsPage";
import AdminVehicleModelsPage from "@/pages/admin/AdminVehicleModelsPage";
import AdminCarVariantsPage from "@/pages/admin/AdminCarVariantsPage";
import AdminMotorbikeVariantsPage from "@/pages/admin/AdminMotorbikeVariantsPage";
import AdminDriverLicenseClassesPage from "@/pages/admin/AdminDriverLicenseClassesPage";
import AdminDriverLicenseVerificationsPage from "@/pages/admin/AdminDriverLicenseVerificationsPage";
import AdminNationalIdVerificationsPage from "@/pages/admin/AdminNationalIdVerificationsPage";
import AdminVehicleFeaturesPage from "@/pages/admin/AdminVehicleFeaturesPage";
import AdminPricingRegionsPage from "@/pages/admin/AdminPricingRegionsPage";
import AdminAreasPage from "@/pages/admin/AdminAreasPage";
import AdminVehicleModelPricingsPage from "@/pages/admin/AdminVehicleModelPricingsPage";
import AdminPricingRulesPage from "@/pages/admin/AdminPricingRulesPage";
import AdminPlatformFeeRulesPage from "@/pages/admin/AdminPlatformFeeRulesPage";
import AdminVehiclesPage from "@/pages/admin/AdminVehiclesPage";
import AdminWithdrawalsPage from "@/pages/admin/AdminWithdrawalsPage";
import AdminWalletsPage from "@/pages/admin/AdminWalletsPage";
import AdminBroadcastNotificationPage from "@/pages/admin/AdminBroadcastNotificationPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import OwnerRegisterPage from "@/pages/auth/OwnerRegisterPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import BankInfoPage from "@/pages/customer/BankInfoPage";
import WalletPage from "@/pages/account/WalletPage";
import BecomeOwnerPage from "@/pages/customer/BecomeOwnerPage";
import CccdVerificationPage from "@/pages/customer/CccdVerificationPage";
import DriverLicenseVerificationPage from "@/pages/customer/DriverLicenseVerificationPage";
import OwnerPendingPage from "@/pages/customer/OwnerPendingPage";
import BookingNewPage from "@/pages/booking/BookingNewPage";
import BookingListPage from "@/pages/booking/BookingListPage";
import BookingManagePage from "@/pages/booking/BookingManagePage";
import BookingDetailPage from "@/pages/booking/BookingDetailPage";
import ChatPage from "@/pages/chat/ChatPage";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import CustomerBookingDetailPage from "@/pages/customer/CustomerBookingDetailPage";
import CustomerBookingListPage from "@/pages/customer/CustomerBookingListPage";
import CustomerCreateBookingPage from "@/pages/customer/CustomerCreateBookingPage";
import CustomerSupportTicketDetailPage from "@/pages/customer/CustomerSupportTicketDetailPage";
import CustomerSupportTicketListPage from "@/pages/customer/CustomerSupportTicketListPage";
import DisputePage from "@/pages/disputes/DisputePage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OwnerHomePage from "@/pages/owner/OwnerHomePage";
import OwnerBookingDetailPage from "@/pages/owner/OwnerBookingDetailPage";
import OwnerBookingListPage from "@/pages/owner/OwnerBookingListPage";
import OwnerVehicleListPage from "@/pages/owner/OwnerVehicleListPage";
import OwnerVehicleDetailPage from "@/pages/owner/OwnerVehicleDetailPage";
import OwnerVehicleAddPage from "@/pages/owner/OwnerVehicleAddPage";
import OwnerVehicleEditPage from "@/pages/owner/OwnerVehicleEditPage";
import AboutPage from "@/pages/public/AboutPage";
import ForOwnersPage from "@/pages/public/ForOwnersPage";
import HomePage from "@/pages/public/HomePage";
import HowItWorksPage from "@/pages/public/HowItWorksPage";
import PrivacyPage from "@/pages/public/PrivacyPage";
import SupportPage from "@/pages/public/SupportPage";
import TermsPage from "@/pages/public/TermsPage";
import VehicleListPage from "@/pages/public/VehicleListPage";
import VehicleDetailPage from "@/pages/public/VehicleDetailPage";
import StaffHomePage from "@/pages/staff/StaffHomePage";
import StaffDriverLicenseVerificationsPage from "@/pages/staff/StaffDriverLicenseVerificationsPage";
import StaffNationalIdVerificationsPage from "@/pages/staff/StaffNationalIdVerificationsPage";
import StaffSupportTicketDetailPage from "@/pages/staff/StaffSupportTicketDetailPage";
import StaffSupportTicketListPage from "@/pages/staff/StaffSupportTicketListPage";
import StaffVehiclesPage from "@/pages/staff/StaffVehiclesPage";
import StaffModerationDashboardPage from "@/pages/staff/StaffModerationDashboardPage";
import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/vehicle" element={<VehicleListPage />} />
        <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/for-owners" element={<ForOwnersPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/booking/new" element={<BookingNewPage />} />
        <Route path="/booking/list" element={<BookingListPage />} />
        <Route path="/booking/manage" element={<BookingManagePage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-owner" element={<OwnerRegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Account - all roles */}
          <Route path="/account" element={<AccountPage />} />
          <Route path="/account/profile" element={<ProfilePage />} />
          <Route path="/account/bank" element={<BankInfoPage />} />
          <Route path="/account/verification" element={<VerificationOverviewPage />} />
          <Route path="/account/verification/cccd" element={<CccdVerificationPage />} />
          <Route path="/account/verification/drivers-license" element={<DriverLicenseVerificationPage />} />
          <Route path="/account/verification/national-id" element={<Navigate to="/account/verification/cccd" replace />} />
          <Route path="/account/security/password" element={<ChangePasswordPage />} />
          <Route path="/account/wallet" element={<WalletPage />} />
          <Route path="/account/security/sessions" element={<LoginSessionsPage />} />
          <Route path="/change-password" element={<Navigate to="/account/security/password" replace />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/khong-co-quyen" element={<ForbiddenPage />} />

          <Route element={<RoleRoute roles={["Customer", "Owner"]} />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/booking/:bookingId" element={<ChatPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Customer"]} />}>
            <Route path="/customer" element={<CustomerHomePage />} />
            <Route path="/customer/bookings" element={<CustomerBookingListPage />} />
            <Route path="/customer/bookings/new" element={<CustomerCreateBookingPage />} />
            <Route path="/customer/bookings/:id" element={<CustomerBookingDetailPage />} />
            <Route path="/customer/disputes" element={<DisputePage />} />
            <Route path="/customer/support-tickets" element={<CustomerSupportTicketListPage />} />
            <Route path="/customer/support-tickets/:id" element={<CustomerSupportTicketDetailPage />} />
            <Route path="/become-owner" element={<BecomeOwnerPage />} />
            <Route path="/become-owner/cccd" element={<CccdVerificationPage />} />
            <Route path="/become-owner/bank" element={<BankInfoPage />} />
            <Route path="/become-owner/pending" element={<OwnerPendingPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Owner"]} />}>
            <Route path="/owner" element={<OwnerHomePage />} />
            <Route path="/owner/bookings" element={<OwnerBookingListPage />} />
            <Route path="/owner/bookings/:id" element={<OwnerBookingDetailPage />} />
            <Route path="/owner/disputes" element={<DisputePage />} />
            <Route path="/owner/vehicles" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/car" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/motorbike" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/add" element={<OwnerVehicleAddPage />} />
            <Route path="/owner/vehicles/:id" element={<OwnerVehicleDetailPage />} />
            <Route path="/owner/vehicles/:id/edit" element={<OwnerVehicleEditPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Staff"]} />}>
            <Route path="/staff" element={<StaffHomePage />} />
            <Route path="/staff/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/staff/moderation" element={<StaffModerationDashboardPage />} />
            <Route path="/staff/vehicles" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicles/:id" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-documents" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-documents/:id" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-listings" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-listings/:id" element={<StaffVehiclesPage />} />
            <Route path="/staff/driver-license-verifications" element={<StaffDriverLicenseVerificationsPage />} />
            <Route path="/staff/national-id-verifications" element={<StaffNationalIdVerificationsPage />} />
            <Route path="/staff/disputes" element={<DisputePage />} />
            <Route path="/staff/support-tickets" element={<StaffSupportTicketListPage />} />
            <Route path="/staff/support-tickets/:id" element={<StaffSupportTicketDetailPage />} />
            <Route path="/staff/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/staff/wallets" element={<AdminWalletsPage />} />
            <Route path="/staff/broadcast" element={<AdminBroadcastNotificationPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Admin"]} />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/moderation" element={<AdminModerationDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/users/customers" element={<AdminCustomerListPage />} />
            <Route path="/admin/users/owners" element={<AdminOwnerListPage />} />
            <Route path="/admin/users/staffs" element={<AdminStaffListPage />} />
            <Route path="/admin/users/:id" element={<AdminUserDetailPage />} />
            <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicles/:id" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-documents" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-documents/:id" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-listings" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-listings/:id" element={<AdminVehiclesPage />} />
            <Route path="/admin/driver-license-verifications" element={<AdminDriverLicenseVerificationsPage />} />
            <Route path="/admin/national-id-verifications" element={<AdminNationalIdVerificationsPage />} />
            <Route path="/admin/disputes" element={<DisputePage />} />
            <Route path="/admin/vehicle-catalog" element={<AdminVehicleCatalogPage />} />
            <Route path="/admin/vehicle-brands" element={<AdminVehicleBrandsPage />} />
            <Route path="/admin/vehicle-models" element={<AdminVehicleModelsPage />} />
            <Route path="/admin/car-variants" element={<AdminCarVariantsPage />} />
            <Route path="/admin/motorbike-variants" element={<AdminMotorbikeVariantsPage />} />
            <Route path="/admin/driver-license-classes" element={<AdminDriverLicenseClassesPage />} />
            <Route path="/admin/vehicle-features" element={<AdminVehicleFeaturesPage />} />
            <Route path="/admin/pricing-regions" element={<AdminPricingRegionsPage />} />
            <Route path="/admin/areas" element={<AdminAreasPage />} />
            <Route path="/admin/vehicle-model-pricings" element={<AdminVehicleModelPricingsPage />} />
            <Route path="/admin/pricing-rules" element={<AdminPricingRulesPage />} />
            <Route path="/admin/platform-fee-rules" element={<AdminPlatformFeeRulesPage />} />
            <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
            <Route path="/admin/wallets" element={<AdminWalletsPage />} />
            <Route path="/admin/broadcast" element={<AdminBroadcastNotificationPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
