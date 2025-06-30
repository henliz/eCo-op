const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const isTokenValid = (token: string): boolean => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp > (now + 300); // 5 minute buffer
  } catch (error) {
    return false;
  }
};

export const refreshFirebaseToken = async (): Promise<string | null> => {
  try {
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    
    if (user) {
      const newToken = await user.getIdToken(true);
      return isTokenValid(newToken) ? newToken : null;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
};

export const makeAuthenticatedRequest = async (
  endpoint: string, 
  method = 'GET', 
  body?: any, 
  token?: string
) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    mode: 'cors',
    credentials: 'include'
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }
  
  return data;
};