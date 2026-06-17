import { Route, Routes } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import RegisterPage from "@/pages/RegisterPage";
import DisputeDetailPage from "@/pages/staff/DisputeDetailPage";
import DisputesPage from "@/pages/staff/DisputesPage";
import StaffQueuePage from "@/pages/staff/StaffQueuePage";
import SupportTicketDetailPage from "@/pages/staff/SupportTicketDetailPage";
import SupportTicketsPage from "@/pages/staff/SupportTicketsPage";
import VehicleQueuePage from "@/pages/staff/VehicleQueuePage";
import VerificationQueuePage from "@/pages/staff/VerificationQueuePage";
import ProtectedRoute from "@/routes/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin" element={<DashboardPage />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["Staff", "Admin"]} />}>
          <Route path="/staff" element={<StaffQueuePage />} />
          <Route path="/staff/vehicles" element={<VehicleQueuePage />} />
          <Route path="/staff/verifications" element={<VerificationQueuePage />} />
          <Route path="/staff/tickets" element={<SupportTicketsPage />} />
          <Route path="/staff/tickets/:ticketId" element={<SupportTicketDetailPage />} />
          <Route path="/staff/disputes" element={<DisputesPage />} />
          <Route path="/staff/disputes/:disputeId" element={<DisputeDetailPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
