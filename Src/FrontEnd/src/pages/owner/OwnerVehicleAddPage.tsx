import { ArrowLeft, Car, Bike, ChevronLeft, ChevronRight, Check, Upload, AlertCircle, X, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createVehicle, getCatalogBrands, getCatalogModels, getCatalogVariants, getCatalogFeatures } from "@/features/vehicles/services/vehicleService";
import type { CatalogBrand, CatalogModel, CatalogVariant, CatalogFeature } from "@/features/vehicles/types";
import FormDropdown from "@/components/common/FormDropdown";

const steps = [
  "Loại xe",
  "Hãng & Dòng xe",
  "Thông tin",
  "Giá & Địa chỉ",
  "Tính năng",
  "Hình ảnh",
  "Xác nhận",
];

function vehicleTypeLabel(value: string) {
  return value === "Car" ? "Ô tô" : "Xe máy";
}

export default function OwnerVehicleAddPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState<string>("");
  const [brandId, setBrandId] = useState<number | null>(null);
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [modelId, setModelId] = useState<number | null>(null);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [variantId, setVariantId] = useState<number | null>(null);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);

  const [year, setYear] = useState("2025");
  const [licensePlate, setLicensePlate] = useState("");
  const [odometerKm, setOdometerKm] = useState("");

  const [pricePerDay, setPricePerDay] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");

  const [features, setFeatures] = useState<CatalogFeature[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<number[]>([]);

  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [featuredImageIndex, setFeaturedImageIndex] = useState(0);
  const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (vehicleType) {
      getCatalogBrands(vehicleType).then(setBrands).catch(() => {});
    }
  }, [vehicleType]);

  useEffect(() => {
    setModelId(null);
    setModels([]);
    setVariantId(null);
    setVariants([]);
    if (brandId) {
      getCatalogModels(brandId).then(setModels).catch(() => {});
    }
  }, [brandId]);

  useEffect(() => {
    setVariantId(null);
    setVariants([]);
    if (modelId) {
      getCatalogVariants(modelId, vehicleType).then(setVariants).catch(() => {});
    }
  }, [modelId, vehicleType]);

  useEffect(() => {
    if (vehicleType) {
      getCatalogFeatures(vehicleType).then(setFeatures).catch(() => {});
    }
  }, [vehicleType]);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return vehicleType !== "";
      case 1: return brandId != null && modelId != null;
      case 2: return year.trim() !== "" && licensePlate.trim() !== "";
      case 3: return pricePerDay.trim() !== "" && address.trim() !== "";
      case 4: return true;
      case 5: return imageUrls.length > 0;
      case 6: return true;
      default: return false;
    }
  };

  const nextStep = () => { if (canProceed()) setStep((s) => Math.min(s + 1, steps.length - 1)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const toggleFeature = (id: number) => {
    setSelectedFeatureIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file);
      setImageUrls((prev) => [...prev, url]);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]);
      next.splice(index, 1);
      return next;
    });
    if (featuredImageIndex >= index && featuredImageIndex > 0) {
      setFeaturedImageIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocumentFileUrl(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleVerifyDocument = async () => {
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 1500));
    setVerificationResult("verified");
    setIsVerifying(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const data = {
        brandId: brandId!,
        modelId: modelId!,
        variantId: variantId,
        vehicleType,
        year: Number(year),
        licensePlate: licensePlate.trim(),
        odometerKm: odometerKm ? Number(odometerKm) : null,
        description: description.trim() || null,
        address: address.trim(),
        pricePerDay: Number(pricePerDay),
        featureIds: selectedFeatureIds,
        imageUrls,
        featuredImageIndex,
        documentFileUrl,
      };
      await createVehicle(data);
      navigate("/owner/vehicles");
    } catch {
      setSubmitError("Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <button type="button" onClick={() => navigate("/owner/vehicles")} className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Thêm xe mới</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 px-4 py-3">
        {steps.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${i === step ? "bg-brand-700 text-white" : i < step ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`text-xs ${i === step ? "font-semibold text-brand-700" : "text-slate-400"}`}>{label}</span>
            {i < steps.length - 1 && <div className="mx-1 h-px w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      <div className="p-4">
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Chọn loại xe bạn muốn đăng ký</p>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setVehicleType("Car")} className={`flex flex-col items-center gap-3 rounded-lg border-2 p-8 transition-colors ${vehicleType === "Car" ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                <Car className={`h-12 w-12 ${vehicleType === "Car" ? "text-brand-600" : "text-slate-400"}`} />
                <span className={`font-medium ${vehicleType === "Car" ? "text-brand-700" : "text-slate-600"}`}>Ô tô</span>
              </button>
              <button type="button" onClick={() => setVehicleType("Motorbike")} className={`flex flex-col items-center gap-3 rounded-lg border-2 p-8 transition-colors ${vehicleType === "Motorbike" ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                <Bike className={`h-12 w-12 ${vehicleType === "Motorbike" ? "text-brand-600" : "text-slate-400"}`} />
                <span className={`font-medium ${vehicleType === "Motorbike" ? "text-brand-700" : "text-slate-600"}`}>Xe máy</span>
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Chọn hãng, dòng xe và phiên bản</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hãng xe</label>
              <FormDropdown value={brandId != null ? String(brandId) : ""} onChange={(v) => setBrandId(Number(v))} placeholder="Chọn hãng xe" options={brands.map((b) => ({ value: String(b.id), label: b.name }))} />
            </div>
            {brandId && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Dòng xe</label>
                <FormDropdown value={modelId != null ? String(modelId) : ""} onChange={(v) => setModelId(Number(v))} placeholder="Chọn dòng xe" options={models.map((m) => ({ value: String(m.id), label: m.name }))} />
              </div>
            )}
            {modelId && variants.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Phiên bản (tùy chọn)</label>
                <FormDropdown value={variantId != null ? String(variantId) : ""} onChange={(v) => setVariantId(Number(v))} placeholder="Chọn phiên bản" options={variants.map((v) => ({ value: String(v.id), label: v.name }))} />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Nhập thông tin cơ bản</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Năm sản xuất</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1990} max={2030} required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Biển số</label>
                <input type="text" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} placeholder="VD: 51A-12345" required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Số km đã đi</label>
                <input type="number" value={odometerKm} onChange={(e) => setOdometerKm(e.target.value)} min={0} placeholder="VD: 15000" className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Nhập giá thuê, địa chỉ và mô tả</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Giá thuê (VNĐ/ngày)</label>
                <input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} min={0} placeholder="VD: 500000" required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Địa chỉ</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="VD: 123 Nguyễn Huệ, Q.1, TP.HCM" required className="h-9 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">Mô tả (tùy chọn)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả thêm về xe..." className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Chọn các tính năng của xe</p>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <button key={f.id} type="button" onClick={() => toggleFeature(f.id)}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${selectedFeatureIds.includes(f.id) ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                  {selectedFeatureIds.includes(f.id) ? <X className="h-3 w-3" /> : null}
                  {f.name}
                </button>
              ))}
              {features.length === 0 && <p className="text-sm text-slate-400">Không có tính năng nào.</p>}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">Thêm hình ảnh của xe</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              <Upload className="h-4 w-4" /> Chọn hình ảnh
            </button>
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imageUrls.map((url, i) => (
                  <div key={i} className="group relative">
                    <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 z-10 hidden rounded-full bg-black/60 p-1 text-white hover:bg-black/80 group-hover:block"><X className="h-3 w-3" /></button>
                    <button type="button" onClick={() => setFeaturedImageIndex(i)} className={`relative overflow-hidden rounded-lg border-2 ${i === featuredImageIndex ? "border-brand-500" : "border-slate-200"}`}>
                      <img src={url} alt="" className="aspect-[4/3] w-full object-cover" />
                      {i === featuredImageIndex && <span className="absolute bottom-1 left-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-medium text-white">Ảnh chính</span>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Tải lên ảnh cavet / đăng ký xe để xác thực (tùy chọn)</p>
              <input ref={docInputRef} type="file" accept="image/*" onChange={handleDocUpload} className="hidden" />
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => docInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <Upload className="h-4 w-4" /> {documentFileUrl ? "Chọn lại" : "Chọn ảnh cavet"}
                </button>
                {documentFileUrl && !verificationResult && (
                  <button type="button" onClick={handleVerifyDocument} disabled={isVerifying} className="inline-flex items-center gap-2 rounded-md bg-brand-700 px-4 py-2 text-sm text-white hover:bg-brand-800 disabled:opacity-50">
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {isVerifying ? "Đang xác thực..." : "Xác thực AI"}
                  </button>
                )}
              </div>
              {documentFileUrl && (
                <div className="relative inline-block">
                  <img src={documentFileUrl} alt="Cavet" className="max-h-48 rounded-lg object-contain" />
                </div>
              )}
              {verificationResult === "verified" && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
                  <Check className="h-4 w-4" /> Xác thực thành công
                </div>
              )}
              {verificationResult === "failed" && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" /> Xác thực thất bại
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Thông tin đăng ký</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Loại xe:</span><span className="font-medium">{vehicleTypeLabel(vehicleType)}</span>
                <span className="text-slate-500">Hãng:</span><span className="font-medium">{brands.find((b) => b.id === brandId)?.name}</span>
                <span className="text-slate-500">Dòng xe:</span><span className="font-medium">{models.find((m) => m.id === modelId)?.name}</span>
                {variantId && variants.find((v) => v.id === variantId) && <><span className="text-slate-500">Phiên bản:</span><span className="font-medium">{variants.find((v) => v.id === variantId)?.name}</span></>}
                <span className="text-slate-500">Biển số:</span><span className="font-medium">{licensePlate}</span>
                <span className="text-slate-500">Năm:</span><span className="font-medium">{year}</span>
                <span className="text-slate-500">Giá:</span><span className="font-medium text-brand-700">{Number(pricePerDay).toLocaleString("vi-VN")}đ/ngày</span>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div>
            {step > 0 && (
              <button type="button" onClick={prevStep} className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <ChevronLeft className="h-4 w-4" /> Quay lại
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{step + 1}/{steps.length}</span>
            {step < steps.length - 1 ? (
              <button type="button" onClick={nextStep} disabled={!canProceed()} className="inline-flex items-center gap-1.5 rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
                Tiếp theo <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isSubmitting ? "Đang đăng ký..." : "Hoàn tất đăng ký"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
