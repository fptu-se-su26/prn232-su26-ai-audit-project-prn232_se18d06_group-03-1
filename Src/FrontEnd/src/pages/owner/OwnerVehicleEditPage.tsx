import { ArrowLeft, Save, AlertCircle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getVehicleById, updateVehicle, getCatalogFeatures } from "@/features/vehicles/services/vehicleService";
import type { VehicleResponse, CatalogFeature } from "@/features/vehicles/types";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function OwnerVehicleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<CatalogFeature[]>([]);

  const [year, setYear] = useState(2025);
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [vehicleData, featureList] = await Promise.all([
        getVehicleById(Number(id)),
        getCatalogFeatures(),
      ]);
      setVehicle(vehicleData);
      setYear(vehicleData.year);
      setLicensePlate(vehicleData.licensePlate);
      setOdometerKm(vehicleData.odometerKm?.toString() ?? "");
      setDescription(vehicleData.description ?? "");
      setAddress(vehicleData.address);
      setPricePerDay(vehicleData.pricePerDay.toString());
      setSelectedFeatureIds(vehicleData.features.map((f) => f.id));
      setFeatures(featureList);
    } catch {
      setError("Không thể tải thông tin xe.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle || !id) return;
    setIsSaving(true);
    try {
      await updateVehicle(Number(id), {
        year,
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        pricePerDay: Number(pricePerDay),
        featureIds: selectedFeatureIds,
      });
      navigate(`/owner/vehicles/${id}`);
    } catch {
      setError("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFeature = (featureId: number) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]
    );
  };

  if (isLoading) return <LoadingSpinner />;

  if (error && !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button type="button" onClick={() => navigate("/owner/vehicles")} className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={() => navigate(`/owner/vehicles/${id}`)} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Sửa thông tin xe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Năm sản xuất</label>
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={1990} max={2030} required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Biển số</label>
            <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Số km đã đi</label>
            <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Giá thuê (VNĐ/ngày)</label>
            <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} min={0} required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Địa chỉ</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
        </div>

        {features.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-500">Tính năng</label>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <button key={f.id} type="button" onClick={() => toggleFeature(f.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedFeatureIds.includes(f.id) ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {selectedFeatureIds.includes(f.id) ? <X className="h-3 w-3" /> : null}
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
          <button type="button" onClick={() => navigate(`/owner/vehicles/${id}`)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Hủy</button>
        </div>
      </form>
    </div>
  );
}
