import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export interface DashboardStats {
  totalCompletedBookings: number;
  totalRevenue: number;
  totalBookingValue: number;
  totalDeposit: number;
  pendingWithdrawalAmount: number;
  pendingWithdrawalCount: number;
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  todayBookings: number;
  monthlyRevenue: number;
  monthlyBookingValue: number;
  totalUsers: number;
  activeUsers: number;
  onlineUsers: number;
  totalVehicles: number;
  approvedVehicles: number;
  pendingVehicles: number;
  openDisputes: number;
  totalDisputes: number;
  disputeRate: number;
  supportTicketsOpen: number;
  unreadNotifications: number;
  bookingStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  vehicleStatusBreakdown: Array<{
    status: string;
    count: number;
  }>;
  bookingTrend: Array<{
    date: string;
    count: number;
  }>;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    bookingValue: number;
  }>;
  recentBookings: Array<{
    id: number;
    bookingCode: string;
    status: string;
    depositAmount: number;
    platformFee: number;
    totalAmount: number;
    updatedAt: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<ApiResponse<DashboardStats>>(endpoints.admin.dashboardStats);
  return res.data.data!;
}
