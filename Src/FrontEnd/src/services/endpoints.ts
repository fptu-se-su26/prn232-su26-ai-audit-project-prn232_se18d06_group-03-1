export const endpoints = {
  auth: {
    register: "/api/auth/register",
    verifyOtp: "/api/auth/verify-otp",
    resendOtp: "/api/auth/resend-otp",
    googleLogin: "/api/auth/google-login",
    login: "/api/auth/login",
    refreshToken: "/api/auth/refresh-token",
    logout: "/api/auth/logout",
    forgotPassword: "/api/auth/forgot-password",
    resetPassword: "/api/auth/reset-password",
    changePassword: "/api/auth/change-password",
    me: "/api/auth/me",
  },
  admin: {
    users: "/api/admin/users",
    vehicleBrands: "/api/admin/vehicle-brands",
    vehicleModels: "/api/admin/vehicle-models",
    vehicleModelVariants: "/api/admin/vehicle-model-variants",
    driverLicenseClasses: "/api/admin/driver-license-classes",
    vehicleFeatures: "/api/admin/vehicle-features",
  },
  swaggerJson: "/swagger/v1/swagger.json",
};
