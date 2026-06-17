import { apiClient } from "@/services/apiClient";
import type { ApiEnvelope, PagedResult } from "@/services/httpTypes";

export type VehicleQueueItem = {
  id: number;
  ownerId: number;
  licensePlate: string;
  brandId: number;
  modelId: number;
  year: number;
  description?: string | null;
  address: string;
  pricePerDay: number;
  status: string;
  createdAt: string;
};

export type VerificationItem = {
  id: number;
  userId: number;
  type: string;
  frontImageUrl: string;
  backImageUrl?: string | null;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
};

export type TicketMessage = {
  id: number;
  senderId: number;
  message: string;
  createdAt: string;
};

export type SupportTicket = {
  id: number;
  userId: number;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  assignedStaffId?: number | null;
  priority: string;
  createdAt: string;
};

export type SupportTicketDetail = SupportTicket & {
  messages: TicketMessage[];
};

export type Dispute = {
  id: number;
  bookingId: number;
  openedBy: number;
  assignedStaffId?: number | null;
  status: string;
  description?: string | null;
  resolution?: string | null;
  compensationAmount?: number | null;
  evidenceUrls: string[];
  timeline: string[];
  resolvedAt?: string | null;
  createdAt: string;
};

export type BookingDetail = {
  id: number;
  bookingCode: string;
  customerId: number;
  vehicleId: number;
  vehicleName: string;
  ownerId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  basePrice: number;
  platformFee: number;
  depositAmount: number;
  totalAmount: number;
  pickupAddress: string;
  customerNote?: string | null;
  status: string;
  riskScore?: number | null;
  cancelReason?: string | null;
  contractUrl?: string | null;
  createdAt: string;
};

export type InspectionDetail = {
  id: number;
  bookingId: number;
  type: string;
  staffId: number;
  odometerKm?: number | null;
  fuelLevel?: string | null;
  damageNoted: boolean;
  damageDescription?: string | null;
  reportPdfUrl?: string | null;
  images: string[];
  createdAt: string;
};

export async function getPendingVehicleQueue(page = 1, pageSize = 10) {
  const res = await apiClient.get<ApiEnvelope<PagedResult<VehicleQueueItem>>>("/staff/vehicles/pending", { params: { page, pageSize } });
  return res.data.data;
}

export async function reviewVehicle(id: number, approve: boolean, reason?: string) {
  await apiClient.put<ApiEnvelope<object>>(`/staff/vehicles/${id}/approve`, { approve, reason });
}

export async function getVerificationQueue(page = 1, pageSize = 10) {
  const res = await apiClient.get<ApiEnvelope<PagedResult<VerificationItem>>>("/verifications/queue", { params: { page, pageSize } });
  return res.data.data;
}

export async function approveVerification(id: number) {
  await apiClient.put<ApiEnvelope<VerificationItem>>(`/verifications/${id}/approve`);
}

export async function rejectVerification(id: number, reason: string) {
  await apiClient.put<ApiEnvelope<VerificationItem>>(`/verifications/${id}/reject`, { reason });
}

export async function getSupportTicketQueue(page = 1, pageSize = 10) {
  const res = await apiClient.get<ApiEnvelope<PagedResult<SupportTicket>>>("/support-tickets/queue", { params: { page, pageSize } });
  return res.data.data;
}

export async function getSupportTicketDetail(id: number) {
  const res = await apiClient.get<ApiEnvelope<SupportTicketDetail>>(`/support-tickets/${id}`);
  return res.data.data;
}

export async function replySupportTicket(id: number, message: string) {
  const res = await apiClient.post<ApiEnvelope<TicketMessage>>(`/support-tickets/${id}/messages`, { message });
  return res.data.data;
}

export async function closeSupportTicket(id: number) {
  await apiClient.put<ApiEnvelope<object>>(`/support-tickets/${id}/status`);
}

export async function getDisputes(status?: string, page = 1, pageSize = 10) {
  const res = await apiClient.get<ApiEnvelope<PagedResult<Dispute>>>("/disputes", { params: { status, page, pageSize } });
  return res.data.data;
}

export async function getDisputeDetail(id: number) {
  const res = await apiClient.get<ApiEnvelope<Dispute>>(`/disputes/${id}`);
  return res.data.data;
}

export async function resolveDispute(id: number, resolution: string, compensationAmount?: number) {
  const res = await apiClient.put<ApiEnvelope<Dispute>>(`/disputes/${id}/resolve`, { resolution, compensationAmount });
  return res.data.data;
}

export async function escalateDispute(id: number) {
  const res = await apiClient.put<ApiEnvelope<Dispute>>(`/disputes/${id}/escalate`);
  return res.data.data;
}

export async function getBookingDetail(id: number) {
  const res = await apiClient.get<ApiEnvelope<BookingDetail>>(`/bookings/${id}`);
  return res.data.data;
}

export async function getInspection(bookingId: number, type: "CheckIn" | "CheckOut") {
  const res = await apiClient.get<ApiEnvelope<InspectionDetail>>(`/inspections/booking/${bookingId}/${type}`);
  return res.data.data;
}

export async function submitInspection(
  type: "check-in" | "check-out",
  payload: {
    bookingId: number;
    odometerKm?: number;
    fuelLevel?: string;
    damageNoted: boolean;
    damageDescription?: string;
    files: File[];
  },
) {
  const formData = new FormData();
  formData.append("bookingId", String(payload.bookingId));
  if (typeof payload.odometerKm === "number") formData.append("odometerKm", String(payload.odometerKm));
  if (payload.fuelLevel) formData.append("fuelLevel", payload.fuelLevel);
  formData.append("damageNoted", String(payload.damageNoted));
  if (payload.damageDescription) formData.append("damageDescription", payload.damageDescription);
  payload.files.forEach((file) => formData.append("images", file));

  const res = await apiClient.post<ApiEnvelope<InspectionDetail>>(`/inspections/${type}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function refundDeposit(
  bookingId: number,
  payload: {
    action: "FullRefund" | "PartialRefund" | "OpenDispute";
    deductionAmount?: number;
    note?: string;
    evidenceUrls: string[];
  },
) {
  const res = await apiClient.post<ApiEnvelope<object>>(`/payments/refund/${bookingId}`, payload);
  return res.data.data;
}
