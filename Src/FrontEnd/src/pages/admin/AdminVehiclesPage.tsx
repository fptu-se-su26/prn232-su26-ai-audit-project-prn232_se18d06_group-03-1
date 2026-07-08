import AdminVehicleModerationPage from "@/features/vehicles/components/AdminVehicleModerationPage";
import { useLocation } from "react-router-dom";

export default function AdminVehiclesPage() {
  const { pathname } = useLocation();
  const mode = pathname.includes("vehicle-listings") ? "listings" : pathname.includes("vehicle-documents") ? "documents" : undefined;
  return <AdminVehicleModerationPage mode={mode} />;
}
