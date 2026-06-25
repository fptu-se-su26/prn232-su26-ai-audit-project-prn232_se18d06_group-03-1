export type VehicleModelVariantResponse = {
  id: number;
  modelId: number;
  modelName: string;
  brandId: number;
  brandName: string;
  name: string;
  vehicleType: string;
  seatCount?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  bodyType?: string | null;
  drivetrain?: string | null;
  bikeType?: string | null;
  engineCapacity?: string | null;
  requiredLicenseClassId?: number | null;
  requiredLicenseClassCode?: string | null;
  requiredLicenseClassDisplayName?: string | null;
  requiredLicenseClassSystemVersion?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateVehicleModelVariantRequest = {
  modelId: number;
  name: string;
  vehicleType: string;
  seatCount?: number | null;
  transmission?: string | null;
  fuelType?: string | null;
  bodyType?: string | null;
  drivetrain?: string | null;
  bikeType?: string | null;
  engineCapacity?: string | null;
  requiredLicenseClassId?: number | null;
};

export type UpdateVehicleModelVariantRequest = CreateVehicleModelVariantRequest & {
  isActive: boolean;
};
