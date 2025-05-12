import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function GET() {
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
    
    // Use the findUserById method to get the user
    let user;
    try {
      user = await userModel.findUserById(decoded.userId);
    } catch (fetchError) {
      console.error('Error finding user:', fetchError);
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Remove password from response using destructuring and renaming
    // Fix: Rename 'password' to '_password' to indicate it's intentionally unused
    const { password: _password, ...userWithoutPassword } = user;
    
    // Return the user data
    return NextResponse.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    return NextResponse.json(
      { message: 'Internal server error' }, 
      { status: 500 }
    );
  }
}