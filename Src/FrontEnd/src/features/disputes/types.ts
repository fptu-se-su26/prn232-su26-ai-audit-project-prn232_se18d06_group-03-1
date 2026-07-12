export type DisputeListRequest = {
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
};

export type CreateDisputeRequest = {
  bookingId: number;
  reportType: string;
  description: string;
  evidenceUrls?: string | null;
};

export type ResolveDisputeRequest = {
  resolution: string;
  compensationAmount?: number | null;
};

export type DisputeListItem = {
  id: number;
  bookingId: number;
  bookingCode: string;
  openedBy: number;
  openedByName: string;
  customerId: number;
  customerName: string;
  ownerId: number;
  ownerName: string;
  assignedStaffId: number | null;
  assignedStaffName: string | null;
  status: string;
  reportType: string;
  description: string;
  evidenceUrls: string | null;
  resolution: string | null;
  compensationAmount: number | null;
  resolvedAt: string | null;
  createdAt: string;
};

export type DisputeAuditLogItem = {
  id: number;
  actorId: number | null;
  actorRole: string | null;
  actorName: string;
  action: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

export type DisputeDetailResponse = DisputeListItem & {
  auditLogs: DisputeAuditLogItem[];
};
