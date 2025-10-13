import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function POST(request: Request) {
  const { token, password } = await request.json();

  try {
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const userModel = new UserModel(db);

    // Find user by valid reset token
    const user = await userModel.findUserByResetToken(token);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Update user's password and clear reset token
    await userModel.updatePassword(user._id.toString(), password);

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}