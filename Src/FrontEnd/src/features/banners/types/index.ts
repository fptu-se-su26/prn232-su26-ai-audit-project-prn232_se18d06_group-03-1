export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  imagePublicId?: string | null;
  promotionId?: number | null;
  promotionCode?: string | null;
  promotionName?: string | null;
  popupTitle: string;
  popupDescription: string;
  popupCtaLabel: string;
  displayOrder: number;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface HomepageBanner {
  id: number;
  title: string;
  imageUrl: string;
  promotionId?: number | null;
  promotionCode?: string | null;
  promotionName?: string | null;
  discountType?: string | null;
  discountValue?: number | null;
  vehicleType?: string | null;
  endAt?: string | null;
  popupTitle: string;
  popupDescription: string;
  popupCtaLabel: string;
  displayOrder: number;
}

export interface CreateBannerPayload {
  title: string;
  imageUrl: string;
  imagePublicId?: string;
  promotionId?: number;
  popupTitle: string;
  popupDescription: string;
  popupCtaLabel: string;
  displayOrder: number;
  isActive: boolean;
  startAt?: string;
  endAt?: string;
}

export interface UpdateBannerPayload {
  title?: string;
  imageUrl?: string;
  imagePublicId?: string;
  promotionId?: number;
  clearPromotion?: boolean;
  popupTitle?: string;
  popupDescription?: string;
  popupCtaLabel?: string;
  displayOrder?: number;
  isActive?: boolean;
  startAt?: string;
  clearStartAt?: boolean;
  endAt?: string;
  clearEndAt?: boolean;
}

export interface BannerUploadResult {
  imageUrl: string;
  imagePublicId: string;
}
