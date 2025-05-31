// lib/auth-service.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
const api = axios.create({ baseURL: API_URL });

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data; // Returns { success: true, data: { user, access_token, refresh_token, session_id } }
  },
  
  async signup(userData: any) {
    const response = await api.post('/auth/signup', userData);
    return response.data; // Returns { success: true, data: { user } }
  },
  
    async logout(token: string) {
    try {
        const response = await api.delete('/auth/logout', {
        headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Backend logout response:', response.data);

        return response.data;
    } catch (error) {
        // Log the error but don't throw it further
        console.warn('Backend logout failed, continuing with client logout');
        return { success: true };
    }
    },
  
  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
    return response.data; // Returns { success: true, data: { access_token, refresh_token } }
  }
};