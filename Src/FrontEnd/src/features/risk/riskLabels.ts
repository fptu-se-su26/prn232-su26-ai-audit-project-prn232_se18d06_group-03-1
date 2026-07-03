export const riskLevelLabels: Record<string, string> = {
  Low: "Thấp",
  Medium: "Trung bình",
  High: "Cao",
};

export const riskActionLabels: Record<string, string> = {
  "Nen duyet": "Nên duyệt",
  "Can nhac": "Cân nhắc",
  "Nen tu choi": "Nên từ chối",
};

export const riskFactorLabels: Record<string, string> = {
  "cancel_count > 2": "Số lần hủy lớn hơn 2",
  "trust_score < 30": "Điểm uy tín dưới 30",
  "trust_score below normal": "Điểm uy tín thấp hơn bình thường",
  "has previous cancellations": "Có lịch sử hủy chuyến",
  "long rental duration": "Thời gian thuê dài",
  "high vehicle value": "Giá trị xe cao",
  "stable booking profile": "Hồ sơ booking ổn định",
};

export const operationalDecisionLabels: Record<string, string> = {
  autoApprove: "Tự động duyệt",
  manualReview: "Cần duyệt thủ công",
  reject: "Nên từ chối",
};
