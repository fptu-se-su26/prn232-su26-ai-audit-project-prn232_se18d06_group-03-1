export type PricingRuleResponse = {
  id: number;
  name: string;
  ruleType: "Multiplier" | "FixedPrice";
  multiplier: number | null;
  fixedPrice: number | null;
  brandId: number | null;
  brandName: string | null;
  modelId: number | null;
  modelName: string | null;
  pricingRegionId: number | null;
  pricingRegionCode: string | null;
  priority: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
};

export type CreatePricingRuleRequest = {
  name: string;
  ruleType: "Multiplier" | "FixedPrice";
  multiplier?: number | null;
  fixedPrice?: number | null;
  brandId?: number | null;
  modelId?: number | null;
  pricingRegionId?: number | null;
  priority: number;
  startDate?: string | null;
  endDate?: string | null;
};

export type UpdatePricingRuleRequest = CreatePricingRuleRequest & {
  isActive: boolean;
};
