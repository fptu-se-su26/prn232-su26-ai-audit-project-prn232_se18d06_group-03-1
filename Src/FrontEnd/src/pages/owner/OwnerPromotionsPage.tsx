import { CheckCircle, XCircle, ArrowLeft, Tag, TicketPercent, DollarSign, Plus, X, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormDropdown from "@/components/common/FormDropdown";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import {
  createPromotion,
  getMyPromotions,
  getPendingPromotions,
  approvePromotion,
  rejectPromotion,
} from "@/features/promotions/services/promotionService";
import type { Promotion } from "@/features/promotions/types";
import { showToast } from "@/components/common/toastStore";

const DISCOUNT_TYPE_OPTIONS = [
  { value: "Fixed", label: "Cố định" },
  { value: "Percentage", label: "Phần trăm" },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: "All", label: "Tất cả" },
  { value: "Motorbike", label: "Xe máy" },
  { value: "Car", label: "Ô tô" },
];

const WHO_BEAR_OPTIONS = [
  { value: "Owner", label: "Chủ xe" },
  { value: "Shared", label: "Chia sẻ" },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDiscount(p: Promotion) {
  return p.discountType === "Fixed" ? formatCurrency(p.discountValue) : `${p.discountValue}%`;
}

function formatWhoBears(p: Promotion) {
  if (p.whoBears === "Owner") return "Chủ xe";
  if (p.whoBears === "Shared" && p.ownerBearsPercent != null) {
    const sys = 100 - p.ownerBearsPercent;
    return `Chia sẻ (${sys}/${p.ownerBearsPercent})`;
  }
  return "Chia sẻ";
}

function formatVehicleType(t: string) {
  return t === "All" ? "Tất cả" : t === "Motorbike" ? "Xe máy" : "Ô tô";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Approved") return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" />Đã duyệt</span>;
  if (status === "Pending") return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Chờ duyệt</span>;
  if (status === "Rejected") return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Từ chối</span>;
  return null;
}

export default function OwnerPromotionsPage() {
  const [tab, setTab] = useState<"pending" | "mine">("pending");
  const [pending, setPending] = useState<Promotion[]>([]);
  const [mine, setMine] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [vehicleType, setVehicleType] = useState("All");
  const [whoBears, setWhoBears] = useState("Owner");
  const [ownerBearsPercent, setOwnerBearsPercent] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [maxUsageCount, setMaxUsageCount] = useState("50");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      setPending(await getPendingPromotions());
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách." });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMine = useCallback(async () => {
    setLoading(true);
    try {
      setMine(await getMyPromotions());
    } catch {
      showToast({ type: "error", title: "Lỗi", message: "Không thể tải danh sách." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "pending") fetchPending();
    else fetchMine();
  }, [tab, fetchPending, fetchMine]);

  const handleApprove = useCallback(async (id: number) => {
    setActionId(id);
    try {
      await approvePromotion(id);
      showToast({ type: "success", title: "Đã duyệt", message: "Mã khuyến mãi đã được chấp nhận." });
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Lỗi duyệt.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setActionId(null);
    }
  }, []);

  const handleReject = useCallback(async (id: number) => {
    setActionId(id);
    try {
      await rejectPromotion(id);
      showToast({ type: "success", title: "Đã từ chối", message: "Mã khuyến mãi đã bị từ chối." });
      setPending((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Lỗi từ chối.";
      showToast({ type: "error", title: "Lỗi", message: msg });
    } finally {
      setActionId(null);
    }
  }, []);

  function resetForm() {
    setCode(""); setName(""); setDescription(""); setDiscountType("Fixed");
    setDiscountValue(""); setMaxDiscountAmount(""); setMinOrderAmount("");
    setVehicleType("All"); setWhoBears("Owner"); setOwnerBearsPercent("");
    setStartAt(""); setEndAt(""); setMaxUsageCount("50"); setFormError("");
  }

  async function handleCreate() {
    const dv = Number(discountValue);
    const muc = Number(maxUsageCount);
    if (!code.trim() || !name.trim()) { setFormError("Vui lòng nhập mã và tên."); return; }
    if (isNaN(dv) || dv <= 0) { setFormError("Giá trị giảm giá phải > 0."); return; }
    if (discountType === "Percentage" && dv > 100) { setFormError("Phần trăm không được > 100%."); return; }
    if (whoBears === "Shared") {
      const obp = Number(ownerBearsPercent);
      if (isNaN(obp) || obp <= 0 || obp >= 100) { setFormError("Phần trăm chủ xe chịu phải > 0 và < 100."); return; }
    }
    if (!startAt) { setFormError("Vui lòng chọn ngày bắt đầu."); return; }

    setCreating(true);
    setFormError("");
    try {
      await createPromotion({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue: dv,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        vehicleType,
        whoBears,
        ownerBearsPercent: whoBears === "Shared" ? Number(ownerBearsPercent) : undefined,
        startAt,
        endAt: endAt || undefined,
        maxUsageCount: muc,
      });
      showToast({ type: "success", title: "Thành công", message: "Đã tạo mã khuyến mãi. Chờ admin duyệt." });
      setShowCreate(false);
      resetForm();
      setTab("mine");
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message || "Tạo thất bại.";
      setFormError(msg);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/owner/dashboard" className="inline-block group mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </div>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Khuyến mãi</h1>
          <p className="text-sm text-slate-500">Tạo và quản lý mã khuyến mãi cho xe của bạn.</p>
        </div>
        <Button variant="primary" onClick={() => { resetForm(); setShowCreate(true); }} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Tạo mã mới
        </Button>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button
          onClick={() => setTab("pending")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "pending" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Chờ tôi duyệt ({pending.length})
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === "mine" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
        >
          Mã của tôi ({mine.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tab === "pending" ? (
        pending.length === 0 ? (
          <Alert variant="info" title="Không có mã chờ duyệt">Không có mã khuyến mãi nào cần bạn duyệt.</Alert>
        ) : (
          <div className="space-y-4">
            {pending.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                        <Tag className="h-3 w-3" />{p.code}
                      </span>
                      <span className="font-semibold text-slate-900">{p.name}</span>
                    </div>
                    {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <TicketPercent className="h-3.5 w-3.5 text-green-600" />
                        Giảm {formatDiscount(p)}
                        {p.maxDiscountAmount && <span className="text-slate-400">(tối đa {formatCurrency(p.maxDiscountAmount)})</span>}
                      </span>
                      <span>Phí: {formatWhoBears(p)}</span>
                      <span>Xe: {formatVehicleType(p.vehicleType)}</span>
                      {p.minOrderAmount && <span>Đơn tối thiểu: {formatCurrency(p.minOrderAmount)}</span>}
                      <span>Sử dụng: {p.usageCount}/{p.maxUsageCount}</span>
                      <span>Hiệu lực: {new Date(p.startAt).toLocaleDateString("vi-VN")}{p.endAt ? ` - ${new Date(p.endAt).toLocaleDateString("vi-VN")}` : " (không giới hạn)"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="primary" isLoading={actionId === p.id} onClick={() => handleApprove(p.id)} className="flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4" /> Duyệt
                    </Button>
                    <Button variant="danger" isLoading={actionId === p.id} onClick={() => handleReject(p.id)} className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" /> Từ chối
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        mine.length === 0 ? (
          <Alert variant="info" title="Chưa có mã">Bạn chưa tạo mã khuyến mãi nào.</Alert>
        ) : (
          <div className="space-y-3">
            {mine.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">
                      <Tag className="h-3 w-3" />{p.code}
                    </span>
                    <span className="font-medium text-slate-900">{p.name}</span>
                    <span className="text-sm text-slate-500">Giảm {formatDiscount(p)}</span>
                  </div>
                  <StatusBadge status={p.approvalStatus} />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Tạo mã khuyến mãi</h2>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>

            {formError && <Alert variant="error" title="Lỗi">{formError}</Alert>}

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Mã <span className="text-red-500">*</span></label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: SUMMER2024"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm uppercase outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Tên <span className="text-red-500">*</span></label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Giảm giá mùa hè"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Mô tả..."
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Loại giảm giá <span className="text-red-500">*</span></label>
                  <FormDropdown value={discountType} onChange={setDiscountType} options={DISCOUNT_TYPE_OPTIONS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Giá trị {discountType === "Percentage" ? "(%)" : "(VNĐ)"} <span className="text-red-500">*</span></label>
                  <input type="number" step="any" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "Percentage" ? "10" : "50000"}
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Loại xe</label>
                  <FormDropdown value={vehicleType} onChange={setVehicleType} options={VEHICLE_TYPE_OPTIONS} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Ai chịu phí <span className="text-red-500">*</span></label>
                  <FormDropdown value={whoBears} onChange={(v) => { setWhoBears(v); setOwnerBearsPercent(""); }} options={WHO_BEAR_OPTIONS} />
                </div>
              </div>

              {whoBears === "Shared" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Chủ xe chịu (%) <span className="text-red-500">*</span></label>
                  <input type="number" min={1} max={99} value={ownerBearsPercent} onChange={(e) => setOwnerBearsPercent(e.target.value)} placeholder="60"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                  <span className="mt-1 block text-xs text-slate-500">Hệ thống chịu phần còn lại ({ownerBearsPercent ? 100 - Number(ownerBearsPercent) : "—"}%).</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Ngày bắt đầu <span className="text-red-500">*</span></label>
                  <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Ngày kết thúc</label>
                  <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Giảm tối đa (VNĐ)</label>
                  <input type="number" value={maxDiscountAmount} onChange={(e) => setMaxDiscountAmount(e.target.value)} placeholder="Không bắt buộc"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Đơn tối thiểu (VNĐ)</label>
                  <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="Không bắt buộc"
                    className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Số lần sử dụng tối đa</label>
                <input type="number" min={1} value={maxUsageCount} onChange={(e) => setMaxUsageCount(e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="primary" isLoading={creating} onClick={handleCreate} className="flex items-center gap-1.5">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Tạo mã
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
