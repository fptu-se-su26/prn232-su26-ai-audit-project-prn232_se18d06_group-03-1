import { AlertCircle, ArrowLeft, Bike, Car, Check, ChevronLeft, ChevronRight, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormDropdown from "@/components/common/FormDropdown";
import { createVehicle, getCatalogAreas, getCatalogBrands, getCatalogFeatures, getCatalogModels, getCatalogVariants, getPricingSuggestion } from "@/features/vehicles/services/vehicleService";
import type { CatalogArea, CatalogBrand, CatalogFeature, CatalogModel, CatalogVariant, PricingSuggestionResponse } from "@/features/vehicles/types";

const steps = ["Loại xe", "Hãng & dòng xe", "Thông tin", "Giá & địa chỉ", "Tính năng", "Hình ảnh", "Xác nhận"];

function vehicleTypeLabel(value: string) {
  return value === "Car" ? "Ô tô" : "Xe máy";
}

export default function OwnerVehicleAddPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [modelId, setModelId] = useState<number | null>(null);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);

  const [year, setYear] = useState("2025");
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");

  const [areas, setAreas] = useState<CatalogArea[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [areaId, setAreaId] = useState<number | null>(null);
  const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestionResponse | null>(null);
  const [pricingMode, setPricingMode] = useState<"Fixed" | "Auto">("Fixed");
  const [pricePerDay, setPricePerDay] = useState("");
  const [autoMinPrice, setAutoMinPrice] = useState("");
  const [autoMaxPrice, setAutoMaxPrice] = useState("");

  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    getCatalogAreas().then(setAreas).catch(() => {});
  }, []);

  const provinces = useMemo(() => [...new Set(areas.map((area) => area.province))].sort(), [areas]);
  const provinceAreas = useMemo(
    () => areas.filter((area) => area.province === selectedProvince).sort((a, b) => a.district.localeCompare(b.district)),
    [areas, selectedProvince],
  );

  useEffect(() => {
    setBrandId(null);
    setBrands([]);
    setModelId(null);
    setModels([]);
    setVariantId(null);
    setVariants([]);
    setFeatures([]);
    setSelectedFeatureIds([]);
    if (vehicleType) {
      getCatalogBrands(vehicleType).then(setBrands).catch(() => {});
      getCatalogFeatures(vehicleType).then(setFeatures).catch(() => {});
    }
  }, [vehicleType]);

  useEffect(() => {
    setModelId(null);
    setModels([]);
    setVariantId(null);
    setVariants([]);
    if (brandId) getCatalogModels(brandId).then(setModels).catch(() => {});
  }, [brandId]);

  useEffect(() => {
    setVariantId(null);
    setVariants([]);
    if (modelId) getCatalogVariants(modelId, vehicleType).then(setVariants).catch(() => {});
  }, [modelId, vehicleType]);

  useEffect(() => {
    setPricingSuggestion(null);
    if (modelId && areaId) {
      getPricingSuggestion(modelId, areaId).then((result) => setPricingSuggestion(result ?? null)).catch(() => {});
    }
  }, [modelId, areaId]);

  useEffect(() => {
    if (
      pricingMode === "Auto"
      && pricingSuggestion?.hasSuggestion
      && pricingSuggestion.suggestedMinPrice != null
      && pricingSuggestion.suggestedMaxPrice != null
    ) {
      setAutoMinPrice(String(pricingSuggestion.suggestedMinPrice));
      setAutoMaxPrice(String(pricingSuggestion.suggestedMaxPrice));
    }
  }, [pricingMode, pricingSuggestion]);

  function isPriceInSuggestion(value: number) {
    if (!pricingSuggestion?.hasSuggestion || pricingSuggestion.suggestedMinPrice == null || pricingSuggestion.suggestedMaxPrice == null) return true;
    return value >= pricingSuggestion.suggestedMinPrice && value <= pricingSuggestion.suggestedMaxPrice;
  }

  function isPricingValid() {
    if (!areaId) return false;
    if (pricingMode === "Fixed") {
      const fixed = Number(pricePerDay);
      return fixed > 0 && isPriceInSuggestion(fixed);
    }
    const min = Number(autoMinPrice);
    const max = Number(autoMaxPrice);
    return min > 0 && max > 0 && min <= max && isPriceInSuggestion(min) && isPriceInSuggestion(max);
  }

  function handleProvinceChange(value: string) {
    setSelectedProvince(value);
    setAreaId(null);
    setPricingSuggestion(null);
    setPricePerDay("");
    setAutoMinPrice("");
    setAutoMaxPrice("");
  }

  function handleAreaChange(value: string) {
    setAreaId(Number(value));
    setPricingSuggestion(null);
    setPricePerDay("");
    setAutoMinPrice("");
    setAutoMaxPrice("");
  }

  function handlePricingModeChange(mode: "Fixed" | "Auto") {
    setPricingMode(mode);
    if (
      mode === "Auto"
      && pricingSuggestion?.hasSuggestion
      && pricingSuggestion.suggestedMinPrice != null
      && pricingSuggestion.suggestedMaxPrice != null
    ) {
      setAutoMinPrice(String(pricingSuggestion.suggestedMinPrice));
      setAutoMaxPrice(String(pricingSuggestion.suggestedMaxPrice));
    }
  }

  function canProceed() {
    switch (step) {
      case 0: return vehicleType !== "";
      case 1: return brandId != null && modelId != null;
      case 2: return year.trim() !== "" && licensePlate.trim() !== "";
      case 3: return address.trim() !== "" && isPricingValid();
      case 4: return true;
      case 5: return imageUrls.length > 0;
      case 6: return true;
      default: return false;
    }
  }

  function toggleFeature(id: number) {
    setSelectedFeatureIds((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      setImageUrls((prev) => [...prev, URL.createObjectURL(file)]);
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]);
      next.splice(index, 1);
      return next;
    });
    if (featuredImageIndex >= index && featuredImageIndex > 0) setFeaturedImageIndex((prev) => Math.max(0, prev - 1));
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumentFileUrl(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleVerifyDocument() {
    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setVerificationResult("verified");
    setIsVerifying(false);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createVehicle({
        brandId: brandId!,
        modelId: modelId!,
        variantId,
        vehicleType,
        year: Number(year),
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        areaId,
        pricePerDay: pricingMode === "Fixed" ? Number(pricePerDay) : Number(autoMinPrice),
        pricingMode,
        fixedPricePerDay: pricingMode === "Fixed" ? Number(pricePerDay) : null,
        autoMinPrice: pricingMode === "Auto" ? Number(autoMinPrice) : null,
        autoMaxPrice: pricingMode === "Auto" ? Number(autoMaxPrice) : null,
        featureIds: selectedFeatureIds,
        imageUrls,
        featuredImageIndex,
        documentFileUrl,
      });
      navigate("/owner/vehicles");
    } catch {
      setSubmitError("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => navigate("/owner/vehicles")} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Thêm xe mới</h1>
      </div>

      <div className="relative mb-8">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-200" />
        <div className="relative z-10 flex justify-between">
          {steps.map((label, index) => {
            const isDone = index < step;
            const isCurrent = index === step;
            return (
              <div key={label} className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm ${isDone ? "bg-green-500 text-white" : isCurrent ? "bg-brand-700 text-white" : "bg-white text-slate-400 ring-1 ring-slate-300"}`}>
                  {isDone ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`mt-1.5 whitespace-nowrap text-xs font-medium ${isCurrent ? "text-brand-700" : isDone ? "text-green-600" : "text-slate-400"}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          {step === 0 && (
            <div>
              <h2 className="mb-1 text-lg font-semibold text-slate-900">Chọn loại xe</h2>
              <p className="mb-5 text-sm text-slate-500">Bạn muốn cho thuê loại xe nào?</p>
              <div className="grid grid-cols-2 gap-5">
                <button type="button" onClick={() => setVehicleType("Car")} className={`relative flex flex-col items-center gap-4 rounded-xl border-2 p-10 transition-all ${vehicleType === "Car" ? "border-brand-500 bg-brand-50 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow"}`}>
                  {vehicleType === "Car" && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"><Check className="h-3.5 w-3.5" /></span>}
                  <Car className={`h-16 w-16 ${vehicleType === "Car" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className={`text-lg font-semibold ${vehicleType === "Car" ? "text-brand-700" : "text-slate-700"}`}>Ô tô</span>
                  <span className="text-xs text-slate-400">4-7 chỗ, sedan, SUV, hatchback...</span>
                </button>
                <button type="button" onClick={() => setVehicleType("Motorbike")} className={`relative flex flex-col items-center gap-4 rounded-xl border-2 p-10 transition-all ${vehicleType === "Motorbike" ? "border-brand-500 bg-brand-50 shadow-md" : "border-slate-200 hover:border-slate-300 hover:shadow"}`}>
                  {vehicleType === "Motorbike" && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white"><Check className="h-3.5 w-3.5" /></span>}
                  <Bike className={`h-16 w-16 ${vehicleType === "Motorbike" ? "text-brand-600" : "text-slate-400"}`} />
                  <span className={`text-lg font-semibold ${vehicleType === "Motorbike" ? "text-brand-700" : "text-slate-700"}`}>Xe máy</span>
                  <span className="text-xs text-slate-400">Tay ga, số, phân khối lớn...</span>
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Hãng & dòng xe</h2>
                <p className="mb-5 text-sm text-slate-500">Chọn thông tin cơ bản của xe.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Hãng xe</label>
                <FormDropdown value={brandId != null ? String(brandId) : ""} onChange={(v) => setBrandId(Number(v))} placeholder="Chọn hãng xe" options={brands.map((b) => ({ value: String(b.id), label: b.name }))} />
              </div>
              {brandId && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Dòng xe</label>
                  <FormDropdown value={modelId != null ? String(modelId) : ""} onChange={(v) => setModelId(Number(v))} placeholder="Chọn dòng xe" options={models.map((m) => ({ value: String(m.id), label: m.name }))} />
                </div>
              )}
              {modelId && variants.length > 0 && (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Phiên bản</label>
                  <FormDropdown value={variantId != null ? String(variantId) : ""} onChange={(v) => setVariantId(Number(v))} placeholder="Chọn phiên bản (không bắt buộc)" options={variants.map((v) => ({ value: String(v.id), label: v.name }))} />
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Thông tin xe</h2>
                <p className="mb-5 text-sm text-slate-500">Nhập các thông số cơ bản của xe.</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Năm sản xuất</label>
                  <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={2030} className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Giá & địa chỉ</h2>
                <p className="mb-5 text-sm text-slate-500">Thiết lập giá cho thuê và thông tin vị trí xe.</p>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Tỉnh/Thành phố</label>
                <FormDropdown value={selectedProvince} onChange={handleProvinceChange} placeholder="Chọn tỉnh/thành phố" options={provinces.map((province) => ({ value: province, label: province }))} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Phường/Xã</label>
                <FormDropdown value={areaId != null ? String(areaId) : ""} onChange={handleAreaChange} placeholder="Chọn phường/xã" disabled={!selectedProvince} options={provinceAreas.map((area) => ({ value: String(area.id), label: `${area.district} (${area.pricingRegionCode})` }))} />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Địa chỉ chi tiết</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="VD: Số 123, Đường ABC, Phường XYZ" className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              {areaId && (
                <>
                  {pricingSuggestion && (
                    <div className={`rounded-lg border p-4 text-sm ${pricingSuggestion.hasSuggestion ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <div>
                          {pricingSuggestion.hasSuggestion ? (
                            <>Giá gợi ý dành cho dòng xe này tại khu vực của bạn: <span className="font-semibold">{pricingSuggestion.suggestedMinPrice?.toLocaleString("vi-VN")}đ</span> – <span className="font-semibold">{pricingSuggestion.suggestedMaxPrice?.toLocaleString("vi-VN")}đ</span>/ngày (giá cơ sở: {pricingSuggestion.basePrice?.toLocaleString("vi-VN")}đ).</>
                          ) : "Chưa có khung giá gợi ý cho dòng xe và khu vực này."}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">Hình thức định giá</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => handlePricingModeChange("Fixed")} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Fixed" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Fixed" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Fixed" && <Check className="h-3 w-3" />}</span>
                        Tự nhập giá
                      </button>
                      <button type="button" onClick={() => handlePricingModeChange("Auto")} disabled={!pricingSuggestion?.hasSuggestion} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Auto" ? "border-brand-500 bg-brand-50 text-brand-700" : pricingSuggestion?.hasSuggestion ? "border-slate-200 text-slate-600 hover:border-slate-300" : "border-slate-100 text-slate-400 cursor-not-allowed"}`}>
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Auto" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Auto" && <Check className="h-3 w-3" />}</span>
                        Giá tự động
                      </button>
                    </div>
                    {pricingMode === "Auto" && !pricingSuggestion?.hasSuggestion && <p className="mt-1 text-xs text-amber-600">Chưa có khung giá gợi ý để sử dụng chế độ tự động.</p>}
                  </div>
                  {pricingMode === "Fixed" ? (
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-700">Giá cho thuê</label>
                      <div className="relative">
                        <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} placeholder="VD: 500000" className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-12 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Giá tối thiểu</label>
                        <div className="relative">
                          <input type="number" value={autoMinPrice} onChange={(e) => setAutoMinPrice(e.target.value)} readOnly className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-12 text-sm text-slate-600 outline-none" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">Giá tối đa</label>
                        <div className="relative">
                          <input type="number" value={autoMaxPrice} onChange={(e) => setAutoMaxPrice(e.target.value)} readOnly className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 pr-12 text-sm text-slate-600 outline-none" />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                        </div>
                      </div>
                    </div>
                  )}
                  {!isPricingValid() && (areaId || pricePerDay || autoMinPrice || autoMaxPrice) && <p className="text-sm text-red-600">Giá phải hợp lệ và nằm trong khung min/max nếu có gợi ý.</p>}
                </>
              )}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Mô tả thêm</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả thêm về xe của bạn..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
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

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Hình ảnh</h2>
                <p className="mb-5 text-sm text-slate-500">Thêm ảnh thực tế của xe. Nhấn vào ảnh để đặt làm ảnh đại diện.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-6 py-4 text-sm text-slate-600 transition-colors hover:border-brand-400 hover:text-brand-600">
                <Upload className="h-5 w-5" /> Thêm hình ảnh
              </button>
              {imageUrls.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-12 text-slate-400">
                  <ImageIcon className="h-10 w-10" />
                  <p className="text-sm">Chưa có ảnh nào được chọn</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
                {imageUrls.map((url, index) => (
                  <div key={url} className="group relative">
                    <button type="button" onClick={() => removeImage(index)} className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3" /></button>
                    <button type="button" onClick={() => setFeaturedImageIndex(index)} className={`overflow-hidden rounded-lg border-2 transition-all ${index === featuredImageIndex ? "border-brand-500 ring-2 ring-brand-200" : "border-slate-200 hover:border-slate-300"}`}>
                      <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                    </button>
                    {index === featuredImageIndex && <span className="mt-1 block text-center text-xs font-medium text-brand-600">Ảnh đại diện</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-5">
              <div>
                <h2 className="mb-1 text-lg font-semibold text-slate-900">Xác nhận & Cavet</h2>
                <p className="mb-5 text-sm text-slate-500">Tải lên ảnh cavet để xác thực và kiểm tra lại thông tin trước khi hoàn tất.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Thông tin xe</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-slate-500">Loại xe:</div><div className="font-medium text-slate-900">{vehicleTypeLabel(vehicleType)}</div>
                  <div className="text-slate-500">Hãng:</div><div className="font-medium text-slate-900">{brands.find((b) => b.id === brandId)?.name}</div>
                  <div className="text-slate-500">Dòng xe:</div><div className="font-medium text-slate-900">{models.find((m) => m.id === modelId)?.name}</div>
                  <div className="text-slate-500">Biển số:</div><div className="font-medium text-slate-900">{licensePlate}</div>
                  <div className="text-slate-500">Giá thuê:</div><div className="font-medium text-slate-900">{pricingMode === "Fixed" ? Number(pricePerDay).toLocaleString("vi-VN") : `${Number(autoMinPrice).toLocaleString("vi-VN")} - ${Number(autoMaxPrice).toLocaleString("vi-VN")}`}đ/ngày</div>
                </div>
              </div>
              <input ref={docInputRef} type="file" accept="image/*" onChange={handleDocUpload} className="hidden" />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => docInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"><Upload className="h-4 w-4" /> Chọn ảnh cavet</button>
                {documentFileUrl && !verificationResult && (
                  <button type="button" onClick={handleVerifyDocument} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm text-white transition-colors hover:bg-brand-800">
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Xác thực AI
                  </button>
                )}
              </div>
              {documentFileUrl && <img src={documentFileUrl} alt="Cavet" className="max-h-48 rounded-lg border border-slate-200 object-contain" />}
              {verificationResult === "verified" && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <Check className="h-4 w-4" /> Xác thực thành công
                </div>
              )}
              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" /> {submitError}
                </div>
              )}
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
          {step < steps.length - 1 ? (
            <button type="button" onClick={() => canProceed() && setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={!canProceed()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed">
              Tiếp theo <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Hoàn tất đăng ký
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
