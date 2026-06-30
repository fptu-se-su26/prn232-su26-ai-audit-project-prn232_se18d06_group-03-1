import VehicleModerationPage from "@/features/vehicles/components/VehicleModerationPage";
import { useLocation } from "react-router-dom";

export default function StaffVehiclesPage() {
  const { pathname } = useLocation();
  const mode = pathname.includes("vehicle-listings") ? "listings" : pathname.includes("vehicle-documents") ? "documents" : undefined;
  return <VehicleModerationPage role="staff" mode={mode} />;
}
