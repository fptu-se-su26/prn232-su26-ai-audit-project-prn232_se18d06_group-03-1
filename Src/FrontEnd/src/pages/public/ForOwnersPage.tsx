import { Link } from "react-router-dom";
import { BadgeCheck, Banknote, CarFront, FileCheck2 } from "lucide-react";

const benefits = [
  {
    icon: Banknote,
    title: "Tăng hiệu quả khai thác xe",
    text: "Đăng xe cho thuê và tiếp cận khách hàng có nhu cầu di chuyển thật.",
  },
  {
    icon: FileCheck2,
    title: "Quy trình đăng ký rõ ràng",
    text: "Chủ xe được hướng dẫn bổ sung thông tin tài khoản, xác thực và hồ sơ liên quan.",
  },
  {
    icon: BadgeCheck,
    title: "Quản lý yêu cầu tập trung",
    text: "Theo dõi yêu cầu thuê, thông tin xe và trạng thái xử lý trong khu vực chủ xe.",
  },
];

export default function ForOwnersPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
              Dành cho chủ xe
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-[56px]">
              Biến xe rảnh thành{" "}
              <span className="bg-gradient-to-r from-brand-700 via-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                nguồn thu nhập
              </span>{" "}
              có kiểm soát
            </h1>
            <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
              MoveVN giúp chủ xe đăng ký, quản lý phương tiện và tiếp nhận yêu cầu thuê trong
              một hệ thống riêng cho vai trò Owner.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register-owner"
                className="inline-flex h-12 items-center rounded bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700 shadow-md hover:shadow-lg"
              >
                Đăng ký chủ xe
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex h-12 items-center rounded border border-slate-300 px-6 text-sm font-bold text-slate-800 transition hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-100"
              >
                Xem cách hoạt động
              </Link>
            </div>
          </div>

          <div className="rounded border border-slate-200 bg-white p-8 dark:border-neutral-800 dark:bg-neutral-950/70 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)]">
            <CarFront className="h-10 w-10 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-5 text-xl font-black uppercase tracking-tight">Điều kiện cơ bản</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-600 dark:text-gray-400">
              <li>Có tài khoản MoveVN và thông tin liên hệ hợp lệ.</li>
              <li>Hoàn tất các bước xác thực cần thiết theo quy trình trong hệ thống.</li>
              <li>Xe có thông tin, hình ảnh và giá thuê rõ ràng trước khi công khai.</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded border border-slate-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-950/70 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] transition hover:scale-[1.02] duration-300">
                <Icon className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                <h2 className="mt-5 text-sm font-black uppercase tracking-wider">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-gray-400">{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
