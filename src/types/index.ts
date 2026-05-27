export type BillCategory =
  | "internet"
  | "phone"
  | "energy"
  | "insurance"
  | "streaming"
  | "mortgage"
  | "gym"
  | "other";

export const BILL_CATEGORIES: { value: BillCategory; label: string }[] = [
  { value: "internet", label: "Internet / NBN" },
  { value: "phone", label: "Mobile Phone" },
  { value: "energy", label: "Energy / Gas" },
  { value: "insurance", label: "Insurance" },
  { value: "streaming", label: "Streaming" },
  { value: "mortgage", label: "Mortgage" },
  { value: "gym", label: "Gym" },
  { value: "other", label: "Other" },
];

export interface DealResult {
  provider: string;
  planDetails: string;
  monthlyAmount: number;
  promoAmount?: number;
  promoDuration?: number;
  annualSaving: number;
  sourceNote?: string;
}
