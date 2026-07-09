import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Minh bạch và an toàn",
    text: "MoveVN ưu tiên xe được xác minh, thông tin rõ ràng và quy trình đặt xe dễ theo dõi.",
  },
  {
    icon: UsersRound,
    title: "Kết nối hai chiều",
    text: "Khách thuê tìm được xe phù hợp, chủ xe có thêm kênh khai thác tài sản hiệu quả.",
  },
  {
    icon: CheckCircle2,
    title: "Vận hành gọn gàng",
    text: "Từ tìm xe, đặt xe đến hỗ trợ sau chuyến đi đều được gom trong một trải nghiệm thống nhất.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
            Về MoveVN
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Nền tảng thuê xe{" "}
            <span className="italic lowercase text-brand-600 dark:text-brand-400">
              minh bạch
            </span>{" "}
            cho mọi hành trình
          </h1>
          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
            MoveVN kết nối khách hàng cần thuê xe với chủ xe uy tín, giúp quá trình tìm xe, xem giá,
            đặt lịch và nhận hỗ trợ trở nên rõ ràng hơn.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/vehicle"
              className="inline-flex h-12 items-center rounded bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700 shadow-md hover:shadow-lg"
            >
              Xem xe đang cho thuê
            </Link>
            <Link
              to="/for-owners"
              className="inline-flex h-12 items-center rounded border border-slate-300 px-6 text-sm font-bold text-slate-800 transition hover:border-brand-300 hover:text-brand-700 dark:border-neutral-800 dark:text-gray-100"
            >
              Dành cho chủ xe
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {values.map((item) => {
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
