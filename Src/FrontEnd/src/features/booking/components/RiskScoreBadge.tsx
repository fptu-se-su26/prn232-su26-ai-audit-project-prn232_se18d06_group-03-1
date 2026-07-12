import { AlertTriangle, ShieldCheck } from "lucide-react";

type RiskLevel = "Low" | "Medium" | "High" | "Unknown";

type RiskScoreBadgeProps = {
  score?: number | null;
  showLabel?: boolean;
};

function getRiskLevel(score?: number | null): RiskLevel {
  if (score === null || score === undefined) return "Unknown";
  if (score >= 61) return "High";
  if (score >= 31) return "Medium";
  return "Low";
}

const levelConfig: Record<RiskLevel, { label: string; className: string }> = {
  Low: {
    label: "Mức rủi ro thấp",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  Medium: {
    label: "Mức rủi ro trung bình",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  High: {
    label: "Mức rủi ro cao",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
  Unknown: {
    label: "Chưa đánh giá",
    className: "bg-slate-50 text-slate-600 ring-slate-200",
  },
};

export default function RiskScoreBadge({ score, showLabel = true }: RiskScoreBadgeProps) {
  const level = getRiskLevel(score);
  const config = levelConfig[level];
  const Icon = level === "Low" ? ShieldCheck : AlertTriangle;

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        config.className,
      ].join(" ")}
      title={score === null || score === undefined ? config.label : `${config.label}: ${Math.round(score)}/100`}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel ? config.label : "Risk"}
      {score !== null && score !== undefined ? <span>{Math.round(score)}/100</span> : null}
    </span>
  );
}
