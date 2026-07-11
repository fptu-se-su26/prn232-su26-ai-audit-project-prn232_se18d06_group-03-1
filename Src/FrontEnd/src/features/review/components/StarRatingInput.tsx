import { Star } from "lucide-react";

export default function StarRatingInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div>
      {label && <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => onChange(star)} className="p-0.5 transition-colors hover:scale-110">
            <Star className={`h-5 w-5 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}
