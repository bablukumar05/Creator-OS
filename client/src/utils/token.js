/**
 * Client-side JWT Token utility.
 * Synchronously checks expiration & cleans up stale tokens to avoid 401 console errors.
 */

export function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    const payload = JSON.parse(json);
    // Buffer by 5 seconds to avoid race conditions with network transit
    if (payload.exp && payload.exp * 1000 <= Date.now() + 5000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getStoredToken() {
  if (typeof localStorage === 'undefined') return null;
  const token = localStorage.getItem('creatoros_token');
  if (!token) return null;
  if (!isTokenValid(token)) {
    localStorage.removeItem('creatoros_token');
    return null;
  }
  return token;
}

export function removeStoredToken() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('creatoros_token');
  }
}

export function setStoredToken(token) {
  if (typeof localStorage !== 'undefined' && token) {
    localStorage.setItem('creatoros_token', token);
  }
}
