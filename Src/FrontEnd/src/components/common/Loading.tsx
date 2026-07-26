type LoadingProps = {
  label?: string;
};

export default function Loading({ label = "Loading..." }: LoadingProps) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-text-secondary" role="status" aria-live="polite">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ui-border-strong border-t-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
