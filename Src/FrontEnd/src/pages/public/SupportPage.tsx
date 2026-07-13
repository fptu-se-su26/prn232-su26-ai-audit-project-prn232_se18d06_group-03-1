import { Link } from "react-router-dom";
import { HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";

const faqs = [
  {
    question: "Tôi cần đăng nhập để đặt xe không?",
    answer: "Có. Khách hàng cần đăng nhập để tạo yêu cầu đặt xe và theo dõi lịch sử thuê.",
  },
  {
    question: "Chủ xe đăng ký ở đâu?",
    answer: "Chủ xe mới có thể bắt đầu tại trang Đăng ký chủ xe, sau đó hoàn tất các bước xác thực.",
  },
  {
    question: "Cần hỗ trợ một booking đang xử lý thì làm gì?",
    answer: "Sau khi đăng nhập, khách hàng có thể tạo ticket trong khu vực Hỗ trợ của tài khoản.",
  },
];

export default function SupportPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
            Hỗ trợ
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
            Cần giúp đỡ với{" "}
            <span className="italic lowercase text-brand-600 dark:text-brand-400">
              việc thuê xe
            </span>
            ?
          </h1>
          <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
            Trang này gồm các kênh liên hệ công khai và hướng dẫn người dùng vào đúng khu vực hỗ trợ
            sau khi đăng nhập.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <a href="mailto:support@movevn.com" className="rounded border border-slate-200 bg-white p-6 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300">
            <Mail className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-5 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Email</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">support@movevn.com</p>
          </a>
          <a href="tel:19006868" className="rounded border border-slate-200 bg-white p-6 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300">
            <Phone className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-5 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Hotline</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">1900 6868</p>
          </a>
          <Link to="/login" className="rounded border border-slate-200 bg-white p-6 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300">
            <MessageSquare className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-5 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Ticket hỗ trợ</h2>
            <p className="mt-3 text-sm text-slate-600 dark:text-gray-400">Đăng nhập để tạo và theo dõi ticket.</p>
          </Link>
        </div>

        <div className="mt-14">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-6 w-6 text-brand-600 dark:text-brand-400" />
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Câu hỏi thường gặp</h2>
          </div>
          <div className="mt-6 divide-y divide-slate-200 border-y border-slate-200 dark:divide-neutral-800 dark:border-neutral-800">
            {faqs.map((faq) => (
              <article key={faq.question} className="py-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{faq.question}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-gray-400">{faq.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
