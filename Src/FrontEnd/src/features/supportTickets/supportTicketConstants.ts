export const supportTicketStatusLabels: Record<string, string> = {
  Open: "Đang mở",
  InProgress: "Đang xử lý",
  Resolved: "Đã xử lý",
  Closed: "Đã đóng",
};

export const supportTicketStatusColors: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  InProgress: "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};

export const supportTicketPriorityLabels: Record<string, string> = {
  Low: "Thấp",
  Normal: "Bình thường",
  High: "Cao",
  Urgent: "Khẩn cấp",
};

export const supportTicketPriorityColors: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Normal: "bg-blue-100 text-blue-700",
  High: "bg-orange-100 text-orange-700",
  Urgent: "bg-red-100 text-red-700",
};

export const supportTicketStatusOptions = [
  { value: "", label: "Tất cả" },
  { value: "Open", label: supportTicketStatusLabels.Open },
  { value: "InProgress", label: supportTicketStatusLabels.InProgress },
  { value: "Resolved", label: supportTicketStatusLabels.Resolved },
  { value: "Closed", label: supportTicketStatusLabels.Closed },
];

export const supportTicketEditableStatusOptions = supportTicketStatusOptions.filter((option) => option.value);

export const supportTicketPriorityOptions = [
  { value: "Low", label: supportTicketPriorityLabels.Low },
  { value: "Normal", label: supportTicketPriorityLabels.Normal },
  { value: "High", label: supportTicketPriorityLabels.High },
  { value: "Urgent", label: supportTicketPriorityLabels.Urgent },
];

export const supportTicketCategoryOptions = [
  { value: "Booking", label: "Đặt xe" },
  { value: "Payment", label: "Thanh toán" },
  { value: "Vehicle", label: "Xe/Chủ xe" },
  { value: "Account", label: "Tài khoản" },
  { value: "Other", label: "Khác" },
];

export function formatSupportTicketDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}
