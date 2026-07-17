import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle,
  CloudUpload,
  Hash,
  IdCard,
  Info,
  Lock,
  Shield,
  User,
  X,
} from "lucide-react";
import Button from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { useOwnerApplication } from "@/features/owner/hooks/useOwnerApplication";

export default function CccdVerificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { application, isLoading, error, handleOcrVerification } = useOwnerApplication("upload");
  const [verified, setVerified] = useState(false);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [rejected, setRejected] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!application) return;
    setVerified(Boolean(application.nationalIdVerified));
    setPendingReview(
      application.nationalIdRequestStatus === "Pending" || application.nationalIdRequestStatus === "Processing",
    );
  }, [application]);

  useEffect(() => {
    if (error) setRejected(true);
  }, [error]);

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
    };
  }, [frontPreview]);

  function setFront(file: File) {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontPreview(URL.createObjectURL(file));
    setFrontFile(file);
    setRejected(false);
  }

  async function handleSubmit() {
    if (!frontFile) return;
    setRejected(false);
    setPendingReview(false);
    try {
      const result = await handleOcrVerification(frontFile);
      if (result.status === "Pending") {
        setPendingReview(true);
        return;
      }
      if (result.status === "Verified") {
        navigate("/become-owner");
        return;
      }
      setRejected(true);
    } catch {
      setRejected(true);
    }
  }

  function resetUploads() {
    if (frontPreview) URL.revokeObjectURL(frontPreview);
    setFrontPreview(null);
    setFrontFile(null);
    setRejected(false);
    setPendingReview(false);
  }

  if (isLoading && !application) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-32 rounded-md" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-24 rounded-md" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }

  if (verified) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <DashboardHeader
          eyebrow="Identity check"
          title="CCCD đã được xác thực"
          description="Thông tin căn cước công dân của bạn đã được hệ thống ghi nhận và sẵn sàng dùng cho quy trình thuê xe hoặc đăng ký chủ xe."
          actions={<StatusBadge tone="emerald">Đã xác minh</StatusBadge>}
        />

        <SectionPanel title="Thông tin đã xác thực" description="Dữ liệu được dùng để đối chiếu hồ sơ và hạn chế rủi ro giao dịch.">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Họ và tên</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-950">
                  <User className="h-4 w-4 text-slate-400" />
                  {application?.fullName || user?.fullName || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Số CCCD</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-950">
                  <Hash className="h-4 w-4 text-slate-400" />
                  {application?.nationalIdNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Ngày xác thực</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-slate-950">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {application?.createdAt ? new Date(application.createdAt).toLocaleDateString("vi-VN") : "-"}
                </p>
              </div>
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="flex items-start gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  CCCD đã được xác thực và lưu trữ an toàn.
                </p>
              </div>
            </div>

            {application?.frontImageUrl ? (
              <div>
                <div className="aspect-[16/10] overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                  <img src={application.frontImageUrl} alt="CCCD mặt trước" className="h-full w-full object-cover" />
                </div>
                <p className="mt-2 text-center text-xs font-medium text-slate-500">Ảnh CCCD đã lưu</p>
              </div>
            ) : null}
          </div>
        </SectionPanel>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => navigate("/account")}>
            Quay lại tổng quan
          </Button>
        </div>
      </div>
    );
  }

  if (pendingReview) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <DashboardHeader
          eyebrow="Identity check"
          title="CCCD đang chờ duyệt"
          description="Ảnh CCCD của bạn đã được gửi lên hệ thống. Staff sẽ kiểm tra và cập nhật kết quả trong thời gian sớm nhất."
          actions={<StatusBadge tone="amber">Chờ duyệt</StatusBadge>}
        />

        <SectionPanel title="Trạng thái hồ sơ" description="Bạn có thể quay lại trang này để kiểm tra tiến độ.">
          <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p className="text-sm leading-6 text-amber-800">
              Hồ sơ cần staff đối chiếu thủ công. Trong thời gian chờ duyệt, bạn không cần upload lại nếu ảnh đã rõ và đúng giấy tờ.
            </p>
          </div>
        </SectionPanel>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={() => navigate("/account")}>
            Quay lại tổng quan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <button
        type="button"
        onClick={() => navigate("/account")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </button>

      <DashboardHeader
        eyebrow="Identity check"
        title="Tải lên CCCD / CMND"
        description="Upload ảnh mặt trước rõ nét để hệ thống đọc OCR và chuyển staff duyệt khi cần. Ảnh tốt giúp hồ sơ được xử lý nhanh hơn."
        actions={<StatusBadge tone={rejected ? "rose" : "amber"}>{rejected ? "Cần thử lại" : "Chưa xác minh"}</StatusBadge>}
      />

      {rejected && error ? (
        <div className="flex items-start gap-3 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Không thể xác thực CCCD</p>
            <p className="mt-1 leading-6">{error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Chụp rõ giấy tờ", desc: "Không lóa, không mất góc", icon: IdCard },
          { label: "Upload một mặt", desc: "Mặt trước CCCD/CMND", icon: CloudUpload },
          { label: "Bảo mật dữ liệu", desc: "Dùng cho xác minh hồ sơ", icon: Lock },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-brand-50 p-2 text-brand-700 ring-1 ring-brand-100">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <SectionPanel title="Ảnh mặt trước CCCD" description="Kéo thả ảnh vào khung hoặc chọn từ máy tính của bạn.">
          <div
            onClick={() => document.getElementById("frontImageInput")?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              const file = event.dataTransfer.files?.[0];
              if (file) setFront(file);
            }}
            className={`group relative grid min-h-[320px] cursor-pointer place-items-center overflow-hidden rounded-md border-2 border-dashed transition ${
              dragging
                ? "border-brand-500 bg-brand-50"
                : rejected
                  ? "border-rose-300 bg-rose-50/40"
                  : "border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-brand-50/30"
            }`}
          >
            {frontPreview ? (
              <>
                <img src={frontPreview} alt="CCCD mặt trước" className="h-full max-h-[420px] w-full object-contain p-3" />
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    resetUploads();
                  }}
                  className="absolute right-3 top-3 rounded-md bg-slate-950/70 p-2 text-white transition hover:bg-slate-950"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="px-6 text-center">
                <CloudUpload className="mx-auto h-12 w-12 text-slate-300 transition group-hover:text-brand-500" />
                <p className="mt-4 text-base font-semibold text-slate-700">Kéo thả ảnh vào đây hoặc nhấn để chọn</p>
                <p className="mt-1 text-sm text-slate-500">Hỗ trợ JPG, PNG. Nên dùng ảnh rõ nét, đủ sáng.</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" id="frontImageInput" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) setFront(file);
            }} />
          </div>
        </SectionPanel>

        <SectionPanel title="Hướng dẫn ảnh hợp lệ" description="Ảnh càng rõ thì AI và staff xử lý càng nhanh.">
          <div className="space-y-3">
            {[
              "Đặt giấy tờ nằm gọn trong khung hình, không bị mất góc.",
              "Tránh ánh sáng chói hoặc bóng đổ che chữ.",
              "Chụp trên nền phẳng, tương phản tốt.",
              "Không dùng ảnh bị mờ, rung hoặc đã chỉnh sửa quá nhiều.",
            ].map((text) => (
              <div key={text} className="flex items-start gap-2">
                <span className="mt-0.5 rounded-full bg-emerald-50 p-1 text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-start gap-2 text-sm leading-6 text-slate-600">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
              Dữ liệu giấy tờ được dùng cho xác minh tài khoản và kiểm soát rủi ro giao dịch.
            </p>
          </div>
        </SectionPanel>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" onClick={() => navigate("/account")}>
          Quay lại
        </Button>
        {rejected ? (
          <Button onClick={resetUploads}>
            <Shield className="h-4 w-4" />
            Thử lại
          </Button>
        ) : (
          <Button size="lg" disabled={!frontFile} isLoading={isLoading} onClick={() => void handleSubmit()}>
            <BadgeCheck className="h-5 w-5" />
            Xác thực CCCD
          </Button>
        )}
      </div>
    </div>
  );
}
