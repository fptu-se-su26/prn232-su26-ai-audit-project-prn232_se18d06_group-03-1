export type VehicleModelResponse = {
  id: number;
  brandId: number;
  brandName: string;
  vehicleType: string;
  name: string;
  isActive: boolean;
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
