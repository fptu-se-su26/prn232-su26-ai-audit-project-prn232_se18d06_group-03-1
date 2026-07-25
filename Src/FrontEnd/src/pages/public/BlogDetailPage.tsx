import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { blogPosts, findBlogPost } from "@/features/blog/blogPosts";

export default function BlogDetailPage() {
  const { slug } = useParams();
  const post = findBlogPost(slug);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const relatedPosts = blogPosts
    .filter((candidate) => candidate.slug !== post.slug)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-slate-950 dark:bg-neutral-950 dark:text-white">
      <article>
        <header className="border-b border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-600 transition hover:text-brand-700 dark:text-neutral-300 dark:hover:text-brand-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Trở lại cẩm nang
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 font-extrabold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
                {post.category}
              </span>
              <span className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                <CalendarDays className="h-4 w-4" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
                <Clock3 className="h-4 w-4" />
                {post.readTime} phút đọc
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-neutral-300">
              {post.excerpt}
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8 lg:pt-10">
          <img
            src={post.heroImage}
            alt={post.heroAlt}
            className="aspect-[16/7] w-full rounded-lg object-cover shadow-lg"
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <p className="border-l-4 border-brand-500 pl-5 text-lg font-semibold leading-8 text-slate-700 dark:text-neutral-200">
            MoveVN tổng hợp những hướng dẫn thực tế để bạn chuẩn bị chuyến đi rõ
            ràng, an toàn và chủ động hơn.
          </p>

          <div className="mt-12 space-y-14">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">
                  {section.heading}
                </h2>

                <div className="mt-5 space-y-5">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-700 dark:text-neutral-300"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets && (
                  <ul className="mt-6 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-3 text-base leading-7 text-slate-700 dark:text-neutral-300"
                      >
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.image && (
                  <figure className="mt-8">
                    <img
                      src={section.image}
                      alt={section.imageAlt ?? section.heading}
                      loading="lazy"
                      className="aspect-[16/9] w-full rounded-lg object-cover"
                    />
                    <figcaption className="mt-3 text-center text-sm text-slate-500 dark:text-neutral-400">
                      {section.imageAlt}
                    </figcaption>
                  </figure>
                )}
              </section>
            ))}
          </div>

          <div className="mt-14 border-y border-slate-200 py-6 dark:border-neutral-800">
            <p className="font-extrabold">Sẵn sàng cho hành trình tiếp theo?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-neutral-300">
              Chọn khu vực và thời gian để xem các xe đang sẵn sàng trên MoveVN.
            </p>
            <Link
              to="/vehicle"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-brand-700"
            >
              Tìm xe phù hợp
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      <section className="border-t border-slate-200 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                Đọc tiếp
              </p>
              <h2 className="mt-2 text-2xl font-black">Bài viết liên quan</h2>
            </div>
            <Link
              to="/blog"
              className="hidden items-center gap-2 text-sm font-extrabold text-brand-700 hover:text-brand-800 dark:text-brand-300 sm:inline-flex"
            >
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.slug}
                to={`/blog/${relatedPost.slug}`}
                className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-brand-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-brand-700"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={relatedPost.heroImage}
                    alt={relatedPost.heroAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-5">
                  <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">
                    {relatedPost.category}
                  </span>
                  <h3 className="mt-2 text-lg font-black leading-snug transition-colors group-hover:text-brand-700 dark:group-hover:text-brand-300">
                    {relatedPost.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                    {relatedPost.readTime} phút đọc
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
