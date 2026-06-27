export type VehicleListItemResponse = {
  id: number;
  brandName: string;
  modelName: string;
  variantName: string | null;
  vehicleType: string;
  year: number;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  featuredImage: string | null;
  createdAt: string;
};

export type VehicleImageResponse = {
  id: number;
  imageUrl: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type VehicleFeatureResponse = {
  id: number;
  name: string;
};

export type VehicleResponse = {
  id: number;
  ownerId: number;
  brandId: number;
  brandName: string;
  modelId: number;
  modelName: string;
  variantId: number | null;
  variantName: string | null;
  vehicleType: string;
  year: number;
  licensePlate: string;
  odometerKm: number | null;
  description: string | null;
  address: string;
  pricePerDay: number;
  status: string;
  rejectionReason: string | null;
  featuredImage: string | null;
  images: VehicleImageResponse[];
  features: VehicleFeatureResponse[];
  createdAt: string;
};

export type CreateVehicleRequest = {
  brandId: number;
  modelId: number;
  variantId?: number | null;
  vehicleType: string;
  year: number;
  licensePlate: string;
  odometerKm?: number | null;
  description?: string | null;
  address: string;
  pricePerDay: number;
  featureIds: number[];
  imageUrls: string[];
  featuredImageIndex: number;
  documentFileUrl?: string | null;
};

export type UpdateVehicleRequest = {
  year: number;
  licensePlate: string;
  odometerKm?: number | null;
  description?: string | null;
  address: string;
  pricePerDay: number;
  featureIds: number[];
};

export type CatalogBrand = {
  id: number;
  name: string;
  vehicleType: string;
};

export type CatalogModel = {
  id: number;
  brandId: number;
  name: string;
};

export type CatalogVariant = {
  id: number;
  modelId: number;
  name: string;
  vehicleType: string;
  seatCount: number | null;
  transmission: string | null;
  fuelType: string | null;
  bodyType: string | null;
  bikeType: string | null;
  engineCapacity: string | null;
};

export type CatalogFeature = {
  id: number;
  name: string;
  vehicleType: string;
};
