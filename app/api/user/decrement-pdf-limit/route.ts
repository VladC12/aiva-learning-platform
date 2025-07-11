import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '@/lib/mongodb';
import jwt from 'jsonwebtoken';
import UserModel from '@/models/User';

export async function POST(request: NextRequest) {
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
    
    // Decode the token - since middleware already verified it
    // We just need to extract the userId
    const decoded = jwt.decode(token) as { userId?: string };
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Invalid token' }, 
        { status: 401 }
      );
    }
    
    // Connect to the database using the clientPromise
    const client = await clientPromise;
    const db = client.db();

    // Create a UserModel instance
    const userModel = new UserModel(db);

    // Use the model method to decrement PDF limit
    const success = await userModel.decrementPdfLimit(decoded.userId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update PDF limit or limit already reached' },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error decrementing PDF limit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}