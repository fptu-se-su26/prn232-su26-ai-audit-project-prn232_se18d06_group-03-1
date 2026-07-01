import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroUrl from "@/assets/auth-hero-movevn.png";
import logoUrl from "../../../../Logo/movevn_horizontal_light.png";
import logoFullUrl from "../../../../Logo/LOGO_UILIGH.png";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export default function AuthLayout({ children, description, title }: AuthLayoutProps) {
  return (
    <>
      {/* ── MOBILE LAYOUT (< lg) ── */}
      <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#faf6ff] lg:hidden">
        {/* Beautiful Gradient Background */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(145deg,#ffffff_0%,#fff7fc_30%,#f6eeff_70%,#eedfff_100%)]" />
        
        {/* Soft Background Glows (Static) */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-[#ffb6db]/20 blur-[80px]" />
          <div className="absolute -right-20 top-60 h-80 w-80 rounded-full bg-[#cfa9ff]/25 blur-[90px]" />
        </div>

        {/* Clean Static Route & Travel SVG Patterns */}
        <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60" xmlns="http://www.w3.org/2000/svg">
          {/* Main Route Line */}
          <path d="M-20,180 C80,120 180,260 280,160 T450,220" fill="none" stroke="#6b19ff" strokeWidth="2.5" strokeDasharray="6,6" opacity="0.18" />
          <path d="M-40,480 C100,420 220,540 320,440 T500,480" fill="none" stroke="#ffb6db" strokeWidth="2.5" strokeDasharray="6,6" opacity="0.22" />
          
          {/* Cloud decorations */}
          <g fill="#6b19ff" opacity="0.07">
            <path d="M340,80 C335,80 330,83 328,87 C325,85 320,86 318,90 C313,90 310,94 310,98 C310,103 314,107 319,107 L341,107 C346,107 350,103 350,98 C350,94 347,90 342,90 C342,85 337,80 332,80 Z" />
            <path d="M60,320 C56,320 52,323 50,327 C47,325 43,326 41,330 C37,330 34,334 34,338 C34,343 38,347 43,347 L65,347 C69,347 73,343 73,338 C73,334 70,330 66,330 C66,325 62,320 58,320 Z" />
          </g>

          {/* Dotted Pins along the path */}
          <g fill="#6b19ff" opacity="0.25">
            {/* Pin 1 */}
            <circle cx="130" cy="180" r="4" />
            <circle cx="130" cy="180" r="8" fill="none" stroke="#6b19ff" strokeWidth="1" />
            {/* Pin 2 */}
            <circle cx="310" cy="190" r="4" />
            <circle cx="310" cy="190" r="8" fill="none" stroke="#6b19ff" strokeWidth="1" />
          </g>
        </svg>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(107,25,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(107,25,255,0.06)_1px,transparent_1px)] [background-size:32px_32px]" />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto px-6 pb-8 pt-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Logo enlarged by 7/4 times (from h-28 to h-48) */}
          <div className="mb-12 flex flex-col items-center text-center">
            <Link to="/" className="inline-flex flex-col items-center">
              <img
                alt="MoveVN"
                className="h-48 w-auto object-contain drop-shadow-sm"
                src={logoFullUrl}
              />
            </Link>
          </div>

          {/* Page title and description - margin bottom increased to push form down */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#101936]">{title}</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {description.split("MoveVN").length > 1 ? (
                <>
                  {description.split("MoveVN")[0]}
                  <span className="font-bold text-[#6b19ff]">MoveVN</span>
                  {description.split("MoveVN")[1]}
                </>
              ) : (
                description
              )}
            </p>
          </div>

          {/* Form content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>



      {/* ── DESKTOP LAYOUT (≥ lg) — UNCHANGED ── */}
      <div className="relative hidden h-screen place-items-center overflow-hidden bg-[#f6f2ff] p-5 lg:grid">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(147,59,255,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(91,0,255,0.14),transparent_28%),linear-gradient(135deg,#fff_0%,#f7f1ff_48%,#eee5ff_100%)]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(67,21,130,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(67,21,130,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative grid h-[min(720px,calc(100vh-2rem))] min-h-0 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/80 bg-white/82 shadow-2xl shadow-brand-950/16 backdrop-blur-xl lg:grid-cols-[0.45fr_0.55fr]">
          <section className="min-h-0 overflow-y-auto bg-white/70 px-12 py-7 [scrollbar-width:none] lg:order-1 [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto w-full max-w-md">
              <Link to="/" className="mb-8 inline-flex sm:mb-10">
                <img alt="MoveVN" className="h-20 w-auto sm:h-24" src={logoUrl} />
              </Link>

              <div className="mb-6">
                <h1 className="text-4xl font-extrabold tracking-tight text-[#101936]">{title}</h1>
                <p className="mt-3 text-base font-medium text-slate-500">{description}</p>
              </div>

              {children}
            </div>
          </section>

          <section
            aria-hidden="true"
            className="relative min-h-0 overflow-hidden bg-[#6b19ff] lg:order-2 lg:block"
          >
            <img
              alt=""
              className="h-full w-full object-cover object-center"
              draggable={false}
              src={heroUrl}
            />
          </section>
        </div>
      </div>
    </>
  );
}


