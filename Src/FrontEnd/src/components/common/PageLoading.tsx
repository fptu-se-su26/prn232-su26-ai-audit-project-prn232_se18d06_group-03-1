import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function PageLoading() {
  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="mx-auto h-8 w-8 text-violet-300" />
        <p className="mt-3 text-sm text-slate-500">Đang tải...</p>
      </div>
    </div>
  );
}
