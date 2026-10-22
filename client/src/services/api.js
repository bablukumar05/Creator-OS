import axios from 'axios';
export const api = axios.create({
  baseURL: (() => {
    let raw = import.meta.env.VITE_API_URL || '/api/v1';
    if (raw.startsWith('http')) {
      const clean = raw.replace(/\/+$/, '');
      return (!clean.endsWith('/api') && !clean.endsWith('/api/v1')) ? clean + '/api' : clean;
    }
    return raw;
  })(),
  withCredentials: true,
  timeout: 20000,
});
let refreshing;
const protectedAuthRoutes = new Set([
  '/auth/logout',
  '/auth/sessions',
  '/auth/account',
  '/auth/change-password',
]);
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // handle silent session token refresh on 401 response and replay original request
    const request = error.config;
    const canRefresh =
      request &&
      !request._retriedAfterRefresh &&
      request.url !== '/auth/refresh' &&
      (!request.url?.startsWith('/auth/') || protectedAuthRoutes.has(request.url));
    if (error.response?.status !== 401 || !canRefresh) return Promise.reject(error);
    request._retriedAfterRefresh = true;
    try {
      refreshing ||= api.post('/auth/refresh').finally(() => {
        refreshing = undefined;
      });
      await refreshing;
      return api(request);
    } catch (refreshError) {
      window.dispatchEvent(new Event('session-expired'));
      return Promise.reject(refreshError);
    }
  },
);
export const message = (error) =>
  error.response?.data?.message || 'Could not connect. Check your connection and try again.';
export const service = {
  list: async (resource, params) => (await api.get('/' + resource, { params })).data.data,
  get: async (resource, id) => (await api.get(`/${resource}/${id}`)).data.data,
  create: async (resource, data) => (await api.post('/' + resource, data)).data.data,
  update: async (resource, id, data) => (await api.patch(`/${resource}/${id}`, data)).data.data,
  remove: async (resource, id) => api.delete(`/${resource}/${id}`),
  restore: async (resource, id) => api.post(`/${resource}/${id}/restore`),
  duplicate: async (resource, id) => api.post(`/${resource}/${id}/duplicate`),
  dashboard: async (days = 30) => (await api.get('/dashboard', { params: { days } })).data.data,
  search: async (q) => (await api.get('/search', { params: { q } })).data.data,
};
export async function downloadInvoice(id) {
  const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CreatorOS-invoice.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const socialApi = {
  list: async () => (await api.get('/social')).data.data,
  get: async (id) => (await api.get(`/social/${id}`)).data.data,
  getStats: async () => (await api.get('/social/stats')).data.data,
  connect: async (data) => (await api.post('/social/connect', data)).data.data,
  sync: async (id) => (await api.post(`/social/${id}/sync`)).data.data,
  syncAll: async () => (await api.post('/social/sync-all')).data.data,
  disconnect: async (id) => (await api.delete(`/social/${id}`)).data.data,
  publish: async (data) => (await api.post('/social/publish', data)).data.data,
};
export const genaiApi = {
  generateScript: async (data) => (await api.post('/ai/script', data)).data.data,
  analyzeContract: async (data) => (await api.post('/ai/contract-analysis', data)).data.data,
  generatePitch: async (data) => (await api.post('/ai/pitch', data)).data.data,
  saveScript: async (data) => (await api.post('/ai/save-script', data)).data.data,
};
export const contractApi = {
  getPublic: async (token) => (await api.get(`/contracts/public/sign/${token}`)).data.data,
  signPublic: async (token, data) => (await api.post(`/contracts/public/sign/${token}`, data)).data.data,
  signInApp: async (id, data) => (await api.post(`/contracts/${id}/sign`, data)).data.data,
  getAuditCert: async (id) => (await api.get(`/contracts/${id}/audit-certificate`)).data.data,
};
export const reviewApi = {
  list: async (params) => (await api.get('/reviews', { params })).data.data,
  create: async (data) => (await api.post('/reviews', data)).data.data,
  toggleResolve: async (id) => (await api.patch(`/reviews/${id}/resolve`)).data.data,
  remove: async (id) => (await api.delete(`/reviews/${id}`)).data.data,
};
export const creatorApi = {
  getPublic: async (username) => (await api.get(`/creators/public/${username}`)).data.data,
  submitInquiry: async (username, data) => (await api.post(`/creators/public/${username}/inquire`, data)).data.data,
  getMyProfile: async () => (await api.get('/creators/profile')).data.data,
  updateMyProfile: async (data) => (await api.patch('/creators/profile', data)).data.data,
  updateRates: async (data) => (await api.post('/creators/rate-card', data)).data.data,
  updateSocial: async (data) => (await api.post('/creators/socials', data)).data.data,
};
export const assetApi = {
  list: async (params) => (await api.get('/assets', { params })).data.data,
  get: async (id) => (await api.get(`/assets/${id}`)).data.data,
  presign: async (data) => (await api.post('/assets/presign', data)).data.data,
  confirm: async (data) => (await api.post('/assets/confirm', data)).data.data,
  getQueueStatus: async () => (await api.get('/assets/queue/status')).data.data,
  uploadDirect: (file, meta = {}, onProgress) =>
    new Promise((resolve, reject) => {
      assetApi
        .presign({
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          assetType: meta.assetType || (file.type?.startsWith('video/') ? 'Raw Video' : 'Image'),
          contentId: meta.contentId,
          campaignId: meta.campaignId,
        })
        .then((presignData) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', presignData.uploadUrl, true);
          if (presignData.headers) {
            Object.entries(presignData.headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
          }
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress({ percent, loaded: e.loaded, total: e.total });
            }
          };
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const confirmed = await assetApi.confirm({
                  fileName: file.name,
                  fileKey: presignData.fileKey,
                  fileUrl: presignData.publicUrl,
                  fileSize: file.size,
                  mimeType: file.type || 'application/octet-stream',
                  provider: presignData.provider || 's3',
                  contentId: meta.contentId,
                  campaignId: meta.campaignId,
                });
                resolve(confirmed);
              } catch (confirmErr) {
                reject(confirmErr);
              }
            } else {
              reject(new Error(`Direct storage upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error during direct storage upload'));
          xhr.send(file);
        })
        .catch(reject);
    }),
};
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

export const organizationApi = {
  list: async () => (await api.get('/organizations')).data.data,
  current: async () => (await api.get('/organizations/current')).data.data,
  create: async (payload) => (await api.post('/organizations', payload)).data.data,
  switchWorkspace: async (organizationId) =>
    (await api.post(`/organizations/${organizationId}/switch`)).data.data,
  updateCurrent: async (payload) =>
    (await api.patch('/organizations/current', payload)).data.data,
};
