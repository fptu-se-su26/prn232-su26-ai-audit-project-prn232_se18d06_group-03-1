import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import Modal from "@/components/common/Modal";
import type { DriverLicenseClassResponse } from "@/features/driverLicenseClasses/types";

function systemVersionLabel(value: string) {
  return value === "LegacyBefore2025" ? "Bằng cũ" : "Hiện hành";
}

export default function LicenseCompatibilityModal({
  isOpen,
  license,
  compatibleClasses,
  isLoading,
  onClose,
}: {
  isOpen: boolean;
  license: DriverLicenseClassResponse | null;
  compatibleClasses: DriverLicenseClassResponse[];
  isLoading: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hạng GPLX được phép lái">
      <div className="space-y-4">
        {license && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">{license.code} - {license.displayName}</div>
            <div className="mt-1 text-xs text-slate-500">{systemVersionLabel(license.systemVersion)}</div>
            <p className="mt-2 text-sm text-slate-600">{license.description}</p>
          </div>
        )}

        <div>
          <div className="mb-2 text-sm font-medium text-slate-700">Bằng này được lái xe yêu cầu các hạng:</div>
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <LoadingSpinner className="h-4 w-4" /> Đang tải...
            </div>
          ) : compatibleClasses.length > 0 ? (
            <div className="popup-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
              {compatibleClasses.map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 px-3 py-2">
                  <div className="text-sm font-medium text-slate-900">{item.code} - {item.displayName}</div>
                  <div className="mt-1 text-xs text-slate-500">{systemVersionLabel(item.systemVersion)}</div>
                  <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-slate-200 px-3 py-4 text-sm text-slate-500">Chưa có dữ liệu tương thích.</div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}
