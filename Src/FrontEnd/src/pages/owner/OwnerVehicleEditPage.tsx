import { AlertCircle, ArrowLeft, Bike, Car, Check, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FormDropdown from "@/components/common/FormDropdown";
import { Skeleton } from "@/components/common/Skeleton";
import AddressAutocomplete, { type SelectedAddress } from "@/features/locations/components/AddressAutocomplete";
import { getCatalogAreas, getCatalogFeatures, getVehicleById, getVehiclePricing, updateVehicle, updateVehiclePricing } from "@/features/vehicles/services/vehicleService";
import type { CatalogArea, CatalogFeature, VehiclePricingResponse, VehicleResponse } from "@/features/vehicles/types";

const steps = ["Loại xe", "Hãng & dòng xe", "Thông tin", "Giá & địa chỉ", "Tính năng"];

function OwnerVehicleEditSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="relative mb-8">
        <Skeleton className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-none" />
        <div className="relative z-10 flex justify-between">
          {steps.map((label) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-5 p-6">
          <div>
            <Skeleton className="mb-2 h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerVehicleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<VehicleResponse | null>(null);
  const [pricing, setPricing] = useState<VehiclePricingResponse | null>(null);
  const [areas, setAreas] = useState<CatalogArea[]>([]);
  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(2);

  const [year, setYear] = useState(2025);
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const [pricingMode, setPricingMode] = useState<"Fixed" | "Auto">("Fixed");
  const [fixedPricePerDay, setFixedPricePerDay] = useState("");
  const [autoMinPrice, setAutoMinPrice] = useState("");
  const [autoMaxPrice, setAutoMaxPrice] = useState("");
  const [depositPercent, setDepositPercent] = useState(20);
  const [saving, setSaving] = useState<string | null>(null);

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
      setLatitude(vehicleData.latitude ?? null);
      setLongitude(vehicleData.longitude ?? null);
      setAreaId(vehicleData.areaId);
      setSelectedProvince(areaList.find((area) => area.id === vehicleData.areaId)?.province ?? "");
      setSelectedFeatureIds(vehicleData.features.map((f) => f.id));
      setPricingMode(pricingData?.pricingMode ?? vehicleData.pricingMode ?? "Fixed");
      setFixedPricePerDay((pricingData?.fixedPricePerDay ?? vehicleData.fixedPricePerDay ?? vehicleData.pricePerDay).toString());
      setAutoMinPrice((pricingData?.autoMinPrice ?? vehicleData.autoMinPrice ?? "").toString());
      setAutoMaxPrice((pricingData?.autoMaxPrice ?? vehicleData.autoMaxPrice ?? "").toString());
      setDepositPercent(Math.max(20, vehicleData.depositPercent ?? 20));
    } catch {
      setError("Không thể tải thông tin xe.");
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

  function isDepositValid() {
    return depositPercent >= 20 && depositPercent <= 50;
  }

  function toggleFeature(featureId: number) {
    setSelectedFeatureIds((prev) => prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]);
  }

  function handleProvinceChange(value: string) {
    setSelectedProvince(value);
    setAreaId(null);
  }

  function handleAddressSelect(selected: SelectedAddress) {
    setAddress(selected.address);
    setLatitude(selected.latitude);
    setLongitude(selected.longitude);
  }

  async function handleSaveInfo() {
    if (!vehicle || !id || !isDepositValid()) return;
    setSaving("info");
    setError(null);
    try {
      await updateVehicle(Number(id), {
        year,
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        areaId,
        latitude,
        longitude,
        pricePerDay: vehicle.pricePerDay,
        depositPercent,
        featureIds: selectedFeatureIds,
      });
      await loadData();
    } catch {
      setError("Cập nhật thông tin xe thất bại.");
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveFeatures() {
    if (!vehicle || !id || !isDepositValid()) return;
    setSaving("features");
    setError(null);
    try {
      await updateVehicle(Number(id), {
        year,
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        areaId,
        latitude,
        longitude,
        pricePerDay: vehicle.pricePerDay,
        depositPercent,
        featureIds: selectedFeatureIds,
      });
      await loadData();
    } catch {
      setError("Cập nhật tính năng thất bại.");
    } finally {
      setSaving(null);
    }
  }

  async function handleSavePricing() {
    if (!vehicle || !id || !isPricingValid() || !isDepositValid()) return;
    setSaving("pricing");
    setError(null);
    try {
      await updateVehicle(Number(id), {
        year,
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        areaId,
        latitude,
        longitude,
        pricePerDay: vehicle.pricePerDay,
        depositPercent,
        featureIds: selectedFeatureIds,
      });
      const updated = await updateVehiclePricing(Number(id), {
        pricingMode,
        fixedPricePerDay: pricingMode === "Fixed" ? Number(fixedPricePerDay) : null,
        autoMinPrice: pricingMode === "Auto" ? Number(autoMinPrice) : null,
        autoMaxPrice: pricingMode === "Auto" ? Number(autoMaxPrice) : null,
      });
      setPricing(updated ?? null);
      await loadData();
    } catch {
      setError("Cập nhật giá xe thất bại.");
    } finally {
      setSaving(null);
    }
  }

  if (isLoading) return <OwnerVehicleEditSkeleton />;

  if (error && !vehicle) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button type="button" onClick={() => navigate("/owner/vehicles")} className="mt-3 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white">Quay lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate(`/owner/vehicles/${id}`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Sửa thông tin xe</h1>
        {vehicle && (
          <span className="text-sm text-slate-400">- {vehicle.brandName} {vehicle.modelName}</span>
        )}
      </div>

      <div className="relative mb-8">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-200" />
        <div className="relative z-10 flex justify-between">
          {steps.map((label, index) => {
            const isCurrent = index === step;
            return (
              <button key={label} type="button" onClick={() => setStep(index)} className="flex flex-col items-center group">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-all ${isCurrent ? "bg-brand-700 text-white ring-2 ring-brand-200 ring-offset-2" : "bg-white text-slate-400 ring-1 ring-slate-300 cursor-pointer group-hover:ring-brand-300 group-hover:text-brand-600"}`}>
                  {index + 1}
                </div>
                <span className={`mt-1.5 whitespace-nowrap text-xs font-medium ${isCurrent ? "text-brand-700" : "text-slate-500 group-hover:text-brand-600"}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6">
          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {step === 0 && (
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Loại xe</h2>
              <p className="mb-5 text-sm text-slate-500">Loại xe không thể thay đổi sau khi đã tạo.</p>
              <div className="grid grid-cols-2 gap-5">
                <div className={`flex flex-col items-center gap-4 rounded-xl border-2 p-10 ${vehicle?.vehicleType === "Car" ? "border-brand-500 bg-brand-50" : "border-slate-200 opacity-60"}`}>
                  <Car className={`h-16 w-16 ${vehicle?.vehicleType === "Car" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className={`text-lg font-semibold ${vehicle?.vehicleType === "Car" ? "text-brand-700" : "text-slate-700"}`}>Ô tô</span>
                </div>
                <div className={`flex flex-col items-center gap-4 rounded-xl border-2 p-10 ${vehicle?.vehicleType === "Motorbike" ? "border-brand-500 bg-brand-50" : "border-slate-200 opacity-60"}`}>
                  <Bike className={`h-16 w-16 ${vehicle?.vehicleType === "Motorbike" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className={`text-lg font-semibold ${vehicle?.vehicleType === "Motorbike" ? "text-brand-700" : "text-slate-700"}`}>Xe máy</span>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Hãng & dòng xe</h2>
                <p className="mb-5 text-sm text-slate-500">Thông tin hãng và dòng xe không thể thay đổi.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-500">Hãng xe</label>
                  <p className="text-sm font-semibold text-slate-900">{vehicle?.brandName}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-500">Dòng xe</label>
                  <p className="text-sm font-semibold text-slate-900">{vehicle?.modelName}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-500">Phiên bản</label>
                  <p className="text-sm font-semibold text-slate-900">{vehicle?.variantName ?? "-"}</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Thông tin xe</h2>
                <p className="mb-5 text-sm text-slate-500">Cập nhật các thông số cơ bản của xe.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Năm sản xuất</label>
                  <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} min={1990} max={2030} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Biển số xe</label>
                  <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="VD: 51A-12345" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Số km đã đi</label>
                  <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0} placeholder="VD: 15000" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả thêm về xe..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Giá & địa chỉ</h2>
                <p className="mb-5 text-sm text-slate-500">Cập nhật giá cho thuê và thông tin vị trí xe.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                <FormDropdown value={selectedProvince} onChange={handleProvinceChange} placeholder="Chọn tỉnh/thành phố" options={provinces.map((province) => ({ value: province, label: province }))} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Phường/Xã</label>
                <FormDropdown value={areaId != null ? String(areaId) : ""} onChange={(v) => setAreaId(Number(v))} placeholder="Chọn phường/xã" disabled={!selectedProvince} options={provinceAreas.map((area) => ({ value: String(area.id), label: `${area.district} (${area.pricingRegionCode})` }))} />
              </div>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onSelect={handleAddressSelect}
                onManualChange={() => {
                  setLatitude(null);
                  setLongitude(null);
                }}
                placeholder="VD: Số 123, Đường ABC, Phường XYZ"
              />
              {areaId && (
                <div className="space-y-1">
                  {pricing?.suggestion && (
                    <div className={`rounded-lg border p-4 text-sm ${pricing.suggestion.hasSuggestion ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          {pricing.suggestion.hasSuggestion ? (
                            <>
                              Giá gợi ý: <span className="font-semibold">{pricing.suggestion.suggestedMinPrice?.toLocaleString("vi-VN")}đ</span> – <span className="font-semibold">{pricing.suggestion.suggestedMaxPrice?.toLocaleString("vi-VN")}đ</span>/ngày
                              {pricing.suggestion.dynamicSuggestedPrice != null && (
                                <span className="mt-2 inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                                  Giá đề xuất: {pricing.suggestion.dynamicSuggestedPrice.toLocaleString("vi-VN")}đ
                                </span>
                              )}
                            </>
                          ) : "Chưa có khung giá gợi ý."}
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hình thức định giá</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setPricingMode("Fixed")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Fixed" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Fixed" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Fixed" && <Check className="h-3 w-3" />}</span>
                        Tự nhập giá
                      </button>
                      <button type="button" onClick={() => setPricingMode("Auto")} disabled={!pricing?.suggestion?.hasSuggestion} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Auto" ? "border-brand-500 bg-brand-50 text-brand-700" : pricing?.suggestion?.hasSuggestion ? "border-slate-200 text-slate-600 hover:border-slate-300" : "border-slate-100 text-slate-400 cursor-not-allowed"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Auto" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Auto" && <Check className="h-3 w-3" />}</span>
                        Giá tự động
                      </button>
                    </div>
                  </div>
                  {pricingMode === "Fixed" ? (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Giá cho thuê</label>
                      <div className="relative">
                        <input type="number" value={fixedPricePerDay} onChange={(e) => setFixedPricePerDay(e.target.value)} placeholder="VD: 500000" className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-16 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Giá tối thiểu</label>
                        <input type="number" value={autoMinPrice} onChange={(e) => setAutoMinPrice(e.target.value)} readOnly className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-16 text-sm text-slate-600 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Giá tối đa</label>
                        <input type="number" value={autoMaxPrice} onChange={(e) => setAutoMaxPrice(e.target.value)} readOnly className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-16 text-sm text-slate-600 outline-none" />
                      </div>
                    </div>
                  )}
                  {!isPricingValid() && <p className="text-sm text-red-600">Giá phải hợp lệ và nằm trong khung min/max nếu có gợi ý.</p>}
                </div>
              )}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-center justify-between gap-4">
                  <span>
                    <span className="block text-sm font-medium text-slate-700">Tiền cọc (%)
                      {depositPercent > 0 && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          (= {depositPercent}% tổng tiền thuê)
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">Tiền cọc tối thiểu 20%, tối đa 50%.</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={20}
                      max={50}
                      step={5}
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(Number(e.target.value))}
                      className="h-2 w-32 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
                    />
                    <span className="min-w-[3rem] text-sm font-semibold text-slate-900">{depositPercent}%</span>
                  </div>
                </label>
                {!isDepositValid() && <p className="text-sm text-red-600">Phần trăm tiền cọc phải từ 20 đến 50%.</p>}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Tính năng</h2>
                <p className="mb-5 text-sm text-slate-500">Chọn các tính năng mà xe của bạn có.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <button key={feature.id} type="button" onClick={() => toggleFeature(feature.id)} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all ${selectedFeatureIds.includes(feature.id) ? "border-brand-300 bg-brand-50 text-brand-700 font-medium" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                    {selectedFeatureIds.includes(feature.id) ? <Check className="h-3.5 w-3.5" /> : null}{feature.name}
                  </button>
                ))}
                {features.length === 0 && <p className="text-sm text-slate-400">Không có tính năng nào.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div>
            {step > 0 && (
              <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" /> Quay lại
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button type="button" onClick={handleSaveInfo} disabled={saving === "info"} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving === "info" ? "Đang lưu..." : <><Save className="h-4 w-4" /> Lưu thông tin</>}
              </button>
            )}
            {step === 3 && (
              <button type="button" onClick={handleSavePricing} disabled={saving === "pricing" || !isPricingValid() || !isDepositValid()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving === "pricing" ? "Đang lưu..." : <><Save className="h-4 w-4" /> Lưu giá & địa chỉ</>}
              </button>
            )}
            {step === 4 && (
              <button type="button" onClick={handleSaveFeatures} disabled={saving === "features"} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving === "features" ? "Đang lưu..." : <><Save className="h-4 w-4" /> Lưu tính năng</>}
              </button>
            )}
            {step < steps.length - 1 && !["info", "pricing", "features"].includes(saving ?? "") && (
              <button type="button" onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                Tiếp theo <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
