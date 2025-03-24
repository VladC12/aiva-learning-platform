import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question } from '@/models/Question';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const questions = await db.collection('Questions')
      .find({})
      .limit(5)  // Add limit of 5 documents
      .toArray();

    return NextResponse.json(questions as Question[]);
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}