import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Bike, Calendar, Car, MessageSquare, Shield, Star, UserX, CheckCircle } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { getPublicUserProfile, type PublicUserProfile } from "@/features/users/services/publicUserProfileService";

const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} tuần trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`${cls} ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
      ))}
    </div>
  );
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError(false);
    try { setProfile(await getPublicUserProfile(Number(id))); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const memberYear = useMemo(
    () => profile ? new Date(profile.createdAt).getFullYear().toString() : "",
    [profile],
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
        <UserX className="mb-3 h-12 w-12 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-700">Không tìm thấy người dùng</h2>
        <p className="mt-1 text-sm text-slate-500">Người dùng không tồn tại hoặc đã bị vô hiệu hoá.</p>
        <Link to="/" className="mt-4 text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">Về trang chủ</Link>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-page-start via-white to-app-page-end pb-16">
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-slate-700">Hồ sơ người dùng</span>
        </div>

        {/* Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-slate-100 sm:h-32 sm:w-32" />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-100 text-4xl font-bold text-brand-700 ring-4 ring-slate-100 sm:h-32 sm:w-32">
                  {profile.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              {profile.isOnline && <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />}
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{profile.fullName}</h1>
                {profile.isOwner && profile.isVerified && <BadgeCheck className="h-7 w-7 text-blue-500" />}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {profile.isOwner && profile.averageRating != null && (
                  <span className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-semibold text-amber-500">{profile.averageRating.toFixed(1)}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <CheckCircle className="h-3.5 w-3.5" /> Đã xác thực
                </span>
                <span className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" /> Thành viên từ {memberYear}
                </span>
              </div>
            </div>
          </div>

          {profile.isOwner && (
            <div className="mt-8 grid grid-cols-4 gap-4">
              {[
                { value: profile.totalTrips, label: "Lượt thuê" },
                { value: profile.totalVehicles, label: "Xe" },
                { value: profile.totalReviews, label: "Đánh giá" },
                { value: profile.averageRating != null ? profile.averageRating.toFixed(1) : "--", label: "Sao", highlight: profile.averageRating != null },
              ].map((stat, i) => (
                <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 py-4 text-center">
                  <p className={`text-xl font-bold ${stat.highlight ? "text-amber-500" : "text-slate-800"}`}>{stat.value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vehicles */}
        {profile.vehicles.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <Car className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Xe đang cho thuê</h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{profile.vehicles.length} xe</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.vehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => navigate(`/vehicle/${v.id}`)}
                  className="group overflow-hidden rounded-xl border border-slate-200 text-left transition-shadow hover:shadow-md"
                >
                  <div className="flex h-48 items-center justify-center overflow-hidden bg-slate-50 sm:h-52">
                    {v.primaryImage ? (
                      <img src={v.primaryImage} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        {v.vehicleType === "Car" ? <Car className="h-10 w-10" /> : <Bike className="h-10 w-10" />}
                        <span className="text-xs">{v.vehicleType === "Car" ? "Ô tô" : "Xe máy"}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-brand-700">
                      {v.brandName} {v.modelName}{v.variantName ? ` ${v.variantName}` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{v.address}</span>
                      <span className="text-slate-300">·</span>
                      <span className="shrink-0">{v.year}</span>
                    </div>
                    <p className="mt-2 text-base font-bold text-brand-700">
                      {VND.format(v.pricePerDay)}
                      <span className="text-xs font-normal text-slate-400">/ngày</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {profile.reviews.length > 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                <MessageSquare className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">Đánh giá từ khách hàng</h2>
              <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">{profile.totalReviews}</span>
            </div>
            <div className="space-y-5">
              {profile.reviews.map((r) => (
                <div key={r.id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    {r.reviewerAvatar ? (
                      <img src={r.reviewerAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-500">
                        {r.reviewerName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => navigate(`/users/${r.reviewerId}`)} className="text-sm font-semibold text-slate-800 hover:text-brand-700">{r.reviewerName}</button>
                        <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                      </div>
                      <div className="mt-0.5">
                        <StarRating rating={r.rating} />
                      </div>
                      {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">
          <Shield className="mr-1 inline-block h-3 w-3" /> Thông tin được hiển thị công khai trên MOVEVN
        </div>
      </div>
    </div>
  );
}
