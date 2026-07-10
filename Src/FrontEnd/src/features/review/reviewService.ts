import { apiClient, bareApiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export type ReviewResponse = {
  id: number;
  bookingId: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar: string | null;
  revieweeId: number;
  vehicleId: number | null;
  rating: number;
  cleanlinessScore: number | null;
  accuracyScore: number | null;
  supportScore: number | null;
  comment: string | null;
  reviewType: string;
  createdAt: string;
};

export type CreateReviewRequest = {
  bookingId: number;
  rating: number;
  cleanlinessScore?: number;
  accuracyScore?: number;
  supportScore?: number;
  comment?: string;
};

export async function createCustomerReview(data: CreateReviewRequest): Promise<ReviewResponse> {
  const res = await apiClient.post<ApiResponse<ReviewResponse>>(endpoints.reviews.customer, data);
  return res.data.data!;
}

export async function createOwnerReview(data: CreateReviewRequest): Promise<ReviewResponse> {
  const res = await apiClient.post<ApiResponse<ReviewResponse>>(endpoints.reviews.owner, data);
  return res.data.data!;
}

export async function getBookingReviews(bookingId: number): Promise<ReviewResponse[]> {
  const res = await apiClient.get<ApiResponse<ReviewResponse[]>>(endpoints.reviews.byBooking(bookingId));
  return res.data.data ?? [];
}

export async function getVehicleReviews(vehicleId: number): Promise<ReviewResponse[]> {
  const res = await bareApiClient.get<ApiResponse<ReviewResponse[]>>(endpoints.reviews.byVehicle(vehicleId));
  return res.data.data ?? [];
}

export async function hasReviewed(bookingId: number): Promise<boolean> {
  const res = await apiClient.get<ApiResponse<boolean>>(endpoints.reviews.hasReviewed(bookingId));
  return res.data.data ?? false;
}
