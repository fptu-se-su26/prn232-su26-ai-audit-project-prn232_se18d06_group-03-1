import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { blogPosts } from "@/features/blog/blogPosts";

export default function BlogListPage() {
  const [featuredPost, ...otherPosts] = blogPosts;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-neutral-950 dark:text-white">
      <section className="border-b border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
            Góc hỏi đáp & cẩm nang
          </p>
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black leading-tight sm:text-4xl">
                Cẩm nang đồng hành cùng mọi chuyến đi
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-neutral-300">
                Kinh nghiệm chọn xe, nhận xe và chuẩn bị hành trình được MoveVN
                tổng hợp để bạn chủ động hơn từ lúc đặt xe đến khi trở về.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              {blogPosts.length} bài viết mới nhất
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Link
          to={`/blog/${featuredPost.slug}`}
          className="group grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700 lg:grid-cols-[1.25fr_0.75fr]"
        >
          <div className="min-h-[290px] overflow-hidden bg-slate-200 lg:min-h-[430px]">
            <img
              src={featuredPost.heroImage}
              alt={featuredPost.heroAlt}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-10">
            <span className="mb-5 w-fit rounded-full bg-brand-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              Bài viết nổi bật
            </span>
            <h2 className="text-2xl font-black leading-tight transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300 sm:text-3xl">
              {featuredPost.title}
            </h2>
            <p className="mt-4 leading-7 text-slate-600 dark:text-neutral-300">
              {featuredPost.excerpt}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-neutral-400">
              <span className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {featuredPost.publishedAt}
              </span>
              <span className="flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {featuredPost.readTime} phút đọc
              </span>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 font-extrabold text-brand-700 dark:text-brand-300">
              Đọc bài viết
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>

        <div className="mb-6 mt-14 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
              Khám phá thêm
            </p>
            <h2 className="mt-2 text-2xl font-black">Bài viết mới từ MoveVN</h2>
          </div>
          <div className="hidden h-px flex-1 bg-slate-200 dark:bg-neutral-800 sm:block" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {otherPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-200">
                <img
                  src={post.heroImage}
                  alt={post.heroAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="text-brand-700 dark:text-brand-300">{post.category}</span>
                  <span className="text-slate-500 dark:text-neutral-400">{post.publishedAt}</span>
                </div>
                <h3 className="mt-4 text-xl font-black leading-snug transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-neutral-300">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
                  <span className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                    <Clock3 className="h-4 w-4" />
                    {post.readTime} phút
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-brand-700 dark:text-brand-300">
                    Đọc tiếp
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
