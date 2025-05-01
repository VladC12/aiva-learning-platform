import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db();
        const filters = await db.collection("Filters").find({}).toArray();

        return NextResponse.json(filters);
    } catch (error) {
        console.error("Failed to fetch filters:", error);
        return NextResponse.json(
            { error: "Failed to fetch filters" },
            { status: 500 }
        );
    }
}