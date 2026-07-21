import { Link } from "react-router-dom";
import { HelpCircle, Mail, MessageSquare, Phone, FileText, Shield } from "lucide-react";

const faqs = [
  {
    question: "Làm thế nào để đăng ký tài khoản?",
    answer: "Bạn có thể đăng ký bằng số điện thoại hoặc email, hoặc đăng nhập nhanh qua tài khoản Google. Sau khi đăng ký, bạn cần xác thực email/SĐT qua mã OTP để kích hoạt tài khoản.",
  },
  {
    question: "Làm thế nào để đặt xe?",
    answer: "Sau khi đăng nhập, bạn chọn xe mong muốn, chọn ngày giờ nhận/trả xe, điền địa điểm và gửi yêu cầu. Chủ xe sẽ phê duyệt hoặc từ chối yêu cầu của bạn.",
  },
  {
    question: "Tôi cần thanh toán những gì khi đặt xe?",
    answer: "Bạn cần thanh toán tiền cọc (deposit) theo tỷ lệ phần trăm do Chủ Xe quy định. Phần còn lại thường được thanh toán sau hoặc theo thỏa thuận với Chủ Xe. Phí nền tảng MoveVN sẽ được tính vào tổng số tiền.",
  },
  {
    question: "Làm thế nào để trở thành Chủ Xe?",
    answer: "Đăng nhập tài khoản, vào mục Đăng ký chủ xe, hoàn tất xác thực CCCD/CMND, cung cấp thông tin tài khoản ngân hàng, đăng ký thông tin xe và chờ MoveVN kiểm duyệt.",
  },
  {
    question: "Tôi cần hỗ trợ về một booking đang xử lý?",
    answer: "Sau khi đăng nhập, bạn có thể tạo ticket trong khu vực Hỗ trợ của tài khoản. Ngoài ra có thể gọi hotline hoặc gửi email để được hỗ trợ nhanh chóng.",
  },
  {
    question: "Làm thế nào để khiếu nại hoặc báo cáo vấn đề?",
    answer: "Bạn có thể mở yêu cầu giải quyết tranh chấp (dispute) từ trang chi tiết booking trong tài khoản, cung cấp bằng chứng và mô tả chi tiết. Nhân viên MoveVN sẽ điều tra và xử lý.",
  },
  {
    question: "Tôi quên mật khẩu, làm thế nào để lấy lại?",
    answer: "Tại trang đăng nhập, chọn Quên mật khẩu và làm theo hướng dẫn. Bạn sẽ nhận được mã OTP qua email để đặt lại mật khẩu mới.",
  },
  {
    question: "Chính sách hủy đặt xe như thế nào?",
    answer: "Chính sách hủy được áp dụng theo tầng (tiered cancellation policy). Tùy vào thời điểm hủy, bạn có thể được hoàn tiền một phần hoặc toàn bộ tiền cọc. Xem chi tiết tại Điều khoản sử dụng.",
  },
];

export default function SupportPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
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
            MoveVN luôn sẵn sàng hỗ trợ bạn qua nhiều kênh liên hệ. Dưới đây là các câu hỏi thường gặp và thông tin liên hệ.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-4">
          <a
            href="mailto:support@movevn.com"
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300"
          >
            <Mail className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-4 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Email</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">support@movevn.com</p>
          </a>
          <a
            href="tel:19006868"
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300"
          >
            <Phone className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-4 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Hotline</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">1900 6868</p>
          </a>
          <Link
            to="/login"
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300"
          >
            <MessageSquare className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-4 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Ticket hỗ trợ</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Đăng nhập để tạo và theo dõi ticket.</p>
          </Link>
          <Link
            to="/terms"
            className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300 shadow-[0_12px_40px_-4px_rgba(124,58,237,0.18)] dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_12px_40px_-4px_rgba(139,92,246,0.25)] hover:scale-[1.02] duration-300"
          >
            <FileText className="h-7 w-7 text-brand-600 dark:text-brand-400" />
            <h2 className="mt-4 text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">Điều khoản</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">Xem Điều khoản sử dụng.</p>
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
