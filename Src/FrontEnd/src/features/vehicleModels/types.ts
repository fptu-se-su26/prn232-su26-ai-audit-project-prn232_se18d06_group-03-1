export type VehicleModelResponse = {
  id: number;
  brandId: number;
  brandName: string;
  vehicleType: string;
  name: string;
  isActive: boolean;
  variantCount: number;
};

export type CreateVehicleModelRequest = {
  brandId: number;
  name: string;
};

export type UpdateVehicleModelRequest = {
  brandId: number;
  name: string;
  isActive: boolean;
};
