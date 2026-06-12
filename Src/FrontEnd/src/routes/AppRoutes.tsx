import { Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import AccountPage from "@/pages/account/AccountPage";
import ChangePasswordPage from "@/pages/account/ChangePasswordPage";
import LogoutPage from "@/pages/account/LogoutPage";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import VerifyEmailPage from "@/pages/auth/VerifyEmailPage";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import ForbiddenPage from "@/pages/ForbiddenPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OwnerHomePage from "@/pages/owner/OwnerHomePage";
import HomePage from "@/pages/public/HomePage";
import StaffHomePage from "@/pages/staff/StaffHomePage";
import GuestRoute from "@/routes/GuestRoute";
import ProtectedRoute from "@/routes/ProtectedRoute";
import RoleRoute from "@/routes/RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
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
          </Route>

          <Route element={<RoleRoute roles={["Owner"]} />}>
            <Route path="/owner" element={<OwnerHomePage />} />
          </Route>

          <Route element={<RoleRoute roles={["Staff"]} />}>
            <Route path="/staff" element={<StaffHomePage />} />
          </Route>

          <Route element={<RoleRoute roles={["Admin"]} />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
