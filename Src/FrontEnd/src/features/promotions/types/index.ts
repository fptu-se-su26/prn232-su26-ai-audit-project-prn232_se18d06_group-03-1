export interface Promotion {
  id: number;
  code: string;
  name: string;
  description?: string;
  discountType: "Fixed" | "Percentage";
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  vehicleType: "All" | "Motorbike" | "Car";
  whoBears: "System" | "Owner" | "Shared";
  ownerBearsPercent?: number;
  ownerId?: number;
  ownerName?: string;
  startAt: string;
  endAt?: string;
  maxUsageCount: number;
  usageCount: number;
  isActive: boolean;
  approvalStatus: "Approved" | "Pending" | "Rejected";
  createdByRole: "Admin" | "Owner";
  createdAt: string;
}

export interface ApplyPromotionResponse {
  success: boolean;
  message?: string;
  promotionId: number;
  code: string;
  discountAmount: number;
  systemPaidAmount: number;
  ownerPaidAmount: number;
  finalAmount: number;
}

export interface PromotionUsage {
  id: number;
  promotionId: number;
  bookingId: number;
  bookingCode?: string;
  userId: number;
  userName?: string;
  discountAmount: number;
  systemPaidAmount: number;
  ownerPaidAmount: number;
  createdAt: string;
}
