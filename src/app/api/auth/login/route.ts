// app/api/auth/login/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {

    // Get cookies store
    const cookieStore = await cookies();

    const body = await request.json();
    const { email, password } = body;
    
    // Call backend login service
    const result = await authService.login(email, password);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Login failed' },
        { status: 401 }
      );
    }
    
    const { user, access_token, refresh_token } = result.data;
    
    // Set HTTP-only cookies
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
    
    // Return user info
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || 'Login failed' },
      { status: error.response?.status || 401 }
    );
  }
}