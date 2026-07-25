import { apiClient } from "@/services/apiClient";
import type { VoucherHuntItem, VoucherClaimResponse } from "../types";

const BASE = "/api/voucher-claims";

export async function getVoucherHunt() {
  const res = await apiClient.get<any>(`${BASE}/hunt`);
  return res.data.data as VoucherHuntItem[];
}

export async function getVoucherWallet() {
  const res = await apiClient.get<any>(`${BASE}/wallet`);
  return res.data.data as VoucherClaimResponse[];
}

export async function claimVoucher(promotionId: number) {
  const res = await apiClient.post<any>(`${BASE}/${promotionId}/claim`);
  return res.data.data as VoucherClaimResponse;
}
