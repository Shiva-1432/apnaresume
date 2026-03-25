type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  credits?: number;
};

export function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
    if (!payload.exp) {
      return true;
    }
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function clearStoredSession() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

export function getStoredSession() {
  const token = localStorage.getItem('auth_token');
  const userRaw = localStorage.getItem('user');

  if (!token || isTokenExpired(token)) {
    if (token) {
      clearStoredSession();
    }
    return { token: null, user: null as SessionUser | null };
  }

  if (!userRaw) {
    return { token, user: null as SessionUser | null };
  }

  try {
    return { token, user: JSON.parse(userRaw) as SessionUser };
  } catch {
    clearStoredSession();
    return { token: null, user: null as SessionUser | null };
  }
}
