import { apiClient } from "@/services/apiClient";
import type { ApiResponse } from "@/features/auth/types";
import type { 
  WalletDto, 
  WalletTransactionListRequest, 
  WalletTransactionListResponse,
  WithdrawalRequestDto,
  WithdrawalListRequest,
  WithdrawalListResponse,
  AdminWalletListResponse,
  AdminWalletDetail,
  OwnerBankDetailsDto
} from "../types";

export async function getBankAccountDetails(): Promise<OwnerBankDetailsDto> {
  const res = await apiClient.get<ApiResponse<OwnerBankDetailsDto>>("/api/withdrawals/bank-account");
  return res.data.data!;
}

// --- Wallet ---
export async function getMyWallet(): Promise<WalletDto> {
  const res = await apiClient.get<ApiResponse<WalletDto>>("/api/wallets/my-wallet");
  return res.data.data!;
}

export async function getMyTransactions(params?: WalletTransactionListRequest): Promise<WalletTransactionListResponse> {
  const res = await apiClient.get<ApiResponse<WalletTransactionListResponse>>("/api/wallets/my-transactions", { params });
  return res.data.data!;
}

// --- Withdrawal (Owner) ---
export async function createWithdrawal(amount: number): Promise<WithdrawalRequestDto> {
  const res = await apiClient.post<ApiResponse<WithdrawalRequestDto>>("/api/withdrawals", { amount });
  return res.data.data!;
}

export async function getMyWithdrawals(params?: WithdrawalListRequest): Promise<WithdrawalListResponse> {
  const res = await apiClient.get<ApiResponse<WithdrawalListResponse>>("/api/withdrawals/my", { params });
  return res.data.data!;
}

// --- Bank Account OTP Verification (Owner) ---
export async function requestBankAccountOtp(): Promise<void> {
  await apiClient.post<ApiResponse<any>>("/api/withdrawals/bank-account/request-otp");
}

export async function verifyBankAccountOtp(data: {
  otp: string;
  bankAccountNumber: string;
  bankName: string;
  bankAccountHolderName: string;
  bankBin?: string;
}): Promise<void> {
  await apiClient.post<ApiResponse<any>>("/api/withdrawals/bank-account/verify", data);
}

// --- Payout Processing (Staff / Admin) ---
export async function getAllWithdrawals(params?: WithdrawalListRequest): Promise<WithdrawalListResponse> {
  const res = await apiClient.get<ApiResponse<WithdrawalListResponse>>("/api/withdrawals/all", { params });
  return res.data.data!;
}

export async function approveWithdrawal(id: number, data: { note?: string }): Promise<WithdrawalRequestDto> {
  const res = await apiClient.put<ApiResponse<WithdrawalRequestDto>>(`/api/withdrawals/${id}/approve`, data);
  return res.data.data!;
}

export async function completeWithdrawal(id: number, data: { note?: string; externalTransactionRef?: string }): Promise<WithdrawalRequestDto> {
  const res = await apiClient.put<ApiResponse<WithdrawalRequestDto>>(`/api/withdrawals/${id}/complete`, data);
  return res.data.data!;
}

export async function rejectWithdrawal(id: number, data: { reason: string }): Promise<WithdrawalRequestDto> {
  const res = await apiClient.put<ApiResponse<WithdrawalRequestDto>>(`/api/withdrawals/${id}/reject`, data);
  return res.data.data!;
}

// --- Admin Wallet Management ---
export async function getAdminWallets(params: { page: number; pageSize: number; keyword?: string }): Promise<AdminWalletListResponse> {
  const res = await apiClient.get<ApiResponse<AdminWalletListResponse>>("/api/admin/wallets", { params });
  return res.data.data!;
}

export async function getAdminWalletDetail(userId: number, params: { txPage: number; txPageSize: number }): Promise<AdminWalletDetail> {
  const res = await apiClient.get<ApiResponse<AdminWalletDetail>>(`/api/admin/wallets/${userId}`, { params });
  return res.data.data!;
}

export async function adjustWalletBalance(userId: number, data: { amount: number; note: string }): Promise<WalletDto> {
  const res = await apiClient.post<ApiResponse<WalletDto>>(`/api/admin/wallets/${userId}/adjust`, data);
  return res.data.data!;
}
