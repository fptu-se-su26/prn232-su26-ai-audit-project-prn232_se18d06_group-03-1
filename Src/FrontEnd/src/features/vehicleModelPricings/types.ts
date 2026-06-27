export type VehicleModelPricingResponse = {
  id: number;
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  vehicleType: string;
  pricingRegionId: number;
  pricingRegionCode: string;
  basePrice: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVehicleModelPricingRequest = {
  modelId: number;
  pricingRegionId: number;
  basePrice: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
};

export type UpdateVehicleModelPricingRequest = CreateVehicleModelPricingRequest & {
  isActive: boolean;
};
