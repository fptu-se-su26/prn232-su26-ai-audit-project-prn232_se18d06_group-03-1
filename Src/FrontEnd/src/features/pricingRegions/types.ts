export type PricingRegionResponse = {
  id: number;
  code: string;
  description: string | null;
  isActive: boolean;
};

export type CreatePricingRegionRequest = {
  code: string;
  description?: string | null;
};

export type UpdatePricingRegionRequest = CreatePricingRegionRequest & {
  isActive: boolean;
};
