import { useRef, useState } from "react";
import { Upload, Camera, X } from "lucide-react";
import Button from "@/components/common/Button";

interface NationalIdUploadProps {
  onUpload: (frontImage: File, backImage: File) => Promise<unknown>;
  isLoading: boolean;
}

export default function NationalIdUpload({ onUpload, isLoading }: NationalIdUploadProps) {
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    setPreview: (v: string | null) => void,
    setFile: (f: File) => void,
  ) {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFile(file);
    }
  }

  function handleRemove(setPreview: (v: string | null) => void, setFile: (f: null) => void) {
    setPreview(null);
    setFile(null);
  }

  async function handleSubmit() {
    if (!frontFile || !backFile) return;
    await onUpload(frontFile, backFile);
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold text-zinc-900">Tải ảnh CCCD</h1>
      <p className="mb-6 text-zinc-600">Vui lòng tải lên ảnh chụp mặt trước và mặt sau của CCCD.</p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-700">Mặt trước</p>
          {frontPreview ? (
            <div className="relative overflow-hidden rounded-lg border border-zinc-200">
              <img src={frontPreview} alt="Mặt trước CCCD" className="h-48 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                onClick={() => handleRemove(setFrontPreview, setFrontFile)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-brand-400 hover:bg-brand-50"
              onClick={() => frontRef.current?.click()}
            >
              <Upload className="mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">Nhấn để tải ảnh</p>
            </button>
          )}
          <input
            ref={frontRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, setFrontPreview, setFrontFile)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-700">Mặt sau</p>
          {backPreview ? (
            <div className="relative overflow-hidden rounded-lg border border-zinc-200">
              <img src={backPreview} alt="Mặt sau CCCD" className="h-48 w-full object-cover" />
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                onClick={() => handleRemove(setBackPreview, setBackFile)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 transition hover:border-brand-400 hover:bg-brand-50"
              onClick={() => backRef.current?.click()}
            >
              <Camera className="mb-2 h-8 w-8 text-zinc-400" />
              <p className="text-sm text-zinc-500">Nhấn để tải ảnh</p>
            </button>
          )}
          <input
            ref={backRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, setBackPreview, setBackFile)}
          />
        </div>
      </div>

      <Button className="w-full" size="lg" disabled={!frontFile || !backFile} isLoading={isLoading} onClick={handleSubmit}>
        Xác thực CCCD
      </Button>
    </div>
  );
}
