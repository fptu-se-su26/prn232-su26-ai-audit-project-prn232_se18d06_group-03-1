import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Camera, CheckCircle, X, ArrowLeft, Info, Lock, CloudUpload, IdCard, Calendar, User, Hash, BadgeCheck } from "lucide-react";
import Button from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";

export default function CccdVerificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { application, isLoading, error, handleOcrVerification } = useOwnerApplication("upload");
  const [verified, setVerified] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [rejected, setRejected] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (application) {
      setInitialLoading(false);
      if (application.nationalIdVerified) setVerified(true);
    }
  }, [application]);

  useEffect(() => {
    if (error) setRejected(true);
  }, [error]);

  async function handleSubmit() {
    if (!frontFile || !backFile) return;
    setRejected(false);
    try {
      await handleOcrVerification(frontFile, backFile);
      navigate("/become-owner");
    } catch {
      setRejected(true);
    }
  }

  function resetUploads() {
    setFrontPreview(null);
    setBackPreview(null);
    setFrontFile(null);
    setBackFile(null);
    setRejected(false);
  }

  if (initialLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <Skeleton className="mb-4 h-4 w-24" />
        <Skeleton className="mx-auto mb-8 h-6 w-64" />
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="mx-auto max-w-lg py-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 shadow-sm">
            <BadgeCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">CCCD đã được xác thực</h1>
          <p className="mt-1 text-sm text-slate-500">Thông tin căn cước công dân của bạn đã được xác minh thành công</p>
        </div>

        {/* Simulated ID card */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {/* Card header */}
          <div className="bg-gradient-to-r from-brand-700 to-brand-800 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <IdCard className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Căn cước công dân</p>
                <p className="text-sm font-bold text-white">CCCD đã xác thực</p>
              </div>
            </div>
          </div>

          {/* Card body */}
          <div className="px-5 py-5">
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">Họ và tên</p>
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-semibold text-slate-900">{application?.fullName || user?.fullName || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Số CCCD</p>
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-semibold text-slate-900">{application?.nationalIdNumber || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Ngày xác thực</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <p className="text-sm font-semibold text-slate-900">
                      {application?.createdAt
                        ? new Date(application.createdAt).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ảnh CCCD nếu có */}
              {application?.frontImageUrl && (
                <div className="shrink-0">
                  <div className="h-24 w-36 overflow-hidden rounded-lg border border-slate-200">
                    <img src={application.frontImageUrl} alt="CCCD mặt trước" className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 text-center text-[10px] text-slate-400">Mặt trước</p>
                </div>
              )}
            </div>

            {/* Verified stamp */}
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-medium text-emerald-700">Thông tin CCCD đã được xác thực và lưu trữ an toàn</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link to="/account">
            <Button variant="secondary">Quay lại tổng quan</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <button onClick={() => navigate("/account")} className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      {/* Error Banner */}
      {rejected && error && (
        <div className="mb-6 flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Info className="h-4 w-4 text-red-600" />
          </span>
          <div>
            <p className="text-sm font-semibold text-red-800">Không thể xác thực căn cước công dân</p>
            <p className="mt-1 text-sm text-red-700">
              {error.includes("FPT.AI") || error.includes("BadRequest")
                ? "Hình ảnh không hợp lệ hoặc quá mờ. Vui lòng kiểm tra lại ảnh chụp của bạn."
                : error}
            </p>
          </div>
        </div>
      )}

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {[
          { label: "Chọn loại", step: 1 },
          { label: "Tải ảnh", step: 2 },
          { label: "Xác thực", step: 3 },
        ].map((s, i) => (
          <div key={s.step} className="flex items-center gap-2">
            <div className="flex items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s.step < 2 ? "bg-purple-700 text-white" : s.step === 2 ? "bg-purple-700 text-white" : "border-2 border-zinc-300 text-zinc-400"
              }`}>
                {s.step === 1 ? <CheckCircle className="h-4 w-4" /> : s.step}
              </div>
              <span className={`ml-2 text-sm font-semibold ${s.step === 2 ? "text-purple-700" : "text-zinc-500"}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div className={`mx-4 h-0.5 w-16 ${s.step <= 2 ? "bg-purple-700" : "bg-zinc-200"}`} />}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-zinc-900">Tải lên CCCD của bạn</h1>
        <p className="mt-1 text-zinc-500">Vui lòng tải lên ảnh chụp căn cước công dân chất lượng cao.</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Upload Area */}
        <div className="space-y-6 md:col-span-2">
          {/* Front Side */}
          <div className={`group relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition ${
            rejected ? "border-red-300 bg-red-50/50" : "border-zinc-300 bg-white hover:border-purple-400"
          }`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">Mặt trước CCCD</h3>
              <Camera className="h-5 w-5 text-purple-700" />
            </div>
            {frontPreview ? (
              <div className="relative">
                <img src={frontPreview} alt="Mặt trước" className="h-48 w-full rounded-lg object-cover" />
                <button onClick={() => { setFrontPreview(null); setFrontFile(null); }} className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => frontRef.current?.click()} className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-purple-400 hover:bg-purple-50">
                <div className="scan-line" />
                <CloudUpload className="h-10 w-10 text-zinc-300 group-hover:text-purple-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-600">Nhấn để chọn ảnh</p>
                  <p className="text-xs text-zinc-400">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
                </div>
              </button>
            )}
            <input ref={frontRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFrontPreview(URL.createObjectURL(f)); setFrontFile(f); setRejected(false); }}} />
            {rejected && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600">
                <Info className="h-3 w-3" /> Ảnh không hợp lệ hoặc bị mờ
              </p>
            )}
          </div>

          {/* Back Side */}
          <div className={`group relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition ${
            rejected ? "border-red-300 bg-red-50/50" : "border-zinc-300 bg-white hover:border-purple-400"
          }`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-800">Mặt sau CCCD</h3>
              <Camera className="h-5 w-5 text-purple-700" />
            </div>
            {backPreview ? (
              <div className="relative">
                <img src={backPreview} alt="Mặt sau" className="h-48 w-full rounded-lg object-cover" />
                <button onClick={() => { setBackPreview(null); setBackFile(null); }} className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => backRef.current?.click()} className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50 transition hover:border-purple-400 hover:bg-purple-50">
                <div className="scan-line" />
                <CloudUpload className="h-10 w-10 text-zinc-300 group-hover:text-purple-500" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-600">Nhấn để chọn ảnh</p>
                  <p className="text-xs text-zinc-400">Hỗ trợ JPG, PNG (tối đa 5MB)</p>
                </div>
              </button>
            )}
            <input ref={backRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setBackPreview(URL.createObjectURL(f)); setBackFile(f); setRejected(false); }}} />
            {rejected && (
              <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-red-600">
                <Info className="h-3 w-3" /> Không nhận diện được thẻ
              </p>
            )}
          </div>
        </div>

        {/* Guidelines Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-purple-900">
              <Info className="h-4 w-4" />
              Hướng dẫn chụp ảnh
            </h4>
            <div className="space-y-3">
              {[
                "Đảm bảo thẻ nằm gọn trong khung hình và chữ rõ ràng.",
                "Tránh ánh sáng chói hoặc bóng đổ lên thẻ.",
                "Đặt thẻ trên mặt phẳng tối màu để có độ tương phản tốt.",
              ].map((text) => (
                <div key={text} className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-200">
                    <CheckCircle className="h-3 w-3 text-purple-700" />
                  </span>
                  <span className="text-xs text-zinc-600">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-white p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
            <div>
              <p className="text-sm font-semibold text-zinc-800">Mã hóa bảo mật</p>
              <p className="text-xs text-zinc-500">Dữ liệu của bạn được xử lý an toàn và không lưu trữ trên máy chủ công cộng.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-100 pt-6 md:flex-row">
        <Button variant="secondary" onClick={() => navigate("/account")}>
          Quay lại
        </Button>
        {rejected ? (
          <Button onClick={resetUploads} className="min-w-[160px]">
            <Camera className="h-4 w-4" />
            Thử lại
          </Button>
        ) : (
          <Button className="min-w-[200px]" size="lg" disabled={!frontFile || !backFile} isLoading={isLoading} onClick={handleSubmit}>
            <Shield className="h-5 w-5" />
            Xác thực CCCD
          </Button>
        )}
      </div>

      <style>{`
        .scan-line {
          position: absolute;
          inset: 0;
          height: 2px;
          background: #7c3aed;
          box-shadow: 0 0 8px #7c3aed;
          z-index: 10;
          opacity: 0;
          pointer-events: none;
        }
        .group:hover .scan-line,
        .group:focus-within .scan-line {
          opacity: 0.6;
          animation: scan 2s linear infinite;
        }
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
