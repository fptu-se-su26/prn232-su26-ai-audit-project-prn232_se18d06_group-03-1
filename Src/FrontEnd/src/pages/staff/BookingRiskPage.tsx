import { BrainCircuit, FileText, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { operationalDecisionLabels, riskActionLabels, riskFactorLabels, riskLevelLabels } from "@/features/risk/riskLabels";
import { predictBookingRisk } from "@/features/risk/riskService";
import type { BookingRiskResponse } from "@/features/risk/types";

const sampleBookings = [
  { id: 1, code: "BK-0001", customer: "Nguyen Van A", vehicle: "Toyota Vios 2023" },
  { id: 2, code: "BK-0002", customer: "Tran Thi B", vehicle: "Honda Air Blade" },
  { id: 3, code: "BK-0003", customer: "Le Minh C", vehicle: "Mercedes C300" },
];

export default function BookingRiskPage() {
  const [bookingId, setBookingId] = useState(1);
  const [result, setResult] = useState<BookingRiskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePredict(nextBookingId = bookingId) {
    setBookingId(nextBookingId);
    setLoading(true);
    setError(null);
    try {
      const data = await predictBookingRisk(nextBookingId);
      setResult(data ?? null);
    } catch {
      setError("Không gọi được Risk AI. Hãy chạy risk-ai-service ở port 8010 và backend ở port 5171.");
    } finally {
      setLoading(false);
    }
  }

  const level = result?.prediction.risk_level;
  const deposit = result?.prediction.deposit_recommendation;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Risk Score Booking</h1>
            <p className="mt-1 text-sm text-slate-500">
              Chấm điểm rủi ro booking bằng ML, đề xuất duyệt đơn, mức cọc động và giải thích bằng RAG policy.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min={1}
                value={bookingId}
                onChange={(event) => setBookingId(Number(event.target.value))}
                className="h-10 w-40 rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>
            <button
              type="button"
              disabled={loading || bookingId < 1}
              onClick={() => void handlePredict()}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
              Chấm điểm
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Đơn thuê cần kiểm tra</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {sampleBookings.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => void handlePredict(booking.id)}
                className="block w-full px-5 py-4 text-left transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-slate-900">{booking.code}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">#{booking.id}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{booking.customer}</p>
                <p className="mt-0.5 text-xs text-slate-400">{booking.vehicle}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
            <ShieldAlert className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900">Kết quả ML + RAG</h2>
          </div>
          <div className="space-y-5 p-5">
            {result ? (
              <>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-5">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Booking #{result.prediction.bookingId}</p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">{result.prediction.risk_score}/100</p>
                    <p className="mt-1 text-xs text-slate-500">Model: {result.prediction.modelVersion}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      level === "High"
                        ? "bg-red-50 text-red-700"
                        : level === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {level ? riskLevelLabels[level] : "-"}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <Metric label="Điểm uy tín" value={result.input.trust_score} />
                  <Metric label="Số lần hủy" value={result.input.cancel_count} />
                  <Metric label="Thời gian thuê" value={`${result.input.duration} ngày`} />
                  <Metric label="Xác suất" value={`${Math.round(result.prediction.probability * 100)}%`} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <BusinessCard
                    title="Quyết định vận hành"
                    value={operationalDecisionLabels[result.prediction.operational_decision]}
                    description={
                      result.prediction.operational_decision === "autoApprove"
                        ? "Booking đủ an toàn để hệ thống tự động duyệt."
                        : result.prediction.operational_decision === "manualReview"
                          ? "Booking cần nhân viên kiểm tra trước khi duyệt."
                          : "Booking có tín hiệu rủi ro cao, nên từ chối hoặc chuyển cấp."
                    }
                  />
                  <BusinessCard
                    title="Mức cọc động"
                    value={deposit ? `${deposit.amount.toLocaleString("vi-VN")}đ` : "-"}
                    description={deposit ? `${Math.round(deposit.rate * 100)}% giá trị xe. ${deposit.reason}` : "-"}
                  />
                  <BusinessCard
                    title="Hiển thị cho chủ xe"
                    value={riskActionLabels[result.prediction.suggested_action]}
                    description="Chủ xe xem điểm rủi ro, mức cọc đề xuất và lý do để quyết định nhận hoặc từ chối đơn."
                  />
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-400">Gợi ý xử lý</p>
                  <p className="mt-1 font-semibold text-slate-900">{riskActionLabels[result.prediction.suggested_action]}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {result.prediction.top_risk_factors.map((factor) => riskFactorLabels[factor] ?? factor).join(", ")}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs font-medium text-slate-400">Giải thích RAG</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{result.prediction.explanation}</p>
                </div>

                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Policy được truy xuất
                  </p>
                  {result.prediction.retrieved_context.map((context) => (
                    <div key={`${context.source}-${context.title}`} className="rounded-lg bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{context.title}</p>
                        <span className="text-xs text-slate-400">{Math.round(context.relevance * 100)}%</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{context.source}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{context.content}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex min-h-80 items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-500">
                Chọn một booking hoặc nhập bookingId để chấm điểm rủi ro.
              </div>
            )}
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BusinessCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium text-slate-400">{title}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
