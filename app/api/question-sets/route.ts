import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { QuestionSet } from "@/models/QuestionSet";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch all question sets from the database
    const questionSets: QuestionSet[] = await db.collection("QuestionSets").find().toArray() as QuestionSet[];

    // Convert ObjectId to string for serialization
    const serializedSets = questionSets.map((set: QuestionSet) => ({
      ...set,
      _id: (set._id as ObjectId).toString(),
    }));

    return NextResponse.json(serializedSets);
  } catch (error) {
    console.error("Failed to fetch question sets:", error);
    return NextResponse.json(
      { error: "Failed to fetch question sets" },
      { status: 500 }
    );
  }
}