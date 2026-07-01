export type DriverLicenseClassResponse = {
  id: number;
  code: string;
  displayName: string;
  description: string;
  systemVersion: string;
  isActive: boolean;
};

export type CreateDriverLicenseClassRequest = {
  code: string;
  displayName: string;
  description: string;
  systemVersion: string;
};

export type UpdateDriverLicenseClassRequest = CreateDriverLicenseClassRequest & {
  isActive: boolean;
};
