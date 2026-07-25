import { ArrowLeft, Tag } from "lucide-react";
import { Link } from "react-router-dom";
import Alert from "@/components/common/Alert";

export default function CustomerPromotionsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/" className="inline-block group mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Quay lại
        </div>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100">
          <Tag className="h-5 w-5 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Ưu đãi hôm nay</h1>
      </div>

      <Alert variant="info" title="Chưa có ưu đãi">
        Hiện tại chưa có chương trình khuyến mãi nào đang diễn ra. Bạn có thể quay lại sau hoặc tra cứu mã giảm giá bằng cách{' '}
        <Link to="/customer/bookings" className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2">
          đặt xe ngay
        </Link>
        .
      </Alert>
    </div>
  );
}
