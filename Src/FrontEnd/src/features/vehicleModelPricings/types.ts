export type VehicleModelPricingResponse = {
  id: number;
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  vehicleType: string;
  basePrice: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVehicleModelPricingRequest = {
  modelId: number;
  basePrice: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
};

export type UpdateVehicleModelPricingRequest = CreateVehicleModelPricingRequest & {
  isActive: boolean;
};

export type RegionPriceResponse = {
  regionCode: string;
  regionName: string;
  coefficient: number;
  calculatedBasePrice: number;
  calculatedMinPrice: number;
  calculatedMaxPrice: number;
};
