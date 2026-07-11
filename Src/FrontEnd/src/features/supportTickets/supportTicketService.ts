import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type {
  AddTicketMessageRequest,
  CreateSupportTicketRequest,
  PagedResult,
  SupportTicketDetailResponse,
  SupportTicketListItem,
  SupportTicketListRequest,
  UpdateSupportTicketStatusRequest,
} from "./types";

export async function createSupportTicket(data: CreateSupportTicketRequest): Promise<SupportTicketDetailResponse> {
  const res = await apiClient.post<ApiResponse<SupportTicketDetailResponse>>(endpoints.supportTickets.base, data);
  return res.data.data!;
}

export async function getMySupportTickets(params: SupportTicketListRequest): Promise<PagedResult<SupportTicketListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<SupportTicketListItem>>>(endpoints.supportTickets.my, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getStaffSupportTickets(params: SupportTicketListRequest): Promise<PagedResult<SupportTicketListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<SupportTicketListItem>>>(endpoints.supportTickets.staff, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
}

export async function getSupportTicketById(id: number): Promise<SupportTicketDetailResponse> {
  const res = await apiClient.get<ApiResponse<SupportTicketDetailResponse>>(endpoints.supportTickets.byId(id));
  return res.data.data!;
}

export async function addSupportTicketMessage(id: number, data: AddTicketMessageRequest): Promise<SupportTicketDetailResponse> {
  const res = await apiClient.post<ApiResponse<SupportTicketDetailResponse>>(endpoints.supportTickets.messages(id), data);
  return res.data.data!;
}

export async function updateSupportTicketStatus(id: number, data: UpdateSupportTicketStatusRequest): Promise<SupportTicketDetailResponse> {
  const res = await apiClient.put<ApiResponse<SupportTicketDetailResponse>>(endpoints.supportTickets.status(id), data);
  return res.data.data!;
}

export async function uploadSupportTicketAttachment(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiResponse<{ url: string }>>(endpoints.supportTickets.uploadAttachment, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data!.url;
}
