import type { InspectionReportResponse } from "@/features/booking/types";

export type CompensationDirection = "CustomerPaysOwner" | "OwnerRefundsCustomer" | "NoCompensation";
export type DisputeSettlementMethod = "ExternalOnly" | "DepositThenExternal";
export type EvidenceRequestedFrom = "Customer" | "Owner" | "Both";

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
  compensationDirection: CompensationDirection;
  settlementMethod: DisputeSettlementMethod;
  compensationAmount?: number | null;
  updatedAt?: string | null;
};

export type RequestMoreEvidenceRequest = {
  requestedFrom: EvidenceRequestedFrom;
  message: string;
  updatedAt?: string | null;
};

export type AddDisputeEvidenceRequest = {
  evidenceUrls?: string | null;
  message: string;
  updatedAt?: string | null;
};

export type DisputeEvidenceSubmissionItem = {
  id: number;
  submittedBy: number;
  submittedByName: string;
  submittedRole: string;
  message: string;
  evidenceUrls: string | null;
  createdAt: string;
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
  compensationDirection: CompensationDirection;
  settlementMethod: DisputeSettlementMethod;
  compensationAmount: number | null;
  adminApprovedAmount: number | null;
  finalCompensationAmount: number | null;
  platformSettledAmount: number;
  platformSettlementCompletedAt: string | null;
  externalSettlementAmount: number;
  customerExternalConfirmed: boolean;
  customerExternalConfirmedAt: string | null;
  ownerExternalConfirmed: boolean;
  ownerExternalConfirmedAt: string | null;
  decisionIssuedAt: string | null;
  closedAt: string | null;
  adminCloseReason: string | null;
  escalatedBy: number | null;
  escalatedAt: string | null;
  evidenceRequestedFrom: EvidenceRequestedFrom | null;
  evidenceRequestMessage: string | null;
  evidenceRequestedAt: string | null;
  evidenceRespondedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  inspectionReports: InspectionReportResponse[];
  evidenceSubmissions: DisputeEvidenceSubmissionItem[];
};
