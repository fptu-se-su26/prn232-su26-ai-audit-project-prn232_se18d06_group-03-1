import { AlertCircle, ArrowLeft, Bike, Car, Check, ChevronLeft, ChevronRight, Loader2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormDropdown from "@/components/common/FormDropdown";
import { createVehicle, getCatalogAreas, getCatalogBrands, getCatalogFeatures, getCatalogModels, getCatalogVariants, getPricingSuggestion } from "@/features/vehicles/services/vehicleService";
import type { CatalogArea, CatalogBrand, CatalogFeature, CatalogModel, CatalogVariant, PricingSuggestionResponse } from "@/features/vehicles/types";

const steps = ["Loai xe", "Hang & dong xe", "Thong tin", "Gia & dia chi", "Tinh nang", "Hinh anh", "Xac nhan"];

function vehicleTypeLabel(value: string) {
  return value === "Car" ? "O to" : "Xe may";
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
      setSubmitError("Dang ky that bai. Vui long thu lai.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={() => navigate("/owner/vehicles")} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Them xe moi</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-3">
        {steps.map((label, index) => (
          <span key={label} className={`rounded-full px-3 py-1 text-xs font-medium ${index === step ? "bg-brand-700 text-white" : index < step ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
            {index + 1}. {label}
          </span>
        ))}
      </div>

      <div className="p-4">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setVehicleType("Car")} className={`flex flex-col items-center gap-3 rounded-lg border-2 p-8 ${vehicleType === "Car" ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
              <Car className="h-12 w-12" />
              <span>O to</span>
            </button>
            <button type="button" onClick={() => setVehicleType("Motorbike")} className={`flex flex-col items-center gap-3 rounded-lg border-2 p-8 ${vehicleType === "Motorbike" ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
              <Bike className="h-12 w-12" />
              <span>Xe may</span>
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <FormDropdown value={brandId != null ? String(brandId) : ""} onChange={(v) => setBrandId(Number(v))} placeholder="Chon hang xe" options={brands.map((b) => ({ value: String(b.id), label: b.name }))} />
            {brandId && <FormDropdown value={modelId != null ? String(modelId) : ""} onChange={(v) => setModelId(Number(v))} placeholder="Chon dong xe" options={models.map((m) => ({ value: String(m.id), label: m.name }))} />}
            {modelId && variants.length > 0 && <FormDropdown value={variantId != null ? String(variantId) : ""} onChange={(v) => setVariantId(Number(v))} placeholder="Chon phien ban" options={variants.map((v) => ({ value: String(v.id), label: v.name }))} />}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={2030} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Nam san xuat" />
            <input value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Bien so" />
            <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="So km da di" />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Dia chi xe" />
            <FormDropdown value={areaId != null ? String(areaId) : ""} onChange={(v) => setAreaId(Number(v))} placeholder="Chon khu vuc tinh gia" options={areas.map((a) => ({ value: String(a.id), label: `${a.province} - ${a.district} (${a.pricingRegionCode})` }))} />
            {pricingSuggestion && (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                {pricingSuggestion.hasSuggestion ? `Goi y: ${pricingSuggestion.suggestedMinPrice?.toLocaleString("vi-VN")} - ${pricingSuggestion.suggestedMaxPrice?.toLocaleString("vi-VN")}d/ngay, base ${pricingSuggestion.basePrice?.toLocaleString("vi-VN")}d.` : "Chua co khung gia goi y cho dong xe va khu vuc nay."}
              </div>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setPricingMode("Fixed")} className={`rounded-md border px-3 py-2 text-sm ${pricingMode === "Fixed" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>Fixed</button>
              <button type="button" onClick={() => setPricingMode("Auto")} className={`rounded-md border px-3 py-2 text-sm ${pricingMode === "Auto" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>Auto</button>
            </div>
            {pricingMode === "Fixed" ? (
              <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm" placeholder="Gia thue VND/ngay" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={autoMinPrice} onChange={(e) => setAutoMinPrice(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Auto min" />
                <input type="number" value={autoMaxPrice} onChange={(e) => setAutoMaxPrice(e.target.value)} className="h-9 rounded-md border border-slate-300 px-3 text-sm" placeholder="Auto max" />
              </div>
            )}
            {!isPricingValid() && (areaId || pricePerDay || autoMinPrice || autoMaxPrice) && <p className="text-xs text-red-600">Gia phai hop le va nam trong khung min/max neu co goi y.</p>}
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mo ta them ve xe" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <button key={feature.id} type="button" onClick={() => toggleFeature(feature.id)} className={`rounded-full border px-3 py-1.5 text-xs ${selectedFeatureIds.includes(feature.id) ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600"}`}>
                {selectedFeatureIds.includes(feature.id) ? <X className="mr-1 inline h-3 w-3" /> : null}{feature.name}
              </button>
            ))}
            {features.length === 0 && <p className="text-sm text-slate-400">Khong co tinh nang nao.</p>}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"><Upload className="h-4 w-4" /> Chon hinh anh</button>
            <div className="grid grid-cols-3 gap-3">
              {imageUrls.map((url, index) => (
                <div key={url} className="relative">
                  <button type="button" onClick={() => removeImage(index)} className="absolute right-1 top-1 z-10 rounded-full bg-black/60 p-1 text-white"><X className="h-3 w-3" /></button>
                  <button type="button" onClick={() => setFeaturedImageIndex(index)} className={`overflow-hidden rounded-lg border-2 ${index === featuredImageIndex ? "border-brand-500" : "border-slate-200"}`}>
                    <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <input ref={docInputRef} type="file" accept="image/*" onChange={handleDocUpload} className="hidden" />
            <div className="flex gap-3">
              <button type="button" onClick={() => docInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"><Upload className="h-4 w-4" /> Chon anh cavet</button>
              {documentFileUrl && !verificationResult && <button type="button" onClick={handleVerifyDocument} className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2 text-sm text-white">{isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Xac thuc AI</button>}
            </div>
            {documentFileUrl && <img src={documentFileUrl} alt="Cavet" className="max-h-48 rounded-lg object-contain" />}
            {verificationResult === "verified" && <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700"><Check className="h-4 w-4" /> Xac thuc thanh cong</div>}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>Loai xe: <b>{vehicleTypeLabel(vehicleType)}</b></div>
              <div>Hang: <b>{brands.find((b) => b.id === brandId)?.name}</b></div>
              <div>Dong xe: <b>{models.find((m) => m.id === modelId)?.name}</b></div>
              <div>Bien so: <b>{licensePlate}</b></div>
              <div>Gia: <b>{pricingMode === "Fixed" ? Number(pricePerDay).toLocaleString("vi-VN") : `${Number(autoMinPrice).toLocaleString("vi-VN")} - ${Number(autoMaxPrice).toLocaleString("vi-VN")}`}d/ngay</b></div>
            </div>
            {submitError && <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" /> {submitError}</div>}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
          <div>{step > 0 && <button type="button" onClick={() => setStep((s) => Math.max(s - 1, 0))} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600"><ChevronLeft className="h-4 w-4" /> Quay lai</button>}</div>
          {step < steps.length - 1 ? (
            <button type="button" onClick={() => canProceed() && setStep((s) => Math.min(s + 1, steps.length - 1))} disabled={!canProceed()} className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-4 py-2 text-sm text-white disabled:opacity-50">Tiep theo <ChevronRight className="h-4 w-4" /></button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-6 py-2 text-sm text-white disabled:opacity-50">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Hoan tat dang ky</button>
          )}
        </div>
      </div>
    </div>
  );
}
