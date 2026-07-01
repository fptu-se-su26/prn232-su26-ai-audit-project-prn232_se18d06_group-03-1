export type VehicleBrandResponse = {
  id: number;
  name: string;
  vehicleType: string;
  isActive: boolean;
};

export type CreateVehicleBrandRequest = {
  name: string;
  vehicleType: string;
};

export type UpdateVehicleBrandRequest = {
  name: string;
  vehicleType: string;
  isActive: boolean;
};
