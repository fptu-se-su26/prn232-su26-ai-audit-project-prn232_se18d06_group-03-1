import { Heart, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import VehicleCard from "@/components/vehicles/VehicleCard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  getFavoriteVehicles,
  removeFavoriteVehicle,
} from "@/features/vehicles/services/favoriteVehicleService";
import type { VehicleListItemResponse } from "@/features/vehicles/types";

export default function CustomerFavoriteVehiclesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VehicleListItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFavoriteVehicles(1, 50);
      setItems(result.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(vehicleId: number) {
    setRemovingId(vehicleId);
    try {
      await removeFavoriteVehicle(vehicleId);
      setItems((current) => current.filter((vehicle) => vehicle.id !== vehicleId));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
      <DashboardHeader
        eyebrow="Bộ sưu tập của bạn"
        title="Xe yêu thích"
        description="Lưu những chiếc xe phù hợp để dễ dàng xem lại và đặt thuê khi cần."
        actions={
          <button
            type="button"
            onClick={() => navigate("/vehicle")}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Search className="h-4 w-4" />
            Tìm thêm xe
          </button>
        }
      />

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <Heart className="h-7 w-7" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-950">Chưa có xe yêu thích</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            Nhấn biểu tượng trái tim trên xe bạn quan tâm để lưu lại tại đây.
          </p>
          <button
            type="button"
            onClick={() => navigate("/vehicle")}
            className="mt-5 inline-flex h-10 items-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Khám phá xe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onOpen={() => navigate(`/vehicle/${vehicle.id}`)}
              onBook={() => navigate(`/booking/new?vehicleId=${vehicle.id}`)}
              bookLabel="Đặt ngay"
              isFavorite
              favoriteLoading={removingId === vehicle.id}
              onToggleFavorite={() => void remove(vehicle.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
