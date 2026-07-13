import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export interface CreatePaymentLinkResponse {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  paymentLinkId: string;
}

export async function createPaymentLink(bookingId: number, returnUrl?: string): Promise<CreatePaymentLinkResponse> {
  const url = returnUrl 
    ? `/api/payments/booking/${bookingId}?returnUrl=${encodeURIComponent(returnUrl)}`
    : `/api/payments/booking/${bookingId}`;
  const res = await apiClient.post<ApiResponse<CreatePaymentLinkResponse>>(url);
  return res.data.data!;
}

export async function createTopUpPaymentLink(amount: number): Promise<CreatePaymentLinkResponse> {
  const res = await apiClient.post<ApiResponse<CreatePaymentLinkResponse>>(`/api/payments/wallet/topup`, { amount });
  return res.data.data!;
}
