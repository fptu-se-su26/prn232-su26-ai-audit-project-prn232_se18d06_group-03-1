export type VehicleFeatureResponse = {
  id: number;
  name: string;
  vehicleType: string;
  isActive: boolean;
};

export type CreateVehicleFeatureRequest = {
  name: string;
  vehicleType: string;
};

export type UpdateVehicleFeatureRequest = CreateVehicleFeatureRequest & {
  isActive: boolean;
};
