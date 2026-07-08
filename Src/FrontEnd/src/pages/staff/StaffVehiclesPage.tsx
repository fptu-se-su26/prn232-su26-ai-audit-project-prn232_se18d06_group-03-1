import StaffVehicleModerationPage from "@/features/vehicles/components/StaffVehicleModerationPage";
import { useLocation } from "react-router-dom";

export default function StaffVehiclesPage() {
  const { pathname } = useLocation();
  const mode = pathname.includes("vehicle-listings") ? "listings" : pathname.includes("vehicle-documents") ? "documents" : undefined;
  return <StaffVehicleModerationPage mode={mode} />;
}
