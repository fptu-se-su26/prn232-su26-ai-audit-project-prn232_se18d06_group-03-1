import VehicleModerationPage from "@/features/vehicles/components/VehicleModerationPage";

type ModerationMode = "documents" | "listings";

export default function AdminVehicleModerationPage({ mode }: { mode?: ModerationMode }) {
  return <VehicleModerationPage role="admin" mode={mode} />;
}
