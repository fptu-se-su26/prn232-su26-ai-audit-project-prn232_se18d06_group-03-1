export type PricingRuleResponse = {
  id: number;
  vehicleId: number;
  licensePlate: string;
  ruleType: "Multiplier" | "FixedPrice";
  multiplier: number | null;
  fixedPrice: number | null;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export type CreatePricingRuleRequest = {
  vehicleId: number;
  ruleType: "Multiplier" | "FixedPrice";
  multiplier?: number | null;
  fixedPrice?: number | null;
  priority: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type UpdatePricingRuleRequest = CreatePricingRuleRequest & {
  isActive: boolean;
};
