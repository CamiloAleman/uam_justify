// frontend/src/utils/auth.js
import axios from '../api/axios';

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  delete axios.defaults.headers.common['Authorization'];
}

/**
 * Logout con revocación (opcional): intenta blacklistear el refresh token
 * si el backend expone /api/token/blacklist/ (simplejwt with blacklist app).
 */
export async function logoutAndRevoke() {
  const refresh = localStorage.getItem('refresh_token');
  try {
    if (refresh) {
      await axios.post('/token/blacklist/', { refresh });
    }
  } catch (e) {
    // ignore errors: revocar es "nice-to-have", no crítico para UX
    console.warn('No se pudo revocar refresh token', e?.response?.data || e);
  } finally {
    clearAuth();
  }
}
