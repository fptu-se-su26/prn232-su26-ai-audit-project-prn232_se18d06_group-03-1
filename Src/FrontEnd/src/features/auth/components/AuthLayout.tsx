import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import heroUrl from "@/assets/auth-hero-movevn.png";
import logoUrl from "../../../../Logo/movevn_horizontal_light.png";

type AuthLayoutProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export default function AuthLayout({ children, description, title }: AuthLayoutProps) {
  return (
    <div className="relative grid h-screen place-items-center overflow-hidden bg-[#f6f2ff] p-3 sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(147,59,255,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(91,0,255,0.14),transparent_28%),linear-gradient(135deg,#fff_0%,#f7f1ff_48%,#eee5ff_100%)]" />
      <div className="absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(67,21,130,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(67,21,130,0.18)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative grid h-[min(720px,calc(100vh-2rem))] min-h-0 w-full max-w-5xl overflow-hidden rounded-2xl border border-white/80 bg-white/82 shadow-2xl shadow-brand-950/16 backdrop-blur-xl lg:grid-cols-[0.45fr_0.55fr]">
        <section
          className="min-h-0 overflow-y-auto bg-white/70 px-6 py-7 [scrollbar-width:none] sm:px-10 lg:order-1 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
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
          className="relative hidden min-h-0 overflow-hidden bg-[#6b19ff] lg:order-2 lg:block"
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
  );
}
