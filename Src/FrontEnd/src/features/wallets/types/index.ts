export interface WalletDto {
  id: number;
  userId: number;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface WalletTransactionDto {
  id: number;
  walletId: number;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export interface WalletTransactionListRequest {
  page?: number;
  pageSize?: number;
  type?: string;
}

export interface WalletTransactionListResponse {
  items: WalletTransactionDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface WithdrawalRequestDto {
  id: number;
  userId: number;
  userFullName?: string;
  userEmail?: string;
  amount: number;
  bankAccountNumber: string;
  bankName: string;
  bankAccountHolderName: string;
  bankBin?: string;
  status: string;
  processedBy?: number;
  processedByName?: string;
  processNote?: string;
  externalTransactionRef?: string;
  processedAt?: string;
  createdAt: string;
}

export interface WithdrawalListRequest {
  page?: number;
  pageSize?: number;
  status?: string;
}

export interface WithdrawalListResponse {
  items: WithdrawalRequestDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminWalletListItem {
  walletId: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface AdminWalletListResponse {
  items: AdminWalletListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminWalletDetail {
  wallet: WalletDto;
  userFullName: string;
  userEmail: string;
  transactions: WalletTransactionDto[];
  transactionTotalCount: number;
}

export interface OwnerBankDetailsDto {
  bankAccountNumber?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  bankBin?: string;
}
