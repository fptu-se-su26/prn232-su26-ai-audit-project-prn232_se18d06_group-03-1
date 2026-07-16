import { useState } from "react";
import Alert from "@/components/common/Alert";
import Button from "@/components/common/Button";
import FormField from "@/components/common/FormField";
import Modal from "@/components/common/Modal";
import PasswordField from "@/components/common/PasswordField";
import { createCustomer } from "@/features/admin/services/adminUserService";
import { getApiErrorMessage } from "@/services/apiClient";

type Props = { isOpen: boolean; onClose: () => void; onCreated: () => void };

const emptyForm = { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };

export default function CreateCustomerModal({ isOpen, onClose, onCreated }: Props) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError("Vui lòng nhập đầy đủ thông tin bắt buộc."); return;
    }
    if (form.password !== form.confirmPassword) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      await createCustomer({ ...form, fullName: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim() });
      setForm(emptyForm);
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Không thể tạo tài khoản khách hàng."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} title="Thêm khách hàng" onClose={onClose}>
      <div className="space-y-4">
        <Alert variant="info">Email được xác thực và tài khoản được kích hoạt ngay sau khi admin tạo.</Alert>
        {error && <Alert variant="error">{error}</Alert>}
        <FormField label="Họ và tên" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        <FormField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <FormField label="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <PasswordField label="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <PasswordField label="Xác nhận mật khẩu" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Hủy</Button>
          <Button isLoading={loading} onClick={() => void submit()}>Tạo khách hàng</Button>
        </div>
      </div>
    </Modal>
  );
}
