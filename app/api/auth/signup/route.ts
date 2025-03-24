import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import UserModel from '@/models/User';

export async function POST(request: Request) {
  const { username, email_address, password, first_name, last_name, education_board } = await request.json();

  if (!username || !email_address || !password || !first_name || !last_name || !education_board) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userModel = new UserModel(db);

    // Check if user already exists
    const existingUser = await userModel.findUserByEmail(email_address);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    const newUser = await userModel.createUser({
      username,
      email_address,
      password,
      first_name,
      last_name,
      education_board
    });

    return NextResponse.json(
      { message: 'User created successfully', user: newUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}