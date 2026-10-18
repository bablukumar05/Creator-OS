import { api } from './api';
export const analyticsApi = {
  getExecutive: async () => {
    const res = await api.get('/analytics/executive');
    return res.data;
  },
  getRevenue: async () => {
    const res = await api.get('/analytics/revenue');
    return res.data;
  },
  getCampaigns: async () => {
    const res = await api.get('/analytics/campaigns');
    return res.data;
  },
  getCreators: async () => {
    const res = await api.get('/analytics/creators');
    return res.data;
  },
  getBrands: async () => {
    const res = await api.get('/analytics/brands');
    return res.data;
  },
  getRisks: async () => {
    const res = await api.get('/analytics/risks');
    return res.data;
  },
  getForecast: async () => {
    const res = await api.get('/analytics/forecast');
    return res.data;
  },
  markInsightRead: async (id) => {
    const res = await api.patch(`/analytics/insights/${id}/read`);
    return res.data;
  },
  chatWithAI: async (question, conversationId) => {
    const res = await api.post('/ai/chat', { question, conversationId });
    return res.data;
  },
  queryNaturalLanguage: async (question) => {
    const res = await api.post('/ai/analytics/query', { question });
    return res.data;
  },
  listConversations: async () => {
    const res = await api.get('/ai/conversations');
    return res.data;
  },
};
