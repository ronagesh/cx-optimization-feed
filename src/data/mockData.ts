import type { Issue, ImpactDataPoint } from '../types';

// Deterministic noise: layered sin waves so data looks natural but is reproducible
function noise(seed: number, amp: number): number {
  return Math.round(
    (Math.sin(seed * 1.7 + 0.3) * 0.5 +
      Math.sin(seed * 3.3 + 1.1) * 0.3 +
      Math.sin(seed * 0.6 + 2.5) * 0.2) *
      amp
  );
}

function makeDailyData(
  startDateStr: string,
  totalDays: number,
  fixDay: number | null,
  baseCsat: number,
  baseDeflection: number,
  csatLift: number,
  deflectionLift: number
): ImpactDataPoint[] {
  const start = new Date(startDateStr);
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let csat: number;
    let deflection: number;

    if (fixDay === null || i < fixDay) {
      csat = Math.min(100, Math.max(0, baseCsat + noise(i, 3)));
      deflection = Math.min(100, Math.max(0, baseDeflection + noise(i + 17, 3)));
    } else {
      const t = i - fixDay;
      const progress = 1 - Math.exp(-t / 12);
      csat = Math.min(100, Math.max(0, baseCsat + Math.round(csatLift * progress) + noise(i, 2)));
      deflection = Math.min(100, Math.max(0, baseDeflection + Math.round(deflectionLift * progress) + noise(i + 17, 2)));
    }

    return { date, csat, deflection };
  });
}

// Issue 1 & 2: Mar 1 → Apr 21 (52 days), fix applied Mar 31 (index 30)
// Issue 3-5: Mar 1 → Mar 28 (28 days), no fix
const ISSUE1_DATA = makeDailyData('2026-03-01', 52, 30, 68, 44, 12, 16);
const ISSUE2_DATA = makeDailyData('2026-03-01', 52, 30, 71, 47, 11, 17);
const ISSUE3_DATA = makeDailyData('2026-03-01', 28, null, 62, 52, 0, 0);
const ISSUE4_DATA = makeDailyData('2026-03-01', 28, null, 66, 56, 0, 0);
const ISSUE5_DATA = makeDailyData('2026-03-01', 28, null, 70, 60, 0, 0);

export const ISSUES: Issue[] = [
  {
    id: 'issue-1',
    title: 'Return Window Policy — Conflicting Answers',
    summary:
      'Customers are frequently pushing back on the return window the bot quotes, citing a different policy on your website. The bot\'s answers on this topic are inconsistent across conversations and correlate strongly with escalations and poor ratings.',
    category: 'Returns & Refunds',
    productLine: 'Apparel',
    status: 'new',
    priorityScore: 91,
    scoreBreakdown: {
      frequency: 88,
      csatImpact: 90,
      deflectionImpact: 85,
      businessImpact: 72,
      fixEffort: 18,
      confidenceScore: 97,
    },
    sampleSize: 3241,
    detectedAt: 'Detected across last 7 days',
    detectedDate: '2026-03-03',
    fixAppliedDate: '2026-03-31',
    conversationSamples: [
      {
        id: 'c1',
        customerMessage:
          'Hi, I bought a jacket 18 days ago and I want to return it. Is that still possible?',
        agentResponse:
          'Unfortunately our return window is 14 days, so your order is no longer eligible for a return. I apologize for the inconvenience.',
        improvedResponse:
          'Yes, absolutely! Our return window is {{returnWindow}} from delivery, so your jacket is well within the eligible period. You can start your return at example.com/returns — it only takes a minute and includes a prepaid label.',
        outcome: 'escalated',
      },
      {
        id: 'c2',
        customerMessage:
          'Your website says 30-day returns but the chat bot told me I only have 14 days. Which is it?',
        agentResponse:
          'I apologize for any confusion. Our return policy allows returns within 14 days of purchase.',
        improvedResponse:
          'You\'re right — our return policy is {{returnWindow}} from delivery. I\'m sorry for the confusion earlier. Head to example.com/returns to get started and I\'ll walk you through it if needed.',
        outcome: 'poor_rating',
      },
      {
        id: 'c3',
        customerMessage: 'Can I return shoes I bought 3 weeks ago?',
        agentResponse:
          'I\'m sorry, our return policy only covers items returned within 14 days. Since it\'s been 3 weeks, we\'re unable to process a return.',
        improvedResponse:
          'Yes! Since your purchase was 3 weeks ago and our return window is {{returnWindow}} from delivery, you\'re still within the eligible period. Visit example.com/returns to start your return.',
        outcome: 'escalated',
      },
    ],
    suggestedFix: {
      type: 'knowledge_base',
      title: 'Return Policy — Correct Window & Process',
      description:
        'Add or update a knowledge base article that clearly states your return window. The bot has no authoritative source to reference, which is causing it to give inconsistent answers.',
      currentGap:
        'No definitive article exists for "return window" or "how long do I have to return." Without a clear source, the bot is inconsistent — and customers are noticing the mismatch with what\'s on your website.',
      variables: [
        { key: 'returnWindow', label: 'Return window', placeholder: 'e.g. 30 days', defaultValue: '30 days' },
      ],
      proposedArticle: `# Return Policy

Customers may return most items within **{{returnWindow}}** of the delivery date for a full refund or exchange.

## Eligibility
- Items must be unworn, unwashed, and in original packaging with tags attached
- Final sale items are not eligible for return
- Swimwear and underwear are not eligible for return for hygiene reasons

## How to Start a Return
1. Visit our [Returns Portal](https://example.com/returns) or reply to your order confirmation email
2. Select the item(s) you wish to return and choose a reason
3. Print the prepaid return label (free for orders over $50; $6.99 for smaller orders)
4. Drop off the package at any UPS location within 30 days of delivery

## Refund Timeline
- Refunds are processed within 3–5 business days of receiving your return
- Credit card refunds may take an additional 2–3 business days to appear

## Exchanges
Prefer an exchange? Select "Exchange" in the Returns Portal and we'll ship your new item as soon as we receive the return.`,
    },
    impactData: ISSUE1_DATA,
    fixAppliedIndex: 30,
  },
  {
    id: 'issue-2',
    title: "Order Tracking Links Not Shared",
    summary:
      "When customers ask where their order is, the bot tells them to check their email instead of providing a direct tracking link. Most customers have already checked their email — they need the link, not a redirect.",
    category: 'Order Status',
    productLine: 'Footwear',
    status: 'new',
    priorityScore: 84,
    scoreBreakdown: {
      frequency: 95,
      csatImpact: 78,
      deflectionImpact: 88,
      businessImpact: 45,
      fixEffort: 22,
      confidenceScore: 92,
    },
    sampleSize: 2847,
    detectedAt: 'Detected across last 7 days',
    detectedDate: '2026-03-03',
    fixAppliedDate: '2026-03-31',
    conversationSamples: [
      {
        id: 'c4',
        customerMessage:
          "I can't find my tracking number. My order shipped 2 days ago but I don't know where it is.",
        agentResponse:
          'You should have received a shipping confirmation email with your tracking number. Please check your inbox and spam folder.',
        improvedResponse:
          "No problem — you can track your order directly at example.com/track. Just enter your order number and the email you used at checkout. No need to dig through your inbox.",
        outcome: 'poor_rating',
      },
      {
        id: 'c5',
        customerMessage:
          'I already checked my email — there is no tracking link. Can you just tell me where my order is?',
        agentResponse:
          "I'm sorry to hear that. The tracking information is sent via email once your order ships. If you haven't received it, please allow 24 hours.",
        improvedResponse:
          "Got it — here's your direct tracking link: example.com/track. Enter your order number and email address and you'll see your live shipment status right away.",
        outcome: 'escalated',
      },
    ],
    suggestedFix: {
      type: 'knowledge_base',
      title: 'Order Tracking — Direct Link & Lookup Instructions',
      description:
        'Add an article that gives customers a direct URL to track orders and explains how to look up by order number, so the bot can share an actionable link instead of redirecting to email.',
      currentGap:
        'The bot has no article about the order tracking portal URL or how to look up orders without the email link.',
      proposedArticle: `# Tracking Your Order

You can track your order at any time using our order tracking page — no account required.

## Track by Order Number
1. Go to [Track My Order](https://example.com/track)
2. Enter your **order number** (found in your confirmation email, e.g. #ORD-48291) and the **email address** you used at checkout
3. Your live shipment status will appear, including estimated delivery date

## Track via Carrier
Once your order ships, we send a confirmation email with a direct carrier tracking link. If you can't find it:
- Check your spam or promotions folder
- Search your inbox for "Your order has shipped"

## Carrier Contacts
| Carrier | Tracking Site | Phone |
|---------|--------------|-------|
| UPS | ups.com/track | 1-800-742-5877 |
| FedEx | fedex.com/track | 1-800-463-3339 |
| USPS | usps.com/track | 1-800-222-1811 |

## My order says "Delivered" but I haven't received it
Please wait 24 hours — packages are sometimes marked delivered early. If it still hasn't arrived, [contact us](https://example.com/contact) and we'll file a carrier claim on your behalf.`,
    },
    impactData: ISSUE2_DATA,
    fixAppliedIndex: 30,
  },
  {
    id: 'issue-3',
    title: 'International Shipping Costs Unknown',
    summary:
      "The bot can't answer questions about shipping costs to countries outside the US. Customers are dropping off without completing purchase because they can't get a clear answer.",
    category: 'Shipping',
    productLine: 'Apparel',
    status: 'new',
    priorityScore: 67,
    scoreBreakdown: {
      frequency: 58,
      csatImpact: 65,
      deflectionImpact: 72,
      businessImpact: 60,
      fixEffort: 30,
      confidenceScore: 88,
    },
    detectedAt: 'Detected across last 14 days',
    conversationSamples: [
      {
        id: 'c6',
        customerMessage: 'How much does shipping to Canada cost?',
        agentResponse:
          "I don't have information about international shipping rates at this time. Please contact our support team for details.",
        outcome: 'unresolved',
      },
      {
        id: 'c7',
        customerMessage: 'Do you ship to the UK and how much does it cost?',
        agentResponse:
          "I'm not able to provide international shipping costs. You may want to add items to your cart to see shipping options at checkout.",
        outcome: 'poor_rating',
      },
    ],
    suggestedFix: {
      type: 'knowledge_base',
      title: 'International Shipping Rates & Zones',
      description:
        'Add a knowledge base article with international shipping zones, estimated costs, and delivery timeframes so the bot can answer these questions directly.',
      currentGap:
        'No article exists covering international shipping costs. The bot has no data to draw from when asked about non-US shipping.',
      proposedArticle: `# International Shipping

We ship to 40+ countries worldwide. Shipping costs and delivery times vary by destination.

## Shipping Rates by Region

| Region | Standard (8–14 days) | Express (3–5 days) |
|--------|---------------------|-------------------|
| Canada & Mexico | $12.99 | $29.99 |
| UK & Europe | $18.99 | $39.99 |
| Australia & NZ | $22.99 | $44.99 |
| Rest of World | $24.99 | $49.99 |

Free international standard shipping on orders over **$150**.

## Duties & Taxes
Orders shipped outside the US may be subject to customs duties and taxes imposed by the destination country. These charges are the buyer's responsibility and are not included in our shipping fees.

## Tracking
All international orders include tracking. You'll receive a tracking number via email once your order ships. Please allow 1–2 business days for tracking to activate.

## Countries We Don't Ship To
We currently do not ship to Russia, Belarus, Iran, North Korea, Cuba, or Syria due to shipping restrictions.

## Questions?
For specific rate quotes or shipping to a country not listed above, please [contact us](https://example.com/contact).`,
    },
    impactData: ISSUE3_DATA,
  },
  {
    id: 'issue-4',
    title: 'Discount Code Stacking Rules Unclear',
    summary:
      "Customers are asking whether they can use multiple promo codes together. The bot gives inconsistent answers — sometimes saying yes, sometimes no — because there's no clear policy in the knowledge base.",
    category: 'Promotions & Discounts',
    productLine: 'Accessories',
    status: 'new',
    priorityScore: 54,
    scoreBreakdown: {
      frequency: 48,
      csatImpact: 55,
      deflectionImpact: 58,
      businessImpact: 62,
      fixEffort: 25,
      confidenceScore: 79,
    },
    detectedAt: 'Detected across last 14 days',
    conversationSamples: [
      {
        id: 'c8',
        customerMessage:
          'Can I use my welcome discount and the SUMMER20 code together?',
        agentResponse:
          'Yes, you should be able to apply multiple discount codes at checkout. Try entering them one at a time!',
        outcome: 'poor_rating',
      },
      {
        id: 'c9',
        customerMessage:
          "The site won't let me use two codes. Your chat said I could. What's going on?",
        agentResponse:
          "I apologize for the confusion. Our system only allows one discount code per order.",
        outcome: 'escalated',
      },
    ],
    suggestedFix: {
      type: 'knowledge_base',
      title: 'Discount Codes — Stacking & Eligibility Rules',
      description:
        'Add a clear article explaining that only one discount code can be used per order, what types of promotions stack automatically (like sale pricing), and how referral credits work.',
      currentGap:
        'There is no article clarifying code stacking rules. The bot is guessing and giving incorrect answers.',
      proposedArticle: `# Discount Codes & Promotions

## Can I use more than one discount code?
Only **one discount code** can be applied per order. If you have multiple codes, choose the one with the highest value.

## What stacks automatically?
Some promotions don't require a code and apply automatically:
- **Sale pricing** on individual items stacks with one discount code
- **Free shipping thresholds** (orders over $75) apply automatically alongside a discount code
- **Loyalty points** can be redeemed in addition to one discount code

## Referral Credits
Referral credits are stored in your account wallet and apply automatically at checkout — they count separately from discount codes.

## My code isn't working
Common reasons a code might not apply:
- The code has expired (check the email or promotion page for the end date)
- The items in your cart aren't eligible (some codes exclude sale items or specific brands)
- The minimum order value hasn't been met
- The code has already been used (most codes are single-use)

If your code should work but isn't, [contact us](https://example.com/contact) and we'll apply it manually.`,
    },
    impactData: ISSUE4_DATA,
  },
  {
    id: 'issue-5',
    title: 'Gift Wrapping & Gift Receipts Not Explained',
    summary:
      'During the holiday shopping period, a growing number of customers are asking about gift options. The bot has no information on this and is telling customers the option doesn\'t exist — when it does.',
    category: 'Order Options',
    productLine: 'Home & Living',
    status: 'new',
    priorityScore: 38,
    scoreBreakdown: {
      frequency: 32,
      csatImpact: 38,
      deflectionImpact: 40,
      businessImpact: 28,
      fixEffort: 15,
      confidenceScore: 83,
    },
    detectedAt: 'Detected across last 21 days',
    conversationSamples: [
      {
        id: 'c10',
        customerMessage: 'Do you offer gift wrapping? It\'s for my mom\'s birthday.',
        agentResponse:
          "I'm sorry, we don't currently offer gift wrapping services.",
        outcome: 'poor_rating',
      },
      {
        id: 'c11',
        customerMessage: 'Can I include a gift receipt so the recipient can return it?',
        agentResponse:
          "Unfortunately we don't have a gift receipt option at this time.",
        outcome: 'unresolved',
      },
    ],
    suggestedFix: {
      type: 'knowledge_base',
      title: 'Gift Options — Wrapping, Messages & Gift Receipts',
      description:
        'Add an article about gift wrapping ($4.99 add-on), gift messages (free), and gift receipts so the bot can accurately inform customers.',
      currentGap:
        'Gift options exist in checkout but are not documented in the knowledge base. The bot incorrectly tells customers these options are unavailable.',
      proposedArticle: `# Gift Options

We offer several options to make your purchase feel extra special.

## Gift Wrapping
Add gift wrapping to any order for **$4.99**. Available at checkout — select "Add gift wrapping" on the cart page. We use recycled kraft paper with a satin ribbon.

## Gift Message
Include a personal message with your order for **free**. There's a gift message field on the checkout page. Messages are printed on a card included with your order (not on the packing slip).

## Gift Receipt
To include a gift receipt, check the **"This is a gift"** box at checkout. The packing slip will show item descriptions but not prices, and we'll include a return code so the recipient can make a return or exchange without needing your order number.

## Digital Gift Cards
We also offer digital gift cards in amounts from $25 to $500. [Purchase a gift card](https://example.com/gift-cards). Gift cards are delivered instantly via email and never expire.

## Questions?
If you've already placed an order and want to add a gift note or gift receipt, [contact us](https://example.com/contact) within 1 hour of placing your order and we'll do our best to accommodate.`,
    },
    impactData: ISSUE5_DATA,
  },
];
