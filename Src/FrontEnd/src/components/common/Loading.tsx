type LoadingProps = {
  label?: string;
};

export default function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      <span>{label}</span>
    </div>
  );
}
