import VehicleModerationPage from "@/features/vehicles/components/VehicleModerationPage";

type ModerationMode = "documents" | "listings";

export default function StaffVehicleModerationPage({ mode }: { mode?: ModerationMode }) {
  return <VehicleModerationPage role="staff" mode={mode} />;
}
