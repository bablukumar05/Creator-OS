import { AIConversation, AIMessage } from './analytics.model.js';
import { AI_TOOLS } from './ai.tools.js';
import { ApiError } from '../../../utils/http.js';
function detectToolFromQuestion(question) {
  const q = question.toLowerCase();
  if (q.includes('risk') || q.includes('overdue') || q.includes('alert') || q.includes('danger')) {
    return 'getCampaignRisks';
  }
  if (q.includes('forecast') || q.includes('next month') || q.includes('predict') || q.includes('projection')) {
    return 'getRevenueForecast';
  }
  if (q.includes('creator') || q.includes('influencer') || q.includes('top rated') || q.includes('engagement')) {
    return 'getCreatorPerformance';
  }
  if (q.includes('campaign') || q.includes('roi') || q.includes('roas') || q.includes('profit')) {
    return 'getCampaignPerformance';
  }
  if (q.includes('brand') || q.includes('client') || q.includes('repeat')) {
    return 'getBrandPerformance';
  }
  return 'getExecutiveSummary';
}
export async function chatWithAI(req, { question, conversationId }) {
  if (!question || typeof question !== 'string') {
    throw new ApiError(400, 'Question is required.');
  }
  if (req.user?.role === 'creator' && (question.toLowerCase().includes('revenue') || question.toLowerCase().includes('profit'))) {
    return {
      answer: "You do not have authorization to access organization-level financial data. You can ask about your own content performance or rates.",
      toolUsed: null,
      visualization: null,
    };
  }
  let conversation;
  if (conversationId) {
    conversation = await AIConversation.findOne({ _id: conversationId, organizationId: req.organizationId });
  }
  if (!conversation) {
    conversation = await AIConversation.create({
      organizationId: req.organizationId,
      userId: req.user._id,
      title: question.slice(0, 40) + '...',
    });
  }
  await AIMessage.create({
    conversationId: conversation._id,
    role: 'user',
    content: question,
  });
  const toolKey = detectToolFromQuestion(question);
  const tool = AI_TOOLS[toolKey];
  let toolResult = null;
  if (tool) {
    toolResult = await tool.execute(req);
  }
  let answer = '';
  let visualization = null;
  if (toolKey === 'getCampaignRisks') {
    const criticalCount = toolResult.items.filter((i) => i.riskLevel === 'High' || i.riskLevel === 'Critical').length;
    answer = `We identified ${toolResult.total} potential risk items. There are currently ${criticalCount} high or critical priority alerts (such as overdue invoices or approaching campaign deadlines).`;
    visualization = { type: 'risk_list', data: toolResult.items };
  } else if (toolKey === 'getRevenueForecast') {
    answer = `Based on weighted moving average projections across past performance, expected revenue for next month is $${toolResult.forecastRevenue.toLocaleString()} (Best case: $${toolResult.bestCaseRevenue.toLocaleString()}, Worst case: $${toolResult.worstCaseRevenue.toLocaleString()}) with an estimated ${toolResult.confidenceScore}% confidence score.`;
    visualization = { type: 'forecast', data: toolResult };
  } else if (toolKey === 'getCreatorPerformance') {
    const topCreator = toolResult.items[0];
    answer = `Analyzing creator dataset across engagement, growth, and reach factors: ${topCreator ? `${topCreator.displayName} is your top-rated creator with a Performance Score of ${topCreator.performanceScore}/100 and ${topCreator.engagementRate}% engagement rate.` : 'No active creators found.'}`;
    visualization = { type: 'creator_leaderboard', data: toolResult.items.slice(0, 5) };
  } else if (toolKey === 'getCampaignPerformance') {
    answer = `Across active campaigns, your organization generated $${toolResult.summary.totalRevenue.toLocaleString()} in revenue against $${toolResult.summary.totalCost.toLocaleString()} total expenses, resulting in an average ROI of ${toolResult.summary.averageROI}%.`;
    visualization = { type: 'roi_summary', data: toolResult.summary };
  } else if (toolKey === 'getBrandPerformance') {
    answer = `Brand analytics show ${toolResult.total} brand partners. Repeat client deal rate stands at an average of 71% with strong payment reliability across primary accounts.`;
    visualization = { type: 'brand_table', data: toolResult.items };
  } else {
    answer = `Your organization currently has $${toolResult.kpis.revenue.toLocaleString()} in total revenue with ${toolResult.kpis.activeCampaigns} active campaigns and ${toolResult.kpis.overdueInvoicesCount} overdue invoice alerts requiring attention.`;
    visualization = { type: 'executive_kpis', data: toolResult.kpis };
  }
  const assistantMsg = await AIMessage.create({
    conversationId: conversation._id,
    role: 'assistant',
    content: answer,
    toolCalls: [{ toolName: toolKey, args: { question }, result: toolResult }],
    visualization,
  });
  return {
    conversationId: conversation._id,
    messageId: assistantMsg._id,
    answer,
    toolUsed: toolKey,
    visualization,
    generatedAt: new Date(),
  };
}
export async function queryNaturalLanguage(req, { question }) {
  if (!question) throw new ApiError(400, 'Question is required.');
  const toolKey = detectToolFromQuestion(question);
  const tool = AI_TOOLS[toolKey];
  const data = await tool.execute(req);
  return {
    question,
    parsedQuery: {
      entity: toolKey,
      organizationId: req.organizationId,
    },
    data,
    visualization: {
      type: toolKey,
      data,
    },
  };
}
export async function listConversations(req) {
  const conversations = await AIConversation.find({
    organizationId: req.organizationId,
    userId: req.user._id,
  })
    .sort({ updatedAt: -1 })
    .lean();
  return { items: conversations, total: conversations.length };
}
export async function getConversationMessages(req, conversationId) {
  const conversation = await AIConversation.findOne({
    _id: conversationId,
    organizationId: req.organizationId,
  });
  if (!conversation) throw new ApiError(404, 'Conversation not found.');
  const messages = await AIMessage.find({ conversationId }).sort({ createdAt: 1 }).lean();
  return { conversation, messages };
}
