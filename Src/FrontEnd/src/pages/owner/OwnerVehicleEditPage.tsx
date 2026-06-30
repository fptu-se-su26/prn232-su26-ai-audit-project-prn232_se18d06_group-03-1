import { AlertCircle, ArrowLeft, Save, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getCatalogAreas, getCatalogFeatures, getVehicleById, getVehiclePricing, updateVehicle, updateVehiclePricing } from "@/features/vehicles/services/vehicleService";
import type { CatalogArea, CatalogFeature, VehiclePricingResponse, VehicleResponse } from "@/features/vehicles/types";

export default function OwnerVehicleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [pricing, setPricing] = useState<VehiclePricingResponse | null>(null);
  const [areas, setAreas] = useState<CatalogArea[]>([]);
  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [isSavingPricing, setIsSavingPricing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [year, setYear] = useState(2025);
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const [pricingMode, setPricingMode] = useState<"Fixed" | "Auto">("Fixed");
  const [fixedPricePerDay, setFixedPricePerDay] = useState("");
  const [autoMinPrice, setAutoMinPrice] = useState("");
  const [autoMaxPrice, setAutoMaxPrice] = useState("");

  const provinces = useMemo(() => [...new Set(areas.map((area) => area.province))].sort(), [areas]);
  const provinceAreas = useMemo(
    () => areas.filter((area) => area.province === selectedProvince).sort((a, b) => a.district.localeCompare(b.district)),
    [areas, selectedProvince],
  );

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const vehicleData = await getVehicleById(Number(id));
      const [areaList, featureList, pricingData] = await Promise.all([
        getCatalogAreas(),
        getCatalogFeatures(vehicleData.vehicleType),
        getVehiclePricing(Number(id)),
      ]);

      setVehicle(vehicleData);
      setPricing(pricingData ?? null);
      setAreas(areaList);
      setFeatures(featureList);
      setYear(vehicleData.year);
      setLicensePlate(vehicleData.licensePlate);
      setOdometerKm(vehicleData.odometerKm?.toString() ?? "");
      setDescription(vehicleData.description ?? "");
      setAddress(vehicleData.address);
      setAreaId(vehicleData.areaId);
      setSelectedProvince(areaList.find((area) => area.id === vehicleData.areaId)?.province ?? "");
      setSelectedFeatureIds(vehicleData.features.map((f) => f.id));
      setPricingMode(pricingData?.pricingMode ?? vehicleData.pricingMode ?? "Fixed");
      setFixedPricePerDay((pricingData?.fixedPricePerDay ?? vehicleData.fixedPricePerDay ?? vehicleData.pricePerDay).toString());
      setAutoMinPrice((pricingData?.autoMinPrice ?? vehicleData.autoMinPrice ?? "").toString());
      setAutoMaxPrice((pricingData?.autoMaxPrice ?? vehicleData.autoMaxPrice ?? "").toString());
    } catch {
      setError("Khong the tai thong tin xe.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  function isPriceInSuggestion(value: number) {
    const suggestion = pricing?.suggestion;
    if (!suggestion?.hasSuggestion || suggestion.suggestedMinPrice == null || suggestion.suggestedMaxPrice == null) return true;
    return value >= suggestion.suggestedMinPrice && value <= suggestion.suggestedMaxPrice;
  }

  function isPricingValid() {
    if (pricingMode === "Fixed") {
      const fixed = Number(fixedPricePerDay);
      return fixed > 0 && isPriceInSuggestion(fixed);
    }
    const min = Number(autoMinPrice);
    const max = Number(autoMaxPrice);
    return min > 0 && max > 0 && min <= max && isPriceInSuggestion(min) && isPriceInSuggestion(max);
  }

  function toggleFeature(featureId: number) {
    setSelectedFeatureIds((prev) => prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]);
  }

  function handleProvinceChange(value: string) {
    setSelectedProvince(value);
    setAreaId(null);
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle || !id) return;
    setIsSavingInfo(true);
    setError(null);
    try {
      await updateVehicle(Number(id), {
        year,
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        areaId,
        pricePerDay: vehicle.pricePerDay,
        featureIds: selectedFeatureIds,
      });
      await loadData();
    } catch {
      setError("Cap nhat thong tin xe that bai.");
    } finally {
      setIsSavingInfo(false);
    }
  }

  async function handleSavePricing() {
    if (!id || !isPricingValid()) return;
    setIsSavingPricing(true);
    setError(null);
    try {
      const updated = await updateVehiclePricing(Number(id), {
        pricingMode,
        fixedPricePerDay: pricingMode === "Fixed" ? Number(fixedPricePerDay) : null,
        autoMinPrice: pricingMode === "Auto" ? Number(autoMinPrice) : null,
        autoMaxPrice: pricingMode === "Auto" ? Number(autoMaxPrice) : null,
      });
      setPricing(updated ?? null);
      await loadData();
    } catch {
      setError("Cap nhat gia xe that bai.");
    } finally {
      setIsSavingPricing(false);
    }
  }

  if (isLoading) return <LoadingSpinner />;

  if (error && !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button type="button" onClick={() => navigate("/owner/vehicles")} className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm text-white">Quay lai</button>
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
        <h1 className="text-lg font-semibold text-slate-800">Sua thong tin xe</h1>
      </div>

      <div className="space-y-6 p-4">
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={handleSaveInfo} className="space-y-5 rounded-md border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Thong tin chung</h2>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={1990} max={2030} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
            <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
            <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0} className="h-9 rounded-md border border-slate-300 px-3 text-sm" />
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Tỉnh/Thành phố</label>
              <FormDropdown value={selectedProvince} onChange={handleProvinceChange} placeholder="Chon tinh/thanh pho" options={provinces.map((province) => ({ value: province, label: province }))} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Phường/Xã</label>
              <FormDropdown value={areaId != null ? String(areaId) : ""} onChange={(v) => setAreaId(Number(v))} placeholder="Chon phuong/xa" disabled={!selectedProvince} options={provinceAreas.map((area) => ({ value: String(area.id), label: `${area.district} (${area.pricingRegionCode})` }))} />
            </div>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="col-span-2 h-9 rounded-md border border-slate-300 px-3 text-sm" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="col-span-2 rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          {features.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <button key={feature.id} type="button" onClick={() => toggleFeature(feature.id)} className={`rounded-full border px-3 py-1.5 text-xs ${selectedFeatureIds.includes(feature.id) ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>
                  {selectedFeatureIds.includes(feature.id) ? <X className="mr-1 inline h-3 w-3" /> : null}{feature.name}
                </button>
              ))}
            </div>
          )}
          <button type="submit" disabled={isSavingInfo} className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSavingInfo ? "Dang luu..." : "Luu thong tin"}
          </button>
        </form>

        <section className="space-y-4 rounded-md border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Gia xe</h2>
          {pricing?.suggestion && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              {pricing.suggestion.hasSuggestion ? `Gợi ý: ${pricing.suggestion.suggestedMinPrice?.toLocaleString("vi-VN")} - ${pricing.suggestion.suggestedMaxPrice?.toLocaleString("vi-VN")}đ/ngày, base ${pricing.suggestion.basePrice?.toLocaleString("vi-VN")}đ.` : "Chưa có khung giá gợi ý cho xe này."}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setPricingMode("Fixed")} className={`rounded-md border px-3 py-2 text-sm ${pricingMode === "Fixed" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>Fixed</button>
            <button type="button" onClick={() => setPricingMode("Auto")} className={`rounded-md border px-3 py-2 text-sm ${pricingMode === "Auto" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>Auto</button>
          </div>
          {pricingMode === "Fixed" ? (
            <input type="number" value={fixedPricePerDay} onChange={(e) => setFixedPricePerDay(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Gia fixed" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={autoMinPrice} onChange={(e) => setAutoMinPrice(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Auto min" />
              <input type="number" value={autoMaxPrice} onChange={(e) => setAutoMaxPrice(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Auto max" />
            </div>
          )}
          {!isPricingValid() && <p className="text-xs text-red-600">Gia phai hop le va nam trong khung min/max neu co goi y.</p>}
          <button type="button" onClick={handleSavePricing} disabled={isSavingPricing || !isPricingValid()} className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50">
            <Save className="h-4 w-4" /> {isSavingPricing ? "Dang luu..." : "Luu gia"}
          </button>
        </section>
      </div>
    </div>
  );
}
