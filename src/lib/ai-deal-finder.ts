import Anthropic from "@anthropic-ai/sdk";
import type { DealResult } from "@/types";

const client = new Anthropic();

export async function findDealsForBill(bill: {
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  planDetails?: string | null;
}): Promise<DealResult[]> {
  const today = new Date().toLocaleDateString("en-AU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const prompt = `You are a consumer finance advisor for Australians. A user is paying $${bill.monthlyAmount}/month to ${bill.provider} for ${bill.name} (${bill.category}${bill.planDetails ? `: ${bill.planDetails}` : ""}).

Today is ${today}. Based on your knowledge of the Australian ${bill.category} market, suggest 2-3 competing providers that could save this user money. Include any promotional offers where providers offer discounted rates for the first several months.

Return ONLY a valid JSON array with no markdown, no code blocks, just the raw JSON:
[
  {
    "provider": "Provider Name",
    "planDetails": "Brief plan description",
    "monthlyAmount": <regular monthly price as number>,
    "promoAmount": <promo monthly price as number or null>,
    "promoDuration": <promo duration in months as number or null>,
    "annualSaving": <estimated annual saving vs current $${bill.monthlyAmount}/month as number>,
    "sourceNote": "Brief note on where this info is from or caveat"
  }
]

Only include deals that would actually save money. If no real alternatives exist, return an empty array [].`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "");
    const deals: DealResult[] = JSON.parse(cleaned);
    return Array.isArray(deals) ? deals : [];
  } catch {
    return [];
  }
}
