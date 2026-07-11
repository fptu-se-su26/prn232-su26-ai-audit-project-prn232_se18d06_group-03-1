import { Star, User } from "lucide-react";
import type { ReviewResponse } from "../reviewService";

export default function ReviewCard({ review }: { review: ReviewResponse }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-3">
        {review.reviewerAvatar ? (
          <img src={review.reviewerAvatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
            <User className="h-4 w-4 text-brand-600" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900">{review.reviewerName}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
            ))}
          </div>
        </div>
        <span className="text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
      </div>
      {review.comment && <p className="text-sm text-slate-700">{review.comment}</p>}
      {review.cleanlinessScore && review.accuracyScore && review.supportScore && (
        <div className="mt-2 flex gap-4 text-xs text-slate-500">
          <span>Vệ sinh: {review.cleanlinessScore}/5</span>
          <span>Chính xác: {review.accuracyScore}/5</span>
          <span>Hỗ trợ: {review.supportScore}/5</span>
        </div>
      )}
    </div>
  );
}
