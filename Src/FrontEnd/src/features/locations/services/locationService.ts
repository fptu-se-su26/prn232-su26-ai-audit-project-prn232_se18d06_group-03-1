import type { ApiResponse } from "@/features/auth/types";
import type { GoongPlaceAutocompleteResponse, GoongPlaceDetailResponse } from "@/features/locations/types";
import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";

export async function autocompleteGoongPlaces(input: string, limit = 5) {
  const res = await apiClient.get<ApiResponse<GoongPlaceAutocompleteResponse>>(endpoints.locations.goongAutocomplete, {
    params: { input, limit },
  });
  return res.data.data?.predictions ?? [];
}

export async function getGoongPlaceDetail(placeId: string) {
  const res = await apiClient.get<ApiResponse<GoongPlaceDetailResponse>>(endpoints.locations.goongDetail, {
    params: { placeId },
  });
  return res.data.data;
}
