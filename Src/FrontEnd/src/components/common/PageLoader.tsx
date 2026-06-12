import LoadingSpinner from "@/components/common/LoadingSpinner";

type PageLoaderProps = {
  label?: string;
};

export default function PageLoader({ label = "Đang tải..." }: PageLoaderProps) {
  return (
    <div className="grid min-h-[280px] place-items-center">
      <div className="inline-flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm">
        <LoadingSpinner className="h-5 w-5 text-brand-700" />
        <span>{label}</span>
      </div>
    </div>
  );
}
