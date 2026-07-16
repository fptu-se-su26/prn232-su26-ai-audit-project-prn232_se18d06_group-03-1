import { useState } from "react";
import { ScanLine } from "lucide-react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import Modal from "@/components/common/Modal";
import PasswordField from "@/components/common/PasswordField";
import { createOwner, previewOwnerOcr } from "@/features/admin/services/adminUserService";
import AddressTextAutocomplete from "@/features/locations/components/AddressTextAutocomplete";
import { VIETNAM_BANKS } from "@/features/owner/data/banks";
import { getApiErrorMessage } from "@/services/apiClient";

type Props = { isOpen: boolean; onClose: () => void; onCreated: () => void };
type VehicleType = "Car" | "Motorbike";

const initialForm = {
  fullName: "", email: "", phone: "", password: "", confirmPassword: "",
  useOcr: true, nationalId: "", dateOfBirth: "", address: "",
  driverLicenseNumber: "", driverLicenseClass: "", driverLicenseVehicleType: "Car" as VehicleType,
  bankName: "", bankAccountNumber: "", bankAccountHolderName: "",
};

function FileField({ label, required, onChange }: { label: string; required?: boolean; onChange: (file: File | null) => void }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
      {label}{required ? " *" : ""}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-700 file:mr-3 file:rounded file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:font-medium file:text-brand-700" />
      <span className="text-xs font-normal text-slate-500">JPG, PNG hoặc WebP, tối đa 5MB.</span>
    </label>
  );
}

export default function CreateOwnerModal({ isOpen, onClose, onCreated }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [nationalFront, setNationalFront] = useState<File | null>(null);
  const [licenseFront, setLicenseFront] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  function reset() {
    setStep(1); setForm(initialForm); setNationalFront(null); setLicenseFront(null); setError(""); setNotice("");
  }

  function close() { reset(); onClose(); }

  function next() {
    setError("");
    if (step === 1 && (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password || form.password !== form.confirmPassword)) {
      setError("Vui lòng nhập đầy đủ thông tin tài khoản và kiểm tra mật khẩu."); return;
    }
    if (step === 2 && (!nationalFront || !licenseFront || !form.nationalId.trim() || !form.driverLicenseNumber.trim() || !form.driverLicenseClass.trim())) {
      setError("Vui lòng upload ảnh và nhập đủ thông tin CCCD/GPLX."); return;
    }
    if (step === 3 && (!form.bankName || !form.bankAccountNumber.trim() || !form.bankAccountHolderName.trim())) {
      setError("Vui lòng nhập đầy đủ thông tin ngân hàng."); return;
    }
    setStep((current) => Math.min(4, current + 1));
  }

  async function runOcr() {
    if (!nationalFront && !licenseFront) { setError("Vui lòng chọn ảnh CCCD hoặc GPLX trước khi chạy OCR."); return; }
    setError(""); setNotice(""); setOcrLoading(true);
    try {
      const result = await previewOwnerOcr(form.fullName, nationalFront, licenseFront);
      setForm((current) => ({
        ...current,
        fullName: result.nationalId?.fullName || result.driverLicense?.fullName || current.fullName,
        nationalId: result.nationalId?.nationalId || current.nationalId,
        dateOfBirth: result.nationalId?.dateOfBirth || current.dateOfBirth,
        address: result.nationalId?.address || current.address,
        driverLicenseNumber: result.driverLicense?.driverLicenseNumber || current.driverLicenseNumber,
        driverLicenseClass: result.driverLicense?.licenseClass || current.driverLicenseClass,
      }));
      setNotice("OCR đã điền dữ liệu. Vui lòng kiểm tra và chỉnh sửa trước khi tiếp tục.");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Không thể đọc OCR từ ảnh."));
    } finally { setOcrLoading(false); }
  }

  async function submit() {
    if (!nationalFront || !licenseFront) return;
    setError(""); setLoading(true);
    try {
      await createOwner({
        ...form,
        fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
        dateOfBirth: form.dateOfBirth || null, address: form.address.trim() || null,
        nationalIdFrontImage: nationalFront,
        driverLicenseFrontImage: licenseFront,
      });
      reset(); onCreated(); onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Không thể tạo tài khoản chủ xe."));
    } finally { setLoading(false); }
  }

  return (
    <Modal isOpen={isOpen} title="Thêm chủ xe" onClose={close} className="max-w-3xl">
      <div className="space-y-5">
        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-slate-500">
          {["Tài khoản", "Giấy tờ", "Ngân hàng", "Xác nhận"].map((label, index) => (
            <div key={label} className={`border-b-2 pb-2 text-center ${step === index + 1 ? "border-brand-600 text-brand-700" : "border-slate-200"}`}>{index + 1}. {label}</div>
          ))}
        </div>
        {error && <Alert variant="error">{error}</Alert>}
        {notice && <Alert variant="success">{notice}</Alert>}

        {step === 1 && <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Họ và tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <FormField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <FormField label="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div />
          <PasswordField label="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <PasswordField label="Xác nhận mật khẩu" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          <div className="sm:col-span-2"><Alert variant="info">Backend sẽ xác thực email, kích hoạt tài khoản và gán đồng thời role Customer + Owner.</Alert></div>
        </div>}

        {step === 2 && <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.useOcr} onChange={(e) => setForm({ ...form, useOcr: e.target.checked })} />
              Sử dụng OCR/AI để điền thông tin
            </label>
            {form.useOcr && <Button variant="secondary" isLoading={ocrLoading} onClick={() => void runOcr()}><ScanLine className="h-4 w-4" />Đọc thông tin từ ảnh</Button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FileField label="Ảnh mặt trước CCCD" required onChange={setNationalFront} />
            <FormField label="Số CCCD" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })} />
            <FormField label="Ngày sinh" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            <div className="sm:col-span-2">
              <AddressTextAutocomplete
                label="Địa chỉ"
                placeholder="Nhập địa chỉ trên CCCD để tìm gợi ý"
                value={form.address}
                onChange={(address) => setForm((current) => ({ ...current, address }))}
                onSelect={(address) => setForm((current) => ({ ...current, address }))}
              />
            </div>
            <FileField label="Ảnh GPLX" required onChange={setLicenseFront} />
            <div className="grid gap-1.5"><label className="text-sm font-semibold text-slate-800">Loại phương tiện</label><select value={form.driverLicenseVehicleType} onChange={(e) => setForm({ ...form, driverLicenseVehicleType: e.target.value as VehicleType })} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"><option value="Car">Ô tô</option><option value="Motorbike">Xe máy</option></select></div>
            <FormField label="Số GPLX" value={form.driverLicenseNumber} onChange={(e) => setForm({ ...form, driverLicenseNumber: e.target.value })} />
            <FormField label="Hạng GPLX" value={form.driverLicenseClass} onChange={(e) => setForm({ ...form, driverLicenseClass: e.target.value })} />
          </div>
        </div>}

        {step === 3 && <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2"><label className="text-sm font-semibold text-slate-800">Ngân hàng</label><select value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="h-11 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-500"><option value="">Chọn ngân hàng</option>{VIETNAM_BANKS.map((bank) => <option key={bank.code} value={bank.name}>{bank.name}</option>)}</select></div>
          <FormField label="Số tài khoản" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
          <FormField label="Tên chủ tài khoản" value={form.bankAccountHolderName} onChange={(e) => setForm({ ...form, bankAccountHolderName: e.target.value.toUpperCase() })} />
        </div>}

        {step === 4 && <div className="space-y-3 text-sm text-slate-700">
          <Alert variant="warning">Hãy kiểm tra kỹ. Khi tạo, backend sẽ đánh dấu giấy tờ đã được admin duyệt và tài khoản hoạt động ngay.</Alert>
          <div className="grid gap-3 rounded-md border border-slate-200 p-4 sm:grid-cols-2">
            <p><span className="text-slate-500">Chủ xe:</span> {form.fullName}</p><p><span className="text-slate-500">Email:</span> {form.email}</p>
            <p><span className="text-slate-500">CCCD:</span> {form.nationalId}</p><p><span className="text-slate-500">GPLX:</span> {form.driverLicenseNumber} - {form.driverLicenseClass}</p>
            <p><span className="text-slate-500">Xác minh:</span> {form.useOcr ? "OCR, admin xác nhận" : "Admin nhập thủ công"}</p><p><span className="text-slate-500">Ngân hàng:</span> {form.bankName}</p>
          </div>
        </div>}

        <div className="flex justify-between border-t border-slate-100 pt-4">
          <Button variant="secondary" onClick={() => step === 1 ? close() : setStep(step - 1)}>{step === 1 ? "Hủy" : "Quay lại"}</Button>
          {step < 4 ? <Button onClick={next}>Tiếp tục</Button> : <Button isLoading={loading} onClick={() => void submit()}>Tạo chủ xe</Button>}
        </div>
      </div>
    </Modal>
  );
}
