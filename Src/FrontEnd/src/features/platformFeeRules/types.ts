export type PlatformFeeRuleResponse = {
  id: number;
  name: string;
  targetType: string;
  targetId: number | null;
  feeType: string;
  feeValue: number;
  minFee: number | null;
  maxFee: number | null;
  priority: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePlatformFeeRuleRequest = {
  name: string;
  targetType: string;
  targetId?: number | null;
  feeType: string;
  feeValue: number;
  minFee?: number | null;
  maxFee?: number | null;
  priority: number;
  startAt?: string | null;
  endAt?: string | null;
};

export type UpdatePlatformFeeRuleRequest = CreatePlatformFeeRuleRequest & {
  isActive: boolean;
};
