// import {NextRequest, NextResponse} from "next/server.js";
// import {callChain} from "@/lib/langchain.js";
//
// export async function POST(req: NextRequest) {
//     const { question, chatHistory } = await req.json();
//
//     if (!question) {
//         return NextResponse.json("Error: No question in the request", {
//             status: 400,
//         });
//     }
//
//     try {
//         const transformStream = new TransformStream();
//         const readableStream = callChain({
//             question,
//             chatHistory,
//             transformStream,
//         });
//
//         return new Response(await readableStream);
//     } catch (error) {
//         console.error("Internal server error ", error);
//         return NextResponse.json("Error: Something went wrong. Try again!", {
//             status: 500,
//         });
//     }
// }

import {NextRequest, NextResponse} from "next/server.js";
import {callChain} from "@/lib/langchain.js";
import {cleanUpResponse} from "@/lib/utils.js";

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

        // Read the stream to completion
        const reader = readableStream.getReader();
        const decoder = new TextDecoder();
        let completeResponse = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            completeResponse += decoder.decode(value, { stream: true });
        }

        // Clean up the response
        let cleanedResponse: string = cleanUpResponse(completeResponse);

        // Return as JSON
        return NextResponse.json({
            answer: cleanedResponse,
            question: question
        });

    } catch (error) {
        console.error("Internal server error ", error);
        return NextResponse.json(
            { error: "Something went wrong. Try again!" },
            { status: 500 }
        );
    }
}
