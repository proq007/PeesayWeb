// app/api/auth/user/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    // Get cookies store
    const cookieStore = await cookies();

    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(null);
    }
    
    // Decode the JWT to get the user ID (without verification - just for user info)
    // Note: This doesn't need a backend call since user data is embedded in the token
    const decoded = jwt.decode(token);
    
    if (!decoded || typeof decoded !== 'object') {
      cookieStore.delete('token');
      cookieStore.delete('refreshToken');
      return NextResponse.json(null);
    }
    
    // Return user ID from token - frontend will need to handle this with user details
    return NextResponse.json({ id: decoded.id });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(null);
  }
}