import { Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import RegisterPage from "@/pages/RegisterPage";
import ProtectedRoute from "@/routes/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
