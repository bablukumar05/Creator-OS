import { api } from '../../../services/api';
export const organizationApi = {
  list: async () => (await api.get('/organizations')).data.data,
  current: async () => (await api.get('/organizations/current')).data.data,
  create: async (payload) => (await api.post('/organizations', payload)).data.data,
  switchWorkspace: async (organizationId) =>
    (await api.post(`/organizations/${organizationId}/switch`)).data.data,
  updateCurrent: async (payload) =>
    (await api.patch('/organizations/current', payload)).data.data,
};
