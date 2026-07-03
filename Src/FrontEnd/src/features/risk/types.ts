export type BookingRiskInput = {
  bookingId: number;
  trust_score: number;
  cancel_count: number;
  duration: number;
  vehicle_value: number;
};

export type BookingRiskPrediction = {
  bookingId: number;
  risk_level: "Low" | "Medium" | "High";
  probability: number;
  risk_score: number;
  suggested_action: "Nen duyet" | "Can nhac" | "Nen tu choi";
  operational_decision: "autoApprove" | "manualReview" | "reject";
  deposit_recommendation: DepositRecommendation;
  top_risk_factors: string[];
  explanation: string;
  retrieved_context: BookingRiskRetrievedContext[];
  modelVersion: string;
};

export type DepositRecommendation = {
  currency: "VND";
  rate: number;
  amount: number;
  reason: string;
};

export type BookingRiskRetrievedContext = {
  source: string;
  title: string;
  content: string;
  relevance: number;
};

export type BookingRiskResponse = {
  input: BookingRiskInput;
  prediction: BookingRiskPrediction;
};
