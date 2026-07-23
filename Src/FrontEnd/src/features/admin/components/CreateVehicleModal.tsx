import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Loader2, CheckCircle, AlertCircle, Check } from "lucide-react";
import FormDropdown from "@/components/common/FormDropdown";
import AddressAutocomplete, { type SelectedAddress } from "@/features/locations/components/AddressAutocomplete";
import { getCatalogBrands, getCatalogModels, getCatalogVariants, getCatalogFeatures, getCatalogAreas, getPricingSuggestion, uploadVehicleImage } from "@/features/vehicles/services/vehicleService";
import { previewAdminVehicleOcr, createAdminVehicle } from "@/features/admin/services/adminPostManagementService";
import type { CreateAdminVehicleRequest, AdminVehicleOcrPreviewResponse } from "@/features/admin/types";
import type { CatalogArea, PricingSuggestionResponse } from "@/features/vehicles/types";

type Props = { ownerId: number; ownerName?: string; onClose: () => void; onCreated: () => void; };

export default function CreateVehicleModal({ ownerId, ownerName, onClose, onCreated }: Props) {
  const [vehicleType, setVehicleType] = useState<string>("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [year, setYear] = useState<string>("");
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [areaId, setAreaId] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  const [pricingMode, setPricingMode] = useState<"Fixed" | "Auto">("Fixed");
  const [pricePerDay, setPricePerDay] = useState<string>("");
  const [autoMinPrice, setAutoMinPrice] = useState<string>("");
  const [autoMaxPrice, setAutoMaxPrice] = useState<string>("");
  const [depositPercent, setDepositPercent] = useState(20);
  const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestionResponse | null>(null);

  const [featureIds, setFeatureIds] = useState<number[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);

  const [brands, setBrands] = useState<{ id: number; name: string; vehicleType: string }[]>([]);
  const [models, setModels] = useState<{ id: number; name: string; brandId: number }[]>([]);
  const [variants, setVariants] = useState<{ id: number; name: string; modelId: number }[]>([]);
  const [features, setFeatures] = useState<{ id: number; name: string }[]>([]);
  const [areas, setAreas] = useState<CatalogArea[]>([]);
  const [selectedProvince, setSelectedProvince] = useState("");

  const [cavetFile, setCavetFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<AdminVehicleOcrPreviewResponse | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getCatalogAreas().then(setAreas).catch(() => {});
  }, []);

  const provinces = useMemo(() => {
    const unique = [...new Set(areas.map((a) => a.province))];
    return unique.map((p) => ({ value: p, label: p }));
  }, [areas]);

  const provinceAreas = useMemo(() => {
    return areas.filter((a) => a.province === selectedProvince);
  }, [areas, selectedProvince]);

  const areaOptions = useMemo(() => {
    return provinceAreas.map((a) => ({ value: String(a.id), label: `${a.district} (${a.pricingRegionCode})` }));
  }, [provinceAreas]);

  const brandOptions = useMemo(() => brands.map((b) => ({ value: String(b.id), label: b.name })), [brands]);
  const modelOptions = useMemo(() => models.map((m) => ({ value: String(m.id), label: m.name })), [models]);
  const variantOptions = useMemo(() => variants.map((v) => ({ value: String(v.id), label: v.name })), [variants]);

  useEffect(() => {
    if (!vehicleType) return;
    setBrandId(null); setModelId(null); setVariantId(null);
    getCatalogBrands(vehicleType).then(setBrands).catch(() => {});
    getCatalogFeatures(vehicleType).then(setFeatures).catch(() => {});
  }, [vehicleType]);

  useEffect(() => {
    if (!brandId) return;
    setModelId(null); setVariantId(null);
    getCatalogModels(brandId).then(setModels).catch(() => {});
  }, [brandId]);

  useEffect(() => {
    if (!modelId) return;
    setVariantId(null);
    getCatalogVariants(modelId, vehicleType || undefined).then(setVariants).catch(() => {});
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

  function isDepositValid() {
    return depositPercent >= 20 && depositPercent <= 50;
  }

  function handleProvinceChange(val: string) {
    setSelectedProvince(val);
    setAreaId(null);
    setPricingSuggestion(null);
  }

  function handleAreaChange(val: string) {
    setAreaId(val ? Number(val) : null);
    setPricingSuggestion(null);
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

  async function handleCavetOcr() {
    if (!cavetFile) return;
    setOcrLoading(true);
    try {
      const fd = new FormData();
      fd.append("cavetImage", cavetFile);
      fd.append("vehicleType", vehicleType);
      if (licensePlate) fd.append("expectedLicensePlate", licensePlate);
      const result = await previewAdminVehicleOcr(fd);
      setOcrResult(result);
      if (result) {
        if (result.licensePlate) setLicensePlate(result.licensePlate);
      }
    } catch { setOcrResult({ success: false, flags: [], message: "OCR failed" }); }
    finally { setOcrLoading(false); }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setImageUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadVehicleImage(file);
        if (url) setImageUrls((prev) => [...prev, url]);
      }
    } catch {} finally { setImageUploading(false); }
  }

  function toggleFeature(id: number) {
    setFeatureIds((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (!vehicleType || !brandId || !modelId || !year || !licensePlate || !address || !areaId) {
      setError("Vui lòng điền đầy đủ các trường bắt buộc.");
      return;
    }
    if (!isPricingValid()) {
      setError("Giá phải hợp lệ và nằm trong khung gợi ý.");
      return;
    }
    if (!isDepositValid()) {
      setError("Tiền cọc phải từ 20% đến 50%.");
      return;
    }
    if (imageUrls.length === 0) {
      setError("Vui lòng thêm ít nhất 1 hình ảnh.");
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const request: CreateAdminVehicleRequest = {
        ownerId, brandId, modelId, variantId: variantId || undefined,
        vehicleType, year: Number(year) as unknown as number, licensePlate,
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        description: description || undefined, address,
        areaId,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        pricePerDay: pricingMode === "Fixed" ? Number(pricePerDay) : Number(autoMinPrice),
        depositPercent, featureIds, imageUrls,
        featuredImageIndex: imageUrls.length > 0 ? featuredImageIndex : undefined,
        documentFileUrl: documentFileUrl || undefined,
      };
      await createAdminVehicle(request);
      setSuccess(true);
      setTimeout(() => onCreated(), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "Tạo xe thất bại.");
    } finally { setSubmitting(false); }
  }

  if (typeof document === "undefined") return null;

  if (success) {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm" onClick={onClose}>
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <CheckCircle className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold text-slate-900">Tạo xe thành công!</p>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex flex-col rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Thêm xe cho {ownerName || `chủ xe #${ownerId}`}</h2>
          <button type="button" onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Vehicle Type */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Loại xe *</label>
            <div className="flex gap-3">
              {[{ v: "Car", l: "Ô tô" }, { v: "Motorbike", l: "Xe máy" }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setVehicleType(v)}
                  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${vehicleType === v ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Brand / Model / Variant */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Hãng xe *</label>
              <FormDropdown
                value={brandId ? String(brandId) : ""}
                options={brandOptions}
                onChange={(val) => setBrandId(val ? Number(val) : null)}
                placeholder="Chọn hãng"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Dòng xe *</label>
              <FormDropdown
                value={modelId ? String(modelId) : ""}
                options={modelOptions}
                onChange={(val) => setModelId(val ? Number(val) : null)}
                placeholder="Chọn dòng"
                disabled={!brandId}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Phiên bản</label>
              <FormDropdown
                value={variantId ? String(variantId) : ""}
                options={variantOptions}
                onChange={(val) => setVariantId(val ? Number(val) : null)}
                placeholder="Không có"
                disabled={!modelId || variants.length === 0}
              />
            </div>
          </div>

          {/* Year / License Plate / Odometer */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Năm sản xuất *</label>
              <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={new Date().getFullYear() + 1}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="2024" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Biển số *</label>
              <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="30A-12345" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Số km</label>
              <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="0" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Mô tả</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="Mô tả xe..." />
          </div>

          {/* Address / Area */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Khu vực</label>
            <div className="flex gap-3">
              <div className="w-1/2">
                <FormDropdown
                  value={selectedProvince}
                  options={provinces}
                  onChange={handleProvinceChange}
                  placeholder="Tỉnh / Thành phố"
                />
              </div>
              <div className="w-1/2">
                <FormDropdown
                  value={areaId ? String(areaId) : ""}
                  options={areaOptions}
                  onChange={handleAreaChange}
                  placeholder="Quận / Huyện"
                  disabled={!selectedProvince}
                />
              </div>
            </div>
          </div>

          <AddressAutocomplete
            value={address}
            onChange={(val) => {
              setAddress(val);
              setLatitude(undefined);
              setLongitude(undefined);
            }}
            onSelect={(addr: SelectedAddress) => {
              setAddress(addr.address);
              setLatitude(addr.latitude ?? undefined);
              setLongitude(addr.longitude ?? undefined);
            }}
          />

          {/* Pricing Suggestion */}
          {areaId && pricingSuggestion && (
            <div className={`rounded-lg border p-4 text-sm ${pricingSuggestion.hasSuggestion ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {pricingSuggestion.hasSuggestion ? (
                    <>
                      Giá gợi ý: <span className="font-semibold">{pricingSuggestion.suggestedMinPrice?.toLocaleString("vi-VN")}đ</span> – <span className="font-semibold">{pricingSuggestion.suggestedMaxPrice?.toLocaleString("vi-VN")}đ</span>/ngày (giá cơ sở: {pricingSuggestion.basePrice?.toLocaleString("vi-VN")}đ).
                      {pricingSuggestion.dynamicSuggestedPrice != null && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                          Giá đề xuất: {pricingSuggestion.dynamicSuggestedPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </>
                  ) : "Chưa có khung giá gợi ý cho dòng xe và khu vực này."}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Mode */}
          {areaId && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-800">Hình thức định giá</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => handlePricingModeChange("Fixed")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Fixed" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Fixed" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Fixed" && <Check className="h-3 w-3" />}</span>
                    Tự nhập giá
                  </button>
                  <button type="button" onClick={() => handlePricingModeChange("Auto")}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all ${pricingMode === "Auto" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${pricingMode === "Auto" ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300"}`}>{pricingMode === "Auto" && <Check className="h-3 w-3" />}</span>
                    Giá tự động
                  </button>
                </div>
                {pricingMode === "Auto" && !pricingSuggestion?.hasSuggestion && (
                  <p className="mt-1 text-xs text-amber-600">Chưa có khung giá gợi ý cho dòng xe và khu vực này.</p>
                )}
              </div>

              {pricingMode === "Fixed" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-800">Giá cho thuê *</label>
                  <div className="relative">
                    <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} min={0} step={10000}
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-16 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="500000" />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                  </div>
                  {pricingSuggestion?.hasSuggestion && pricingSuggestion.suggestedMinPrice != null && pricingSuggestion.suggestedMaxPrice != null && (
                    <p className="mt-1.5 text-xs text-blue-600">Khung giá gợi ý: {pricingSuggestion.suggestedMinPrice.toLocaleString("vi-VN")}đ – {pricingSuggestion.suggestedMaxPrice.toLocaleString("vi-VN")}đ/ngày{pricingSuggestion.dynamicSuggestedPrice != null ? ` · Đề xuất: ${pricingSuggestion.dynamicSuggestedPrice.toLocaleString("vi-VN")}đ` : ""}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">Giá tối thiểu *</label>
                    <div className="relative">
                      <input type="number" value={autoMinPrice} onChange={(e) => setAutoMinPrice(e.target.value)} min={0} step={10000}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-16 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="300000" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-800">Giá tối đa *</label>
                    <div className="relative">
                      <input type="number" value={autoMaxPrice} onChange={(e) => setAutoMaxPrice(e.target.value)} min={0} step={10000}
                        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 pr-16 text-sm text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-100" placeholder="800000" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">VNĐ/ngày</span>
                    </div>
                  </div>
                </div>
              )}

              {!isPricingValid() && (areaId || pricePerDay || autoMinPrice || autoMaxPrice) && (
                <p className="text-sm text-red-600">Giá phải hợp lệ và nằm trong khung min/max nếu có gợi ý.</p>
              )}
            </>
          )}

          {/* Deposit */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-slate-800">Tiền cọc (%)
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

          {/* Features */}
          {features.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-800">Tính năng</label>
              <div className="flex flex-wrap gap-2">
                {features.map((f) => (
                  <button key={f.id} type="button" onClick={() => toggleFeature(f.id)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${featureIds.includes(f.id) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                    {featureIds.includes(f.id) && <CheckCircle className="mr-1 inline h-3 w-3" />}
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Hình ảnh *</label>
            <div className="flex flex-wrap gap-3">
              {imageUrls.map((url, i) => (
                <div key={i} className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${featuredImageIndex === i ? "border-brand-500" : "border-slate-200"}`}
                  onClick={() => setFeaturedImageIndex(i)}>
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {featuredImageIndex === i && <span className="absolute bottom-0 left-0 right-0 bg-brand-600/80 py-0.5 text-center text-[10px] font-medium text-white">Ảnh chính</span>}
                </div>
              ))}
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
                {imageUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-5 w-5" /><span className="mt-1 text-[10px]">Thêm ảnh</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <p className="mt-1 text-xs text-slate-400">Nhấn vào ảnh để chọn làm ảnh chính.</p>
          </div>

          {/* Cavet OCR */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-800">Cavet xe (OCR tuỳ chọn)</label>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => { setCavetFile(e.target.files?.[0] ?? null); setOcrResult(null); }}
                className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700 hover:file:bg-brand-100" />
              <button type="button" onClick={handleCavetOcr} disabled={!cavetFile || ocrLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">
                {ocrLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {ocrLoading ? "Đang OCR..." : "Quét OCR"}
              </button>
            </div>
            {ocrResult && (
              <div className={`mt-3 rounded-lg px-4 py-3 text-xs ${ocrResult.success ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {ocrResult.success ? (
                  <div className="space-y-1">
                    <p className="font-medium">Kết quả OCR:</p>
                    {ocrResult.licensePlate && <p>Biển số: <strong>{ocrResult.licensePlate}</strong></p>}
                    {ocrResult.brand && <p>Hãng: <strong>{ocrResult.brand}</strong></p>}
                    {ocrResult.model && <p>Dòng: <strong>{ocrResult.model}</strong></p>}
                    {ocrResult.confidence != null && <p>Độ tin cậy: <strong>{(ocrResult.confidence * 100).toFixed(1)}%</strong></p>}
                    {ocrResult.flags.length > 0 && <p className="text-amber-600">Cờ: {ocrResult.flags.join(", ")}</p>}
                  </div>
                ) : (
                  <p>{ocrResult.message ?? "OCR không thành công."}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Đang tạo..." : "Tạo xe (Duyệt ngay)"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
