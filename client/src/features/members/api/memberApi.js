import { api } from '../../../services/api';
export const memberApi = {
  list: async () => (await api.get('/members')).data.data,
  invite: async (payload) => (await api.post('/members/invite', payload)).data.data,
  acceptInvite: async (token) =>
    (await api.post('/members/accept-invite', { token })).data.data,
  update: async (memberId, payload) =>
    (await api.patch(`/members/${memberId}`, payload)).data.data,
  remove: async (memberId) => (await api.delete(`/members/${memberId}`)).data.data,
  listRoles: async () => (await api.get('/roles')).data.data,
};
