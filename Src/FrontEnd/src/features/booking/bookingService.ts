import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";
import type { BookingResponse, BookingListRequest, CreateBookingRequest, RejectBookingRequest } from "./types";

export async function createBooking(data: CreateBookingRequest): Promise<BookingResponse> {
  const res = await apiClient.post<ApiResponse<BookingResponse>>(endpoints.bookings.base, data);
  return res.data.data!;
}

export async function getBookingById(id: number): Promise<BookingResponse> {
  const res = await apiClient.get<ApiResponse<BookingResponse>>(endpoints.bookings.byId(id));
  return res.data.data!;
}

export async function getMyBookings(params: BookingListRequest): Promise<{ items: BookingResponse[]; totalCount: number; page: number; pageSize: number }> {
  const res = await apiClient.get<ApiResponse<{ items: BookingResponse[]; totalCount: number; page: number; pageSize: number }>>(endpoints.bookings.my, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10 };
}

export async function getOwnerBookings(params: BookingListRequest): Promise<{ items: BookingResponse[]; totalCount: number; page: number; pageSize: number }> {
  const res = await apiClient.get<ApiResponse<{ items: BookingResponse[]; totalCount: number; page: number; pageSize: number }>>(endpoints.bookings.owner, { params });
  return res.data.data ?? { items: [], totalCount: 0, page: 1, pageSize: 10 };
}

export async function approveBooking(id: number): Promise<BookingResponse> {
  const res = await apiClient.put<ApiResponse<BookingResponse>>(endpoints.bookings.approve(id));
  return res.data.data!;
}

export async function rejectBooking(id: number, data: RejectBookingRequest): Promise<BookingResponse> {
  const res = await apiClient.put<ApiResponse<BookingResponse>>(endpoints.bookings.reject(id), data);
  return res.data.data!;
}
