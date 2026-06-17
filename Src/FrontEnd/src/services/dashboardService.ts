import { apiClient } from "@/services/apiClient";

type DailyBooking = {
  date: string;
  count: number;
  revenue: number;
};

export type AdminDashboard = {
  totalUsers: number;
  totalVehiclesAvailable: number;
  bookingsToday: number;
  gmvThisMonth: number;
  disputeRate: number;
  highRiskBookings: number;
  highRiskRatio: number;
  dailyBookings: DailyBooking[];
};

type ApiEnvelope<T> = {
  isSuccess: boolean;
  message?: string;
  data: T;
};

export async function getAdminDashboard(year?: number, month?: number) {
  const res = await apiClient.get<ApiEnvelope<AdminDashboard>>("/admin/dashboard", {
    params: { year, month },
  });
  return res.data.data;
}
