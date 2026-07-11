import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { showToast } from "@/components/common/toastStore";
import { uploadSupportTicketAttachment } from "@/features/supportTickets/supportTicketService";

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

type SupportTicketAttachmentInputProps = {
  disabled?: boolean;
  onChange: (urls: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  value: string[];
};

export default function SupportTicketAttachmentInput({ disabled = false, onChange, onUploadingChange, value }: SupportTicketAttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_ATTACHMENTS - value.length;
    if (remainingSlots <= 0) {
      showToast({ type: "error", title: "Không thể thêm ảnh", message: `Mỗi tin nhắn chỉ được đính kèm tối đa ${MAX_ATTACHMENTS} ảnh.` });
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        showToast({ type: "error", title: "Ảnh không hợp lệ", message: "Chỉ hỗ trợ JPG, PNG hoặc WebP." });
        continue;
      }

      if (file.size > MAX_ATTACHMENT_SIZE) {
        showToast({ type: "error", title: "Ảnh quá lớn", message: "Mỗi ảnh phải nhỏ hơn 5MB." });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    onUploadingChange?.(true);
    try {
      const uploadedUrls = await Promise.all(validFiles.map((file) => uploadSupportTicketAttachment(file)));
      onChange([...value, ...uploadedUrls]);
    } catch {
      showToast({ type: "error", title: "Không thể upload ảnh", message: "Vui lòng thử lại sau." });
    } finally {
      setIsUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAttachment(url: string) {
    onChange(value.filter((item) => item !== url));
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || isUploading || value.length >= MAX_ATTACHMENTS}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Thêm ảnh
        </button>
        <span className="text-xs text-slate-500">{value.length}/{MAX_ATTACHMENTS} ảnh, tối đa 5MB/ảnh</span>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((url) => (
            <div key={url} className="group relative overflow-hidden rounded-md border border-slate-200 bg-slate-50">
              <img src={url} alt="" className="aspect-square w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(url)}
                disabled={disabled || isUploading}
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-90 transition hover:bg-black disabled:cursor-not-allowed"
                aria-label="Xóa ảnh"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
