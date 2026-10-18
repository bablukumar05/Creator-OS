import { api } from './api';
export const marketplaceApi = {
  discoverCreators: async (params) => {
    const res = await api.get('/marketplace/creators', { params });
    return res.data;
  },
  matchCreators: async (campaignId) => {
    const res = await api.get(`/marketplace/campaigns/${campaignId}/match`);
    return res.data;
  },
  createInvitation: async (data) => {
    const res = await api.post('/marketplace/invitations', data);
    return res.data;
  },
  listInvitations: async (params) => {
    const res = await api.get('/marketplace/invitations', { params });
    return res.data;
  },
  createOffer: async (data) => {
    const res = await api.post('/marketplace/offers', data);
    return res.data;
  },
  acceptOffer: async (offerId) => {
    const res = await api.post(`/marketplace/offers/${offerId}/accept`);
    return res.data;
  },
  createReview: async (data) => {
    const res = await api.post('/marketplace/reviews', data);
    return res.data;
  },
  listTalent: async (params) => {
    const res = await api.get('/talent', { params });
    return res.data;
  },
  addTalent: async (data) => {
    const res = await api.post('/talent', data);
    return res.data;
  },
  updateTalent: async (id, data) => {
    const res = await api.patch(`/talent/${id}`, data);
    return res.data;
  },
  removeTalent: async (id) => {
    const res = await api.delete(`/talent/${id}`);
    return res.data;
  },
  getProfile: async (id) => {
    const res = await api.get(`/creators/${id}`);
    return res.data;
  },
  createProfile: async (data) => {
    const res = await api.post('/creators', data);
    return res.data;
  },
};
