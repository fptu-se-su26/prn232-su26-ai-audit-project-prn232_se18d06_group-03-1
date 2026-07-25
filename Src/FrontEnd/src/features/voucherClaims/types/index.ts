export interface VoucherHuntItem {
  promotionId: number;
  code: string;
  name: string;
  description?: string;
  discountType: "Fixed" | "Percentage";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  vehicleType: "All" | "Motorbike" | "Car";
  endAt?: string;
  maxUsageCount: number;
  usageCount: number;
  isClaimed: boolean;
}

export interface VoucherClaimResponse {
  id: number;
  promotionId: number;
  code: string;
  name: string;
  description?: string;
  discountType: "Fixed" | "Percentage";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  vehicleType: "All" | "Motorbike" | "Car";
  endAt?: string;
  maxUsageCount: number;
  usageCount: number;
  claimedAt: string;
  usedAt?: string;
  bookingId?: number;
}
