import { Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import AccountPage from "@/pages/account/AccountPage";
import ChangePasswordPage from "@/pages/account/ChangePasswordPage";
import LogoutPage from "@/pages/account/LogoutPage";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminVehicleCatalogPage from "@/pages/admin/AdminVehicleCatalogPage";
import AdminVehicleBrandsPage from "@/pages/admin/AdminVehicleBrandsPage";
import AdminVehicleModelsPage from "@/pages/admin/AdminVehicleModelsPage";
import AdminCarVariantsPage from "@/pages/admin/AdminCarVariantsPage";
import AdminMotorbikeVariantsPage from "@/pages/admin/AdminMotorbikeVariantsPage";
import AdminDriverLicenseClassesPage from "@/pages/admin/AdminDriverLicenseClassesPage";
import AdminVehicleFeaturesPage from "@/pages/admin/AdminVehicleFeaturesPage";
import AdminPricingRegionsPage from "@/pages/admin/AdminPricingRegionsPage";
import AdminAreasPage from "@/pages/admin/AdminAreasPage";
import AdminVehicleModelPricingsPage from "@/pages/admin/AdminVehicleModelPricingsPage";
import AdminPricingRulesPage from "@/pages/admin/AdminPricingRulesPage";
import AdminPlatformFeeRulesPage from "@/pages/admin/AdminPlatformFeeRulesPage";
import AdminVehiclesPage from "@/pages/admin/AdminVehiclesPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import OwnerRegisterPage from "@/pages/auth/OwnerRegisterPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import BankInfoPage from "@/pages/customer/BankInfoPage";
import BecomeOwnerPage from "@/pages/customer/BecomeOwnerPage";
import CccdVerificationPage from "@/pages/customer/CccdVerificationPage";
import OwnerPendingPage from "@/pages/customer/OwnerPendingPage";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OwnerHomePage from "@/pages/owner/OwnerHomePage";
import OwnerVehicleListPage from "@/pages/owner/OwnerVehicleListPage";
import OwnerVehicleDetailPage from "@/pages/owner/OwnerVehicleDetailPage";
import OwnerVehicleAddPage from "@/pages/owner/OwnerVehicleAddPage";
import OwnerVehicleEditPage from "@/pages/owner/OwnerVehicleEditPage";
import HomePage from "@/pages/public/HomePage";
import VehicleListPage from "@/pages/public/VehicleListPage";
import VehicleDetailPage from "@/pages/public/VehicleDetailPage";
import StaffHomePage from "@/pages/staff/StaffHomePage";
import StaffVehiclesPage from "@/pages/staff/StaffVehiclesPage";
import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/xe" element={<VehicleListPage />} />
        <Route path="/xe/:id" element={<VehicleDetailPage />} />
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
          <Route path="/account" element={<AccountPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/khong-co-quyen" element={<ForbiddenPage />} />

          <Route element={<RoleRoute roles={["Customer"]} />}>
            <Route path="/customer" element={<CustomerHomePage />} />
            <Route path="/become-owner" element={<BecomeOwnerPage />} />
            <Route path="/become-owner/cccd" element={<CccdVerificationPage />} />
            <Route path="/become-owner/bank" element={<BankInfoPage />} />
            <Route path="/become-owner/pending" element={<OwnerPendingPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Owner"]} />}>
            <Route path="/owner" element={<OwnerHomePage />} />
            <Route path="/owner/vehicles" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/car" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/motorbike" element={<OwnerVehicleListPage />} />
            <Route path="/owner/vehicles/add" element={<OwnerVehicleAddPage />} />
            <Route path="/owner/vehicles/:id" element={<OwnerVehicleDetailPage />} />
            <Route path="/owner/vehicles/:id/edit" element={<OwnerVehicleEditPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Staff"]} />}>
            <Route path="/staff" element={<StaffHomePage />} />
            <Route path="/staff/vehicles" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicles/:id" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-documents" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-documents/:id" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-listings" element={<StaffVehiclesPage />} />
            <Route path="/staff/vehicle-listings/:id" element={<StaffVehiclesPage />} />
          </Route>

          <Route element={<RoleRoute roles={["Admin"]} />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/vehicles" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicles/:id" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-documents" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-documents/:id" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-listings" element={<AdminVehiclesPage />} />
            <Route path="/admin/vehicle-listings/:id" element={<AdminVehiclesPage />} />
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
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
