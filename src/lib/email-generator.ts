interface EmailParams {
  profile: { name: string; address?: string | null; email?: string | null };
  currentBill: { name: string; provider: string; monthlyAmount: number };
  deal: { provider: string; planDetails: string; monthlyAmount: number; promoAmount?: number | null; promoDuration?: number | null };
}

export function generateSwitchEmail({ profile, currentBill, deal }: EmailParams): {
  subject: string;
  body: string;
} {
  const price = deal.promoAmount
    ? `$${deal.promoAmount}/month for ${deal.promoDuration} months, then $${deal.monthlyAmount}/month`
    : `$${deal.monthlyAmount}/month`;

  const subject = `New customer enquiry — ${deal.planDetails}`;

  const body = `Hi ${deal.provider} team,

I'm interested in signing up for your ${deal.planDetails} plan${profile.address ? ` at ${profile.address}` : ""}.

I'm currently with ${currentBill.provider} and paying $${currentBill.monthlyAmount}/month for ${currentBill.name}. I'd like to switch and take advantage of your ${price} offer.

Could you please contact me${profile.email ? ` at ${profile.email}` : ""} to arrange the switchover?

Kind regards,
${profile.name}`;

  return { subject, body };
}
