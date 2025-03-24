import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';
import { generatePasswordResetToken } from '@/lib/tokens';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(request: Request) {
  const { email } = await request.json();

  try {
    const client = await clientPromise;
    const db = client.db();
    const userModel = new UserModel(db);

    const user = await userModel.findUserByEmail(email);
    
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return NextResponse.json(
        { message: 'If an account exists with this email, you will receive a password reset link' },
        { status: 200 }
      );
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // Update user with reset token
    await userModel.updateUser(user._id.toString(), {
      password_reset_token: resetToken,
      password_reset_expiry: resetTokenExpiry
    });

    // Send password reset email
    await sendPasswordResetEmail(user.email_address, resetToken);

    return NextResponse.json(
      { message: 'Password reset email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to process password recovery request' },
      { status: 500 }
    );
  }
}