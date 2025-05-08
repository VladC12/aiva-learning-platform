import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Analytics document ID (fixed as there's only one document)
const ANALYTICS_ID = "681d0b962d6d5d114364efe1";

export async function POST(request: NextRequest) {
    try {
        const { role } = await request.json();
        
        // Validate role
        if (!role || (role !== 'teacher' && role !== 'student')) {
            return NextResponse.json(
                { error: 'Invalid role provided' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();
        
        // Determine which counter to increment
        const updateField = role === 'teacher' ? 'teacher_logins' : 'student_logins';
        
        // Update the counter in the Analytics collection
        const result = await db.collection('Analytics').updateOne(
            { _id: new ObjectId(ANALYTICS_ID) },
            { $inc: { [updateField]: 1 } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to update analytics' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update analytics:', error);
        return NextResponse.json(
            { error: 'Failed to update analytics' },
            { status: 500 }
        );
    }
}