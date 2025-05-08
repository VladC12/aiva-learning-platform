import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Question } from '@/models/Question';
import { QuestionSet } from '@/models/QuestionSet';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
    try {
        // Parse JSON body to get the question set ID
        const params = await request.json();
        
        // Ensure the question set ID is provided
        if (!params.q) {
            return NextResponse.json(
                { error: 'Question set ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Step 1: Find the question set by ID
        const questionSet = await db.collection('QuestionSets').findOne({
            _id: new ObjectId(params.q)
        });

        if (!questionSet) {
            return NextResponse.json(
                { error: 'Question set not found' },
                { status: 404 }
            );
        }

        // Step 2: Use the question IDs from the question set to fetch the actual questions
        const questionIds = (questionSet as QuestionSet).questions.map(
            (id: string) => new ObjectId(id)
        );

        const questions = await db.collection('Questions')
            .find({ _id: { $in: questionIds } })
            .toArray();

        // Optional: Sort questions to match the original order in the question set
        const questionMap = new Map(questions.map(q => [q._id.toString(), q]));
        const orderedQuestions = (questionSet as QuestionSet).questions
            .map(id => questionMap.get(id))
            .filter(Boolean);

        return NextResponse.json(orderedQuestions as Question[]);
    } catch (error) {
        console.error('Failed to fetch question set:', error);
        return NextResponse.json(
            { error: 'Failed to fetch question set' },
            { status: 500 }
        );
    }
}

// Keep the GET method for backward compatibility or remove if not needed
export async function GET() {
    return NextResponse.json(
        { error: 'Method not supported, use POST instead' },
        { status: 405 }
    );
}