import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function POST(request: Request) {
  const { email_address, password } = await request.json();

  if (!email_address || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userModel = new UserModel(db);

    // Find user by email
    const user = await userModel.findUserByEmail(email_address);

    if (!user) {
      console.log('User not found:', email_address);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Validate password
    const isValidPassword = await userModel.validatePassword(email_address, password);
    
    console.log('Password validation result:', isValidPassword);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = userModel.generateToken(user);

    return NextResponse.json(
      { token, user: { 
        username: user.username,
        email_address: user.email_address,
        first_name: user.first_name,
        last_name: user.last_name
      }},
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}