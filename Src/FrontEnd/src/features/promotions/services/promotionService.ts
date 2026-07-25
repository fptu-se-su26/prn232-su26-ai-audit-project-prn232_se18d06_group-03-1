import { apiClient } from "@/services/apiClient";
import type { Promotion, ApplyPromotionResponse } from "../types";

const BASE = "/api/promotions";

export async function getPromotions(params: { keyword?: string; isActive?: boolean; page?: number; pageSize?: number }) {
  const res = await apiClient.get<any>(BASE, { params });
  return res.data.data as { items: Promotion[]; total: number; page: number; pageSize: number };
}

export async function getPromotion(id: number) {
  const res = await apiClient.get<any>(`${BASE}/${id}`);
  return res.data.data as Promotion;
}

export async function createPromotion(payload: {
  code: string; name: string; description?: string;
  discountType: string; discountValue: number;
  maxDiscountAmount?: number; minOrderAmount?: number;
  vehicleType: string; whoBears: string;
  ownerBearsPercent?: number; ownerId?: number;
  startAt: string; endAt?: string; maxUsageCount: number;
}) {
  const res = await apiClient.post<any>(BASE, payload);
  return res.data.data as Promotion;
}

export async function updatePromotion(id: number, payload: Partial<{
  name: string; description: string; discountValue: number;
  maxDiscountAmount: number; minOrderAmount: number;
  vehicleType: string; whoBears: string;
  ownerBearsPercent: number; startAt: string; endAt: string;
  maxUsageCount: number; isActive: boolean;
}>) {
  const res = await apiClient.put<any>(`${BASE}/${id}`, payload);
  return res.data.data as Promotion;
}

export async function deletePromotion(id: number) {
  await apiClient.delete(`${BASE}/${id}`);
}

export async function togglePromotion(id: number) {
  const res = await apiClient.patch<any>(`${BASE}/${id}/toggle`);
  return res.data.data as { isActive: boolean };
}

export async function validatePromotion(code: string, vehicleId: number, totalAmount: number) {
  const res = await apiClient.post<any>(`${BASE}/validate`, { code, vehicleId, totalAmount });
  return res.data.data as ApplyPromotionResponse;
}

export async function approvePromotion(id: number) {
  const res = await apiClient.post<any>(`${BASE}/${id}/approve`);
  return res.data.data as Promotion;
}

export async function rejectPromotion(id: number) {
  const res = await apiClient.post<any>(`${BASE}/${id}/reject`);
  return res.data.data as Promotion;
}

export async function getPendingPromotions() {
  const res = await apiClient.get<any>(`${BASE}/pending`);
  return res.data.data as Promotion[];
}

export async function getMyPromotions() {
  const res = await apiClient.get<any>(`${BASE}/my`);
  return res.data.data as Promotion[];
}

export async function adminApprovePromotion(id: number) {
  const res = await apiClient.post<any>(`${BASE}/${id}/admin-approve`);
  return res.data.data as Promotion;
}

export async function adminRejectPromotion(id: number) {
  const res = await apiClient.post<any>(`${BASE}/${id}/admin-reject`);
  return res.data.data as Promotion[];
}

export async function getActivePromotions() {
  const res = await apiClient.get<any>(`${BASE}/active`);
  return res.data.data as Promotion[];
}
