// app/api/auth/refresh/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST() {
  try {
    // Get cookies store
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }
    
    const result = await authService.refreshToken(refreshToken);
    
    if (!result.success) {
      cookieStore.delete('token');
      cookieStore.delete('refreshToken');
      return NextResponse.json({ message: 'Token refresh failed' }, { status: 401 });
    }
    
    const { access_token, refresh_token } = result.data;
    
    // Update cookies with new tokens
    cookieStore.set({
      name: 'token',
      value: access_token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });
    
    cookieStore.set({
      name: 'refreshToken',
      value: refresh_token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Refresh token error:', error.response?.data || error.message);
    
    // Clear cookies on refresh failure
    cookieStore.delete('token');
    cookieStore.delete('refreshToken');
    
    return NextResponse.json(
      { message: 'Token refresh failed' },
      { status: 401 }
    );
  }
}