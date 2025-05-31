// app/api/auth/logout/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function DELETE(request: Request) {
  try {
    // Get cookies store
    const cookieStore = await cookies();

    // Get token from cookies
    const token = cookieStore.get('token')?.value;
    
    if (token) {
      // Call backend logout endpoint
      await authService.logout(token);
    }
    
    // Clear cookies regardless of backend response
    cookieStore.delete('token');
    cookieStore.delete('refreshToken');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there was an error
    cookieStore.delete('token');
    cookieStore.delete('refreshToken');
    
    return NextResponse.json({ success: true });
  }
}