import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { url } = await request.json();

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/pdf'
            }
        });

        if (!response.ok) {
            console.error('[PDF Proxy] Failed to fetch PDF:', {
                status: response.status,
                statusText: response.statusText
            });
            return NextResponse.json(
                { error: 'Failed to fetch PDF' },
                { status: response.status }
            );
        }

        // Get the PDF data as an array buffer
        const data = await response.arrayBuffer();

        // Return the PDF data with correct headers
        return new NextResponse(data, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': data.byteLength.toString(),
                'Content-Disposition': 'inline',
                'Cache-Control': 'no-store'
            },
        });
    } catch (error) {
        console.error('[PDF Proxy] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}