type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden rounded-md bg-slate-200 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ${className}`}
    />
  );
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div className={`rounded-md border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 ${className}`}>
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonAvatar({ className = "" }: SkeletonProps) {
  return <Skeleton className={`size-14 rounded-full ${className}`} />;
}

export function SkeletonBadge({ className = "" }: SkeletonProps) {
  return <Skeleton className={`inline-block h-6 w-24 rounded-full align-middle ${className}`} />;
}
