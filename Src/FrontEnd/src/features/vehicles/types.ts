export type VehicleListItemResponse = {
  id: number;
  brandName: string;
  modelName: string;
  variantName: string | null;
  vehicleType: string;
  year: number;
  licensePlate: string;
  pricePerDay: number;
  depositPercent: number;
  areaName: string | null;
  pricingMode: "Fixed" | "Auto" | null;
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

export type VehicleDocumentResponse = {
  id: number;
  docType: string;
  fileUrl: string;
  expiryDate: string | null;
  verified: boolean;
  isCurrent: boolean;
  verificationStatus: string;
  verificationProvider: string | null;
  processedAt: string | null;
  decisionReason: string | null;
  ocrLicensePlate: string | null;
  ocrBrand: string | null;
  ocrModel: string | null;
  ocrEngineNumber: string | null;
  ocrChassisNumber: string | null;
  ocrConfidence: number | null;
  createdAt: string | null;
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
  areaId: number | null;
  areaName: string | null;
  pricingRegionId: number | null;
  pricingRegionCode: string | null;
  pricePerDay: number;
  depositPercent: number;
  pricingMode: "Fixed" | "Auto" | null;
  fixedPricePerDay: number | null;
  autoMinPrice: number | null;
  autoMaxPrice: number | null;
  currentPricePerDay: number | null;
  suggestedBasePrice: number | null;
  suggestedMinPrice: number | null;
  suggestedMaxPrice: number | null;
  status: string;
  rejectionReason: string | null;
  featuredImage: string | null;
  images: VehicleImageResponse[];
  features: VehicleFeatureResponse[];
  documents: VehicleDocumentResponse[];
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
  areaId?: number | null;
  pricePerDay: number;
  depositPercent: number;
  pricingMode?: "Fixed" | "Auto" | null;
  fixedPricePerDay?: number | null;
  autoMinPrice?: number | null;
  autoMaxPrice?: number | null;
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
  areaId?: number | null;
  pricePerDay: number;
  depositPercent: number;
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

export type CatalogArea = {
  id: number;
  province: string;
  district: string;
  pricingRegionId: number;
  pricingRegionCode: string;
};

export type CatalogPricingRegion = {
  id: number;
  code: string;
  description: string | null;
};

export type PricingSuggestionResponse = {
  hasSuggestion: boolean;
  modelId: number;
  areaId: number | null;
  pricingRegionId: number | null;
  pricingRegionCode: string | null;
  basePrice: number | null;
  suggestedMinPrice: number | null;
  suggestedMaxPrice: number | null;
};

export type VehiclePricingResponse = {
  vehicleId: number;
  pricingMode: "Fixed" | "Auto";
  fixedPricePerDay: number | null;
  autoMinPrice: number | null;
  autoMaxPrice: number | null;
  currentPricePerDay: number;
  lastCalculatedAt: string | null;
  lastUpdatedAt: string;
  suggestion: PricingSuggestionResponse | null;
};

export type UpdateVehiclePricingRequest = {
  pricingMode: "Fixed" | "Auto";
  fixedPricePerDay?: number | null;
  autoMinPrice?: number | null;
  autoMaxPrice?: number | null;
};

export type VehicleModerationListItem = {
  id: number;
  ownerId: number;
  ownerName: string;
  brandName: string;
  modelName: string;
  vehicleType: string;
  year: number;
  licensePlate: string;
  pricePerDay: number;
  status: string;
  documentStatus: string | null;
  documentVerified: boolean;
  createdAt: string;
};

export type VehicleModerationChartPoint = {
  label: string;
  value: number;
};

export type VehicleModerationOverviewResponse = {
  totalVehicles: number;
  pendingListings: number;
  approvedListings: number;
  rejectedListings: number;
  pendingDocuments: number;
  verifiedDocuments: number;
  manualReviewDocuments: number;
  needMoreInfoDocuments: number;
  rejectedDocuments: number;
  failedDocuments: number;
  overrideCandidates: number;
  listingStatusChart: VehicleModerationChartPoint[];
  documentStatusChart: VehicleModerationChartPoint[];
  vehicleTypeChart: VehicleModerationChartPoint[];
};

export type VehicleVerificationLogResponse = {
  id: string | null;
  vehicleId: number;
  vehicleDocumentId: number;
  recommendation: string | null;
  flags: string[];
  ocrConfidence: number | null;
  message: string | null;
  errorMessage: string | null;
  provider: string;
  action: string | null;
  actorUserId: number | null;
  createdAt: string;
};

export type VehicleModerationDetailResponse = VehicleResponse & {
  ownerName: string;
  verificationLogs: VehicleVerificationLogResponse[];
};
