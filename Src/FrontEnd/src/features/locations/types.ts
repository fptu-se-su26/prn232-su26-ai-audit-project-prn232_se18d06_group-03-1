export type GoongPlacePrediction = {
  description: string;
  placeId: string;
  structuredFormatting: {
    mainText: string;
    secondaryText: string;
  } | null;
  compound: {
    commune: string | null;
    province: string | null;
  } | null;
};

export type GoongPlaceAutocompleteResponse = {
  predictions: GoongPlacePrediction[];
};

export type GoongPlaceDetailResponse = {
  placeId: string;
  formattedAddress: string;
  name: string;
  latitude: number;
  longitude: number;
};
