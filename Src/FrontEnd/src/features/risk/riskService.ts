import type { ApiResponse } from "@/features/auth/types";
import type { BookingRiskResponse } from "@/features/risk/types";
import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export async function predictBookingRisk(bookingId: number) {
  const res = await apiClient.post<ApiResponse<BookingRiskResponse>>(endpoints.bookings.riskScore(bookingId));
  return res.data.data;
}
