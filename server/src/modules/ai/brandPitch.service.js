import { LLMGateway } from './llm.gateway.js';

export async function generateBrandPitch({
  brandName,
  contactPerson = 'Marketing Team',
  creatorNiche = 'Tech & Creative Tools',
  audienceSize = '150,000+',
  deliverables = '1 Dedicated YouTube Video + 2 Instagram Reels',
  proposedBudget = '$2,500 / ₹75,000',
  keyAngle = 'Authentic creator case study showcasing practical daily integration',
}) {
  const brand = brandName?.trim() || 'Partner Brand';

  const systemPrompt = `You are a high-level talent manager and brand sponsorship agent representing premier content creators.
Generate a structured JSON response with a high-converting brand collaboration proposal, follow-up sequence, and objection handling tactics.
Format JSON:
{
  "emailSubjectLines": ["...", "...", "..."],
  "coldEmailPitch": "...",
  "followUpEmail": "...",
  "rateCardBreakdown": [
    { "item": "...", "rate": "...", "deliverableDetails": "..." }
  ],
  "objectionHandlers": [
    { "objection": "...", "counterStrategy": "...", "suggestedReply": "..." }
  ]
}`;

  const userPrompt = `Brand: ${brand}
Contact: ${contactPerson}
Niche: ${creatorNiche}
Audience: ${audienceSize}
Deliverables: ${deliverables}
Proposed Budget: ${proposedBudget}
Angle: ${keyAngle}`;

  const liveResult = await LLMGateway.complete({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    jsonMode: true,
  });

  if (liveResult && Array.isArray(liveResult.emailSubjectLines) && liveResult.coldEmailPitch) {
    return liveResult;
  }

  const emailSubjectLines = [
    `Collaboration idea: ${brand} × High-Intent ${creatorNiche} Audience`,
    `Quick proposal for ${brand}: ${keyAngle.slice(0, 45)}...`,
    `${brand} partnership opportunity — ${audienceSize} engaged community`,
  ];

  const coldEmailPitch = `Hi ${contactPerson},

I've been closely following ${brand}’s latest releases and love how you're approaching products in the ${creatorNiche.toLowerCase()} space.

I run a dedicated channel with an active audience of ${audienceSize} creators and tech enthusiasts who look to our reviews before making purchasing decisions. Over our last 5 brand integrations, we’ve averaged a 10.4% engagement rate with over 450,000 organic views.

I put together a creative collaboration concept specifically for ${brand}:
"${keyAngle}"

Proposed Deliverable Package:
• ${deliverables}
• Native tracking link and pinned comment with promo code
• Full organic post distribution across our primary channels

Investment: ${proposedBudget}

Would you be open to a quick 10-minute chat this Thursday to review our media kit and campaign outline?

Best regards,
Creator Partnerships Team`;

  const followUpEmail = `Hi ${contactPerson},

Following up briefly on my note regarding a potential collaboration between ${brand} and our audience.

We are locking in our production schedule for the upcoming month and have reserved one featured slot for a premier partner in your category. 

If this aligns with your Q1/Q2 marketing goals, happy to send over our one-page rate sheet and sample deliverables.

Warmly,
Creator Partnerships Team`;

  const rateCardBreakdown = [
    {
      item: 'Dedicated Long-Form Feature (8-12 Mins)',
      rate: proposedBudget,
      deliverableDetails: 'Full-length story arc, in-depth product review, custom B-roll, and evergreen YouTube SEO placement.',
    },
    {
      item: 'Short-Form Viral Integration (Reel / Short)',
      rate: 'Included in bundle',
      deliverableDetails: 'High-pacing pattern interrupt, hook-first storytelling, and swipe-up / bio link drive.',
    },
    {
      item: '30-Day Organic Usage Rights',
      rate: 'Complimentary',
      deliverableDetails: 'Brand reposting rights to organic social channels with creator tag.',
    },
  ];

  const objectionHandlers = [
    {
      objection: '“We do not have the budget for your quoted rate right now.”',
      counterStrategy: 'Reduce deliverable scope rather than dropping rate, protecting pricing integrity while keeping the door open.',
      suggestedReply: `Totally understand budget constraints. If ${proposedBudget} is beyond current bandwidth, we could streamline the package to a focused 60-second integrated shoutout instead of a dedicated video at a reduced tier. That way ${brand} still gets featured in front of our core audience.`,
    },
    {
      objection: '“Can we send you free product in exchange for an honest review?”',
      counterStrategy: 'Validate the product interest while clearly establishing separation between personal gifting and commercial sponsored production.',
      suggestedReply: `We'd love to test out the product! We accept gifts for editorial consideration, but guaranteed coverage, script approvals, and dedicated production timelines are reserved for paid sponsorship partners to maintain full production standards.`,
    },
    {
      objection: '“We need full in-perpetuity paid advertising whitelisting included.”',
      counterStrategy: 'Unbundle paid advertising rights from base production fees, charging a time-limited licensing fee.',
      suggestedReply: `Our quoted rate includes standard organic usage. For paid digital ad amplification (whitelisting/Meta dark posting), we license creator ad rights at 30% of base fee per 30-day window, ensuring tracking and creator brand safety.`,
    },
  ];

  return {
    emailSubjectLines,
    coldEmailPitch,
    followUpEmail,
    rateCardBreakdown,
    objectionHandlers,
  };
}
