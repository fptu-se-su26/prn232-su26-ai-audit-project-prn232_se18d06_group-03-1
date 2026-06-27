import { useState } from "react";
import { AlertCircle, CheckCircle, Loader2, Power, PowerOff, X } from "lucide-react";
import { AxiosError } from "axios";
import Modal from "./Modal";
import Button from "./Button";
import type { ApiResponse } from "@/features/auth/types";

type ActiveToggleProps = {
  isActive: boolean;
  itemName: string;
  onToggle: () => Promise<void> | void;
  cascadeInfo?: () => Promise<{ affectedModelCount?: number; affectedVariantCount?: number } | null>;
};

export default function ActiveToggle({ isActive, itemName, onToggle, cascadeInfo }: ActiveToggleProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cascade, setCascade] = useState<{ affectedModelCount?: number; affectedVariantCount?: number } | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function openConfirm() {
    setToggleError(null);
    if (!isActive || !cascadeInfo) {
      setCascade(null);
      setConfirmOpen(true);
      return;
    }
    setLoading(true);
    try {
      const info = await cascadeInfo();
      setCascade(info);
      setConfirmOpen(true);
    } finally {
      setLoading(false);
    }
  }

  const errorMessages: Record<string, string> = {
    "BRAND_8002": "Không thể kích hoạt vì hãng xe đang bị tắt.",
    "MODEL_8102": "Không thể kích hoạt vì dòng xe đang bị tắt.",
  };

  async function handleConfirm() {
    setToggleError(null);
    try {
      await onToggle();
      setConfirmOpen(false);
    } catch (err) {
      let msg = "Có lỗi xảy ra.";
      if (err instanceof AxiosError) {
        const data = err.response?.data as ApiResponse<unknown> | undefined;
        msg = (data?.code && errorMessages[data.code]) ?? data?.message ?? msg;
      }
      setToggleError(msg);
    }
  }

  const cascadeMessages: string[] = [];
  if (cascade) {
    if (cascade.affectedModelCount && cascade.affectedModelCount > 0) cascadeMessages.push(`${cascade.affectedModelCount} dòng xe`);
    if (cascade.affectedVariantCount && cascade.affectedVariantCount > 0) cascadeMessages.push(`${cascade.affectedVariantCount} phiên bản`);
  }

  return (
    <>
      <button type="button" onClick={() => void openConfirm()} disabled={loading}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${isActive ? "bg-brand-500" : "bg-slate-300"} ${loading ? "cursor-wait opacity-60" : ""}`}>
        {loading ? (
          <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin text-white" />
        ) : (
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${isActive ? "translate-x-[18px]" : "translate-x-[2px]"}`} />
        )}
      </button>
      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-red-100"     : "bg-brand-100"}`}>
            {isActive
              ? <PowerOff className="h-5 w-5 text-red-600" />
              : <Power className="h-5 w-5 text-brand-600" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900">
              {isActive ? "Tắt hoạt động" : "Kích hoạt"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Bạn có chắc muốn {isActive ? "tắt" : "kích hoạt"} <strong>"{itemName}"</strong>?
            </p>
            {cascadeMessages.length > 0 && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Tắt <strong>"{itemName}"</strong> sẽ kéo theo tắt {cascadeMessages.join(" và ")}.
              </p>
            )}
            {toggleError && (
              <div className="mt-2 flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{toggleError}</span>
                <button type="button" onClick={() => setToggleError(null)} className="shrink-0 text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button onClick={() => void handleConfirm()}
            className={isActive ? "bg-red-600 hover:bg-red-700" : "bg-brand-600 hover:bg-brand-700"}>
            <CheckCircle className="h-4 w-4" />
            Xác nhận
          </Button>
        </div>
      </Modal>
    </>
  );
}
