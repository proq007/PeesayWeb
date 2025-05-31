// app/api/auth/signup/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Call backend signup service
    const result = await authService.signup(body);
    
    if (!result.success) {
      return NextResponse.json(
        { message: 'Signup failed' },
        { status: 400 }
      );
    }
    
    // For signup, we don't get tokens directly - need to login after signup
    const user = result.data.user;
    
    // Return user info
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Signup error:', error.response?.data || error.message);
    return NextResponse.json(
      { message: error.response?.data?.message || 'Signup failed' },
      { status: error.response?.status || 400 }
    );
  }
}