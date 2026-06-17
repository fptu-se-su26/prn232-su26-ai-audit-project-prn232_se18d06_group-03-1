export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: string[] | null;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
