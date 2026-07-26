import type { ApiResponse } from "@/features/auth/types";
import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export interface OwnerDashboardStats {
  totalRevenue: number;
  totalBookings: number;
  completedCount: number;
  activeCount: number;
  pendingCount: number;
  otherCount: number;
  totalVehicles: number;
  approvedVehicles: number;
  monthlyRevenue: Array<{ month: string; label: string; value: number }>;
  recentBookings: Array<{
    id: number;
    bookingCode: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    status: string;
    updatedAt: string;
  }>;
}

export async function getOwnerDashboardStats(): Promise<OwnerDashboardStats> {
  const response = await apiClient.get<ApiResponse<OwnerDashboardStats>>(endpoints.owner.dashboardStats);
  return response.data.data!;
}
