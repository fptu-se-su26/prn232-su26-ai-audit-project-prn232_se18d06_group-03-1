export type PricingRegionResponse = {
  id: number;
  code: string;
  description: string | null;
  coefficient: number;
  isActive: boolean;
};

export type CreatePricingRegionRequest = {
  code: string;
  description?: string | null;
  coefficient?: number;
};

export type UpdatePricingRegionRequest = CreatePricingRegionRequest & {
  isActive: boolean;
};
