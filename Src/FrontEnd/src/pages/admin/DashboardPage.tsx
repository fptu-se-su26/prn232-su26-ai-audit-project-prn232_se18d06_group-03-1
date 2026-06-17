import { useEffect, useState } from "react";
import { AlertTriangle, CarFront, ChartColumn, Users } from "lucide-react";
import Card from "@/components/ui/Card";
import { getAdminDashboard, type AdminDashboard } from "@/services/dashboardService";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("vi-VN");

export default function DashboardPage() {
  const today = new Date();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setLoading(true);
        const dashboard = await getAdminDashboard(today.getFullYear(), today.getMonth() + 1);
        if (active) {
          setData(dashboard);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [today]);

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 p-6 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">MoveVN Admin</p>
        <h1 className="mt-3 text-3xl font-semibold">Risk and revenue overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-200">
          Live KPI snapshot for users, fleet availability, dispute volume, and high-risk bookings.
        </p>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 text-red-700">{error}</Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Total users"
          value={loading || !data ? "..." : number.format(data.totalUsers)}
          tone="emerald"
        />
        <MetricCard
          icon={<CarFront className="h-5 w-5" />}
          label="Available vehicles"
          value={loading || !data ? "..." : number.format(data.totalVehiclesAvailable)}
          tone="sky"
        />
        <MetricCard
          icon={<ChartColumn className="h-5 w-5" />}
          label="GMV this month"
          value={loading || !data ? "..." : currency.format(data.gmvThisMonth)}
          tone="amber"
        />
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="High-risk bookings"
          value={loading || !data ? "..." : number.format(data.highRiskBookings)}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-zinc-900">Daily bookings</h2>
            <p className="text-sm text-zinc-500">Booking count and revenue trend in the selected month.</p>
          </div>
          <div className="p-5">
            <div className="grid gap-3">
              {(data?.dailyBookings ?? []).length === 0 && !loading ? (
                <p className="text-sm text-zinc-500">No booking data available yet.</p>
              ) : (
                (data?.dailyBookings ?? Array.from({ length: 4 }).map((_, index) => ({ date: `${index}`, count: 0, revenue: 0 }))).map((item) => {
                  const maxCount = Math.max(...(data?.dailyBookings ?? [{ count: 1 }]).map((entry) => entry.count), 1);
                  const width = `${Math.max((item.count / maxCount) * 100, 8)}%`;

                  return (
                    <div key={item.date} className="grid gap-2">
                      <div className="flex items-center justify-between text-sm text-zinc-600">
                        <span>{loading ? "Loading..." : new Date(item.date).toLocaleDateString("vi-VN")}</span>
                        <span>{loading ? "..." : `${item.count} bookings`}</span>
                      </div>
                      <div className="h-3 rounded-full bg-zinc-100">
                        <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width }} />
                      </div>
                      <p className="text-xs text-zinc-500">{loading ? "..." : currency.format(item.revenue)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </Card>

        <Card className="grid gap-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Risk posture</h2>
            <p className="text-sm text-zinc-500">Operational pressure points for staff and admin review.</p>
          </div>

          <div className="rounded-2xl bg-zinc-950 p-5 text-white">
            <p className="text-sm text-zinc-300">Dispute rate</p>
            <p className="mt-2 text-3xl font-semibold">{loading || !data ? "..." : `${Math.round(data.disputeRate * 100)}%`}</p>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">High-risk ratio</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {loading || !data ? "..." : `${Math.round(data.highRiskRatio * 100)}%`}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-5">
            <p className="text-sm text-zinc-500">Bookings this month</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">
              {loading || !data ? "..." : number.format(data.bookingsToday)}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

type MetricCardProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber" | "rose";
};

function MetricCard({ icon, label, value, tone }: MetricCardProps) {
  const tones: Record<MetricCardProps["tone"], string> = {
    emerald: "from-emerald-500/15 to-emerald-100",
    sky: "from-sky-500/15 to-sky-100",
    amber: "from-amber-500/15 to-amber-100",
    rose: "from-rose-500/15 to-rose-100",
  };

  return (
    <Card className={`bg-gradient-to-br ${tones[tone]} border-zinc-200`}>
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-white/80 p-3 text-zinc-800 shadow-sm">{icon}</div>
      </div>
      <p className="mt-5 text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
    </Card>
  );
}
