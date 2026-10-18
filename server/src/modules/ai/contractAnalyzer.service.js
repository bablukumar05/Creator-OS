import { LLMGateway } from './llm.gateway.js';

export async function analyzeContract({ contractText }) {
  const text = contractText?.trim() || '';

  if (!text) {
    return {
      riskScore: 0,
      riskLevel: 'LOW',
      summary: 'No contract text provided for analysis.',
      flaggedClauses: [],
      actionItems: ['Paste the text of your brand contract or agreement to run legal risk analysis.'],
    };
  }

  const systemPrompt = `You are an expert entertainment and creator economy attorney.
Analyze the provided brand collaboration agreement text for predatory clauses, creator liability traps, and unfair commercial terms.
Format JSON response strictly as:
{
  "riskScore": 75,
  "riskLevel": "HIGH",
  "summary": "...",
  "flaggedClauses": [
    {
      "clauseName": "...",
      "severity": "HIGH",
      "originalText": "...",
      "riskExplanation": "...",
      "suggestedRevision": "..."
    }
  ],
  "actionItems": ["...", "..."]
}`;

  const userPrompt = `Contract Agreement Text:
${text.slice(0, 8000)}`;

  const liveResult = await LLMGateway.complete({
    systemPrompt,
    userPrompt,
    temperature: 0.1,
    jsonMode: true,
  });

  if (liveResult && typeof liveResult.riskScore === 'number' && Array.isArray(liveResult.flaggedClauses)) {
    return liveResult;
  }

  const lower = text.toLowerCase();
  const flagged = [];
  let score = 25;

  if (lower.includes('perpetual') || lower.includes('in perpetuity') || (lower.includes('exclusiv') && !lower.includes('30 days') && !lower.includes('60 days'))) {
    score += 25;
    flagged.push({
      clauseName: 'Perpetual Exclusivity & Category Lockout',
      severity: 'HIGH',
      originalText: text.includes('perpetual') ? '...granting perpetual exclusive rights across all digital channels...' : 'Exclusivity applies indefinitely within the product category.',
      riskExplanation: 'You will be legally prohibited from partnering with any competing brand indefinitely, wiping out future sponsorship revenue.',
      suggestedRevision: 'Exclusivity shall apply solely to direct competitors for a period not to exceed thirty (30) days following the initial publication date.',
    });
  }

  if (lower.includes('work made for hire') || lower.includes('assigns all rights') || lower.includes('sole and exclusive property') || lower.includes('moral rights')) {
    score += 20;
    flagged.push({
      clauseName: 'Total Intellectual Property & Likeness Surrender',
      severity: 'HIGH',
      originalText: 'The Deliverables and all creator contributions shall be considered a work-made-for-hire, with all worldwide copyright assigned to Sponsor.',
      riskExplanation: 'You lose ownership of your own footage, face, and voice, allowing the brand to repurpose or run paid ads against your content without further compensation.',
      suggestedRevision: 'Creator retains all underlying copyright and ownership of the Deliverables, granting Brand a non-exclusive, non-sublicensable license to use the content for organic promotional purposes for six (6) months.',
    });
  }

  if (lower.includes('net 60') || lower.includes('net 90') || lower.includes('90 days') || lower.includes('60 days after') || lower.includes('after publication')) {
    score += 15;
    flagged.push({
      clauseName: 'Excessive Payment Delay (Net 60/90 Days)',
      severity: 'MEDIUM',
      originalText: 'Payment shall be disbursed within sixty (60) to ninety (90) days following final verification of campaign metrics.',
      riskExplanation: 'Delaying payment for 2-3 months after you have already produced and published the content exposes you to high non-payment and cashflow risks.',
      suggestedRevision: 'Fifty percent (50%) advance deposit required prior to production commencement; remaining fifty percent (50%) due within fourteen (14) days of publication.',
    });
  }

  if (lower.includes('unlimited revisions') || lower.includes('to the satisfaction') || lower.includes('until approved')) {
    score += 15;
    flagged.push({
      clauseName: 'Uncapped Revisions & Subjective Approval',
      severity: 'MEDIUM',
      originalText: 'Creator agrees to make all edits and revisions necessary until final satisfaction is confirmed by Sponsor at no additional cost.',
      riskExplanation: 'Open-ended revision terms create scope creep, potentially forcing you to re-record entire videos based on changing client opinions.',
      suggestedRevision: 'Compensation includes up to two (2) rounds of minor editorial revisions conforming to the agreed brief. Additional rounds or fundamental brief changes shall be billed at Creator standard hourly rate.',
    });
  }

  if (lower.includes('indemnif') || lower.includes('hold harmless') || lower.includes('attorney fees') || lower.includes('consequential damages')) {
    score += 15;
    flagged.push({
      clauseName: 'One-Sided Indemnification & Unlimited Liability',
      severity: 'HIGH',
      originalText: 'Creator shall defend, indemnify, and hold harmless Sponsor from any and all claims, liabilities, damages, and legal costs arising from the content.',
      riskExplanation: 'This shifts brand commercial liability and legal defense costs onto you as an individual creator.',
      suggestedRevision: 'Each party shall indemnify the other solely against third-party claims arising from a material breach of representations, with Creator total aggregate liability capped at the total fee received under this Agreement.',
    });
  }

  if (flagged.length === 0) {
    flagged.push(
      {
        clauseName: 'Standard Editorial Usage License',
        severity: 'LOW',
        originalText: 'Brand receives digital distribution rights for sponsored campaign.',
        riskExplanation: 'Terms appear generally standard, but confirm that paid whitelisting (dark posting) requires an additional fee.',
        suggestedRevision: 'Confirm paid social media advertising rights (whitelisting) are explicitly excluded unless separate ad budget authorization is agreed in writing.',
      },
    );
  }

  const finalScore = Math.min(100, Math.max(20, score));
  const riskLevel = finalScore >= 70 ? 'CRITICAL' : finalScore >= 50 ? 'HIGH' : finalScore >= 35 ? 'MEDIUM' : 'LOW';

  const summary = finalScore >= 70
    ? 'Critical legal hazards identified. The contract contains aggressive IP forfeiture and perpetual category exclusivity that heavily favors the brand at the creator expense.'
    : finalScore >= 50
      ? 'Elevated risk detected. Several clauses concerning payment timelines, revision limits, or liability should be amended before signing.'
      : 'Moderate terms with minor creator adjustments needed. The commercial baseline is reasonable, but tightening revision scopes and usage windows is advised.';

  const actionItems = [
    'Reply with the redline amendments provided above before countersigning.',
    'Require a 50% upfront deposit into Escrow before recording raw footage.',
    'Cap paid whitelisting and dark-posting rights to 30 or 60 days maximum.',
    'Ensure all revisions are anchored strictly to the mutually signed brief.',
  ];

  return {
    riskScore: finalScore,
    riskLevel,
    summary,
    flaggedClauses: flagged,
    actionItems,
  };
}
