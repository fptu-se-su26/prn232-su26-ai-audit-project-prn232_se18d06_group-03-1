export interface BookingResponse {
  id: number;
  bookingCode: string;
  customerId: number;
  vehicleId: number;
  vehicleName?: string;
  vehicleImage?: string;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  platformFee: number;
  depositAmount: number;
  totalAmount: number;
  pickupAddress: string;
  returnAddress?: string;
  customerNote?: string;
  status: string;
  riskScore?: number;
  riskLevel?: string;
  riskFactors?: string[];
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: BookingStatusHistoryDto[];
}

export interface BookingStatusHistoryDto {
  fromStatus?: string;
  toStatus: string;
  changedBy?: number;
  note?: string;
  createdAt: string;
}

export interface CreateBookingRequest {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupAddress: string;
  returnAddress?: string;
  customerNote?: string;
}

export interface ApproveBookingRequest {
  approve: boolean;
  reason?: string;
}

export interface RejectBookingRequest {
  reason: string;
}

export interface BookingListRequest {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface CheckInOutImageResponse {
  id: number;
  bookingId: number;
  inspectionId?: number;
  imageUrl: string;
  imageType: string;
  uploadedBy: number;
  createdAt: string;
}

export interface InspectionReportResponse {
  id: number;
  bookingId: number;
  type: string;
  createdByUserId: number;
  odometerKm?: number;
  fuelLevel?: string;
  damageNoted: boolean;
  damageDescription?: string;
  reportPdfUrl?: string;
  customerSignatureUrl?: string;
  isCustomerConfirmed: boolean;
  createdAt: string;
  images: CheckInOutImageResponse[];
}
