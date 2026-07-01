export type AreaResponse = {
  id: number;
  province: string;
  district: string;
  pricingRegionId: number;
  pricingRegionCode: string;
  isActive: boolean;
};

export type CreateAreaRequest = {
  province: string;
  district: string;
  pricingRegionId: number;
};

export type UpdateAreaRequest = CreateAreaRequest & {
  isActive: boolean;
};
