import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export type SystemConfigValueType = "bool" | "decimal" | "int" | "string";

export interface SystemConfigItem {
  id: number;
  configKey: string;
  configValue: string;
  dataType: SystemConfigValueType;
  category: string;
  displayName: string;
  description?: string | null;
  updatedBy?: number | null;
  updatedAt: string;
}

export interface UpdateSystemConfigRequest {
  items: Array<{
    configKey: string;
    configValue: string;
  }>;
}

export async function getSystemConfigs(): Promise<SystemConfigItem[]> {
  const res = await apiClient.get<ApiResponse<SystemConfigItem[]>>(endpoints.admin.systemConfig);
  return res.data.data ?? [];
}

export async function updateSystemConfigs(request: UpdateSystemConfigRequest): Promise<SystemConfigItem[]> {
  const res = await apiClient.put<ApiResponse<SystemConfigItem[]>>(endpoints.admin.systemConfig, request);
  return res.data.data ?? [];
}
