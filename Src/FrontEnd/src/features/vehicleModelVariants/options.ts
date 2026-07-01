  export const fuelTypeOptions = [
  { value: "Gasoline", label: "Xăng" },
  { value: "Diesel", label: "Dầu" },
  { value: "Electric", label: "Điện" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "Plug-in Hybrid", label: "Plug-in Hybrid" },
];

export const motorbikeTypeOptions = [
  { value: "Scooter", label: "Xe tay ga" },
  { value: "Manual", label: "Xe số" },
  { value: "Clutch", label: "Xe côn tay" },
  { value: "Sport", label: "Xe thể thao" },
  { value: "Cruiser", label: "Cruiser" },
  { value: "Adventure", label: "Adventure" },
];

export function getFuelTypeLabel(value?: string | null) {
  if (!value) return "-";
  return fuelTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getMotorbikeTypeLabel(value?: string | null) {
  if (!value) return "-";
  return motorbikeTypeOptions.find((option) => option.value === value)?.label ?? value;
}
