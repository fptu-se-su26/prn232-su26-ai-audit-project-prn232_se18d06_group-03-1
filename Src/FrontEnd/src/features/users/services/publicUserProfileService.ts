import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export type PublicProfileVehicle = {
  id: number;
  brandName: string;
  modelName: string;
  variantName: string | null;
  vehicleType: string;
  year: number;
  pricePerDay: number;
  primaryImage: string | null;
  address: string;
};

export type PublicProfileReview = {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type PublicUserProfile = {
  userId: number;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  createdAt: string;
  lastSeenAt: string | null;

  isOwner: boolean;
  isVerified: boolean;
  tier: string | null;
  totalTrips: number;
  averageRating: number | null;

  totalReviews: number;
  totalVehicles: number;

  vehicles: PublicProfileVehicle[];
  reviews: PublicProfileReview[];
};

export async function getPublicUserProfile(userId: number): Promise<PublicUserProfile> {
  const res = await apiClient.get<ApiResponse<PublicUserProfile>>(endpoints.users.profile(userId));
  return res.data.data;
}
