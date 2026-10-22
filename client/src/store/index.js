import { create } from 'zustand';
import { api } from '../services/api';
import { organizationApi } from '../services/api';
import { getStoredToken, removeStoredToken } from '../utils/token';
let initialization;
export const useUI = create((set) => ({
  theme: localStorage.getItem('creatoros-theme') || 'light',
  currency: 'INR',
  setCurrency: (currency) => set({ currency }),
  toggleTheme: () =>
    set((state) => {
      // persist user theme preference across browser sessions
      const theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('creatoros-theme', theme);
      return { theme };
    }),
}));
export const useOrganization = create((set, get) => ({
  organizations: [],
  currentOrganization: null,
  membership: null,
  permissions: [],
  loading: false,
  loadOrganizations: async () => {
    const token = getStoredToken();
    if (!token && !useAuth.getState().user) {
      set({ loading: false });
      return null;
    }
    set({ loading: true });
    try {
      const [listData, currentData] = await Promise.all([
        organizationApi.list(),
        organizationApi.current(),
      ]);
      const currentOrg = currentData?.organization || null;
      const membership = currentData?.membership || currentOrg?.membership || null;
      if (currentOrg?.settings?.currency) {
        useUI.getState().setCurrency(currentOrg.settings.currency);
      }
      set({
        organizations: listData?.items || [],
        currentOrganization: currentOrg,
        membership,
        permissions: membership?.effectivePermissions || membership?.permissions || [],
      });
      return currentOrg;
    } catch {
      return null;
    } finally {
      set({ loading: false });
    }
  },
  switchWorkspace: async (organizationId) => {
    const data = await organizationApi.switchWorkspace(organizationId);
    const currentOrg = data?.organization || null;
    const membership = data?.membership || currentOrg?.membership || null;
    if (currentOrg?.settings?.currency) {
      useUI.getState().setCurrency(currentOrg.settings.currency);
    }
    set((state) => ({
      currentOrganization: currentOrg,
      membership,
      permissions: membership?.effectivePermissions || membership?.permissions || [],
      organizations: state.organizations.map((org) => ({
        ...org,
        current: String(org._id) === String(organizationId),
      })),
    }));
    return data;
  },
  createWorkspace: async (payload) => {
    const created = await organizationApi.create(payload);
    await get().loadOrganizations();
    return created;
  },
  updateWorkspace: async (payload) => {
    const updated = await organizationApi.updateCurrent(payload);
    if (updated?.settings?.currency) {
      useUI.getState().setCurrency(updated.settings.currency);
    }
    set((state) => ({
      currentOrganization: updated,
      organizations: state.organizations.map((org) =>
        String(org._id) === String(updated._id) ? { ...org, ...updated, current: true } : org,
      ),
    }));
    return updated;
  },
  hasPermission: (permission) => {
    const { membership, permissions } = get();
    if (!membership || membership.status !== 'active') return false;
    if (membership.role === 'owner') return true;
    return permissions.includes(permission);
  },
  reset: () =>
    set({
      organizations: [],
      currentOrganization: null,
      membership: null,
      permissions: [],
      loading: false,
    }),
}));
export const useAuth = create((set) => ({
  user: null,
  loading: !!(typeof localStorage !== 'undefined' && getStoredToken()),
  config: {},
  init: () =>
    (initialization ||= (async () => {
      // Non-blocking fetch of auth configuration for login/social auth
      api.get('/auth/config')
        .then((res) => {
          if (res?.data?.data) {
            set({ config: res.data.data });
          }
        })
        .catch(() => {});

      const token = getStoredToken();
      if (!token) {
        set({ user: null, loading: false });
        return;
      }
      try {
        const user = (await api.get('/auth/me')).data.data;
        set({ user, loading: false });
        if (user) {
          await useOrganization.getState().loadOrganizations();
        }
      } catch {
        removeStoredToken();
        useOrganization.getState().reset();
        set({ user: null, loading: false });
      }
    })()),
  setUser: (user) => {
    set({ user, loading: false });
    if (user) {
      useOrganization.getState().loadOrganizations();
    } else {
      removeStoredToken();
      useOrganization.getState().reset();
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    removeStoredToken();
    useOrganization.getState().reset();
    set({ user: null, loading: false });
  },
}));
