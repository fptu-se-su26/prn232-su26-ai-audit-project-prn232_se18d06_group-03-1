const sections = [
  {
    title: "Tài khoản và truy cập",
    text: "Người dùng cần cung cấp thông tin chính xác khi đăng ký và tự chịu trách nhiệm bảo mật thông tin đăng nhập.",
  },
  {
    title: "Thông tin xe và đặt xe",
    text: "Giá thuê, tiền cọc, địa điểm và trạng thái xe được hiển thị theo dữ liệu hiện có trên hệ thống tại thời điểm truy cập.",
  },
  {
    title: "Trách nhiệm sử dụng",
    text: "Người dùng cần tuân thủ quy trình đặt xe, nhận xe, trả xe và các hướng dẫn an toàn được MoveVN công bố.",
  },
  {
    title: "Hỗ trợ và xử lý sự cố",
    text: "Các yêu cầu hỗ trợ được tiếp nhận qua kênh liên hệ công khai hoặc ticket trong tài khoản sau khi đăng nhập.",
  },
];

export default function TermsPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
          Điều khoản
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Điều khoản{" "}
          <span className="italic lowercase text-brand-600 dark:text-brand-400">
            sử dụng
          </span>{" "}
          MoveVN
        </h1>
        <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
          Nội dung này là bản tóm tắt công khai cho giao diện FE. Các quy định chi tiết có thể được
          cập nhật theo chính sách vận hành của MoveVN.
        </p>

        <div className="mt-12 divide-y divide-slate-200 border-y border-slate-200 dark:divide-neutral-800 dark:border-neutral-800">
          {sections.map((section) => (
            <article key={section.title} className="py-6">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-gray-400">{section.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
