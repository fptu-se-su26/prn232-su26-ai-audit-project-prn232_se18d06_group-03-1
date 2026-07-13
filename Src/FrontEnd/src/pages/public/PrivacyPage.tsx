const sections = [
  {
    title: "Thông tin chung",
    text: "MoveVN có thể sử dụng thông tin tài khoản, liên hệ và hành vi trên hệ thống để cung cấp trải nghiệm thuê xe.",
  },
  {
    title: "Mục đích sử dụng",
    text: "Dữ liệu được dùng để xác thực người dùng, xử lý đặt xe, hỗ trợ khách hàng và cải thiện chất lượng dịch vụ.",
  },
  {
    title: "Bảo vệ dữ liệu",
    text: "Thông tin người dùng cần được truy cập theo đúng vai trò và không được công khai trái với mục đích vận hành.",
  },
  {
    title: "Liên hệ",
    text: "Người dùng có thể liên hệ support@movevn.com khi có câu hỏi về quyền riêng tư và dữ liệu cá nhân.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-gradient-to-br from-[#faf7ff] via-white to-[#f5efff] text-slate-900 dark:from-[#0e0720] dark:via-black dark:to-[#05030f] dark:text-white min-h-screen transition-colors duration-300">
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <p className="text-sm sm:text-base font-black uppercase tracking-[0.25em] text-brand-600 dark:text-brand-400">
          Bảo mật
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Chính sách{" "}
          <span className="italic lowercase text-brand-600 dark:text-brand-400">
            bảo mật
          </span>
        </h1>
        <p className="mt-6 text-base leading-8 text-slate-600 dark:text-gray-300">
          Trang này tóm tắt cách MoveVN tiếp cận việc sử dụng và bảo vệ thông tin người dùng trên
          các luồng công khai và tài khoản.
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
