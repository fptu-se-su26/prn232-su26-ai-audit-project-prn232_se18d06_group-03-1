import { Link } from "react-router-dom";
import { CalendarCheck, CarFront, ClipboardCheck, Search } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "1. Tìm xe",
    text: "Lọc theo loại xe, khu vực, hãng xe và ngân sách để chọn phương tiện phù hợp.",
  },
  {
    icon: ClipboardCheck,
    title: "2. Kiểm tra thông tin",
    text: "Xem ảnh, giá thuê, tiền cọc, địa điểm và các thông tin cơ bản trước khi đặt.",
  },
  {
    icon: CalendarCheck,
    title: "3. Đặt lịch",
    text: "Đăng nhập, tạo yêu cầu thuê xe và theo dõi trạng thái trong khu vực tài khoản.",
  },
  {
    icon: CarFront,
    title: "4. Nhận và trả xe",
    text: "Làm việc với chủ xe theo lịch đã xác nhận, kiểm tra xe và hoàn tất chuyến đi.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
              Cách hoạt động
            </p>
            <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              Từ tìm xe đến đặt xe trong{" "}
              <span className="italic lowercase text-brand-600 dark:text-brand-400">
                một luồng
              </span>{" "}
              rõ ràng
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
              Luồng công khai của MoveVN tập trung vào việc giúp khách thuê ra quyết định nhanh,
              giảm bất ngờ về giá và đưa người dùng vào đúng bước tiếp theo.
            </p>
            <Link
              to="/vehicle"
              className="mt-8 inline-flex h-12 items-center rounded bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700 shadow-md hover:shadow-lg"
            >
              Bắt đầu tìm xe
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded border border-slate-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950/70 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] transition hover:scale-[1.02] duration-300">
                  <Icon className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                  <h2 className="mt-5 text-sm font-black uppercase tracking-wider">{step.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-gray-400">{step.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
