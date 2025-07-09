import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function POST(req: Request) {
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Not authenticated' }, 
        { status: 401 }
      );
    }
    
    // Verify and decode the token
    const decoded = jwt.decode(token) as { userId?: string };
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid token' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { activityType, metadata = {} } = body;

    // Validate required fields
    if (!activityType || !['login', 'logout', 'session_ping'].includes(activityType)) {
      return NextResponse.json(
        { message: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Connect to the database
    const client = await clientPromise;
    const db = client.db();
    const userModel = new UserModel(db);
    
    // Only include essential metadata to reduce database size
    const essentialMetadata = {
      sessionDuration: metadata.sessionDuration,
      page: metadata.page,
      // Include timestamp on the server side for consistency
      timestamp: new Date()
    };
    
    // Track the user activity
    await userModel.trackActivity(decoded.userId, activityType, essentialMetadata);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking user activity:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}