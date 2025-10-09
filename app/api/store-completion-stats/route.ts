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

        // Connect to the database
        const client = await clientPromise;
        const db = client.db();
        const userModel = new UserModel(db);

        // Update the user's completion stats with detailed information
        await userModel.trackQuestionSetCompletion(
            decoded.userId, 
            body.questionSetId,
            {
                sessionStartTime: body.sessionStartTime,
                sessionDuration: body.sessionDuration,
                questionSetLabel: body.questionSetLabel,
                totalQuestions: body.totalQuestions,
                totalAnswered: body.totalAnswered,
                results: body.results,
                successRate: body.successRate
            }
        );

        return NextResponse.json(
            { message: 'Question set completion statistics saved successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error tracking question status:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}