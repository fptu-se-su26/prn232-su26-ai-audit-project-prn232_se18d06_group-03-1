import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-4">
      <div>
        <div className="text-sm font-semibold text-brand-700">404</div>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-600">Đường dẫn bạn đang mở không tồn tại hoặc đã được thay đổi.</p>
      </div>
      <Link to="/">
        <Button type="button">Về trang chủ</Button>
      </Link>
    </div>
  );
}
