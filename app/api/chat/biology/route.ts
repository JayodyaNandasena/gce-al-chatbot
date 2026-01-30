import {NextRequest, NextResponse} from "next/server.js";
import {callChain} from "@/lib/langchain.js";

export const maxDuration = 60; // 60 seconds timeout

export async function POST(req: NextRequest) {
    const { question, chatHistory } = await req.json();

    if (!question) {
        return NextResponse.json(
            { error: "No question in the request" },
            { status: 400 }
        );
    }

    try {
        // Collect the complete response
        const transformStream = new TransformStream();
        const readableStream = await callChain({
            question,
            chatHistory,
            transformStream,
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error("Internal server error ", error);
        return NextResponse.json(
            { error: "Something went wrong. Try again!" },
            { status: 500 }
        );
    }
}
