import { ChatOllama } from "@langchain/ollama";
import { PineconeStore } from "@langchain/pinecone";
import { ConversationalRetrievalQAChain } from "@langchain/classic/chains";
import {getPineconeClient} from "@/lib/pinecone-client.js";
import {getVectorStore} from "@/lib/vector-store.js";
import {formatChatHistory} from "@/lib/utils.js";

const CONDENSE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

// const QA_TEMPLATE = `You are an enthusiastic AI assistant. Use the following pieces of context to answer the question at the end.
// If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
// If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.

// {context}

// Question: {question}
// Helpful answer in markdown:`;

// const QA_TEMPLATE = `
// You are a helpful AI assistant.

// Instructions:
// - Answer using ONLY the provided context.
// - If the answer is not in the context, respond with: "I don't have that information in the materials provided."
// - If the question is unrelated to the context, respond with: "That question is outside the scope of what I can help with based on the available materials."
// - Keep responses friendly and clear.
// - Use concise Markdown formatting when appropriate.
// - Provide ONLY the answer with no additional tokens or metadata.

// Context:
// {context}

// Question:
// {question}

// Answer:
// `;

const QA_TEMPLATE = `
You are a helpful AI assistant specializing in biology education.

Instructions:
- Answer using ONLY the provided context.
- Provide comprehensive, detailed answers with multiple paragraphs when appropriate.
- For essay questions, cover the topic thoroughly using all relevant information from the context.
- Break down complex topics into clear sections with examples.
- If the answer is not in the context, respond with: "I don't have that information in the materials provided."
- Keep responses friendly, clear, and educational.
- Use Markdown formatting for better readability (headings, lists, etc.).

Context:
{context}

Question:
{question}

Detailed Answer:
`;

type callChainArgs = {
    question: string;
    chatHistory: [string, string][];
    transformStream: TransformStream;
};

// function makeChain(
//     vectorStore: PineconeStore,
//     writer: WritableStreamDefaultWriter
// ) {
//     const encoder = new TextEncoder();

//     // Using Llama3 via ChatOllama for Streaming
//     const streamingModel = new ChatOllama({
//         model: "llama3",
//         temperature: 0,
//         streaming: true,
//         baseUrl: "http://localhost:11434", // Default Ollama URL
//         callbacks: [
//             {
//                 async handleLLMNewToken(token) {
//                     await writer.ready;
//                     await writer.write(encoder.encode(`${token}`));
//                 },
//                 async handleLLMEnd() {
//                     console.log("LLM end called");
//                 },
//             },
//         ],
//     });

//     // Non-streaming model for the question generator
//     const nonStreamingModel = new ChatOllama({
//         model: "llama3",
//         temperature: 0,
//         baseUrl: "http://localhost:11434",
//     });

//     const chain = ConversationalRetrievalQAChain.fromLLM(
//         streamingModel,
//         vectorStore.asRetriever(),
//         {
//             qaTemplate: QA_TEMPLATE,
//             questionGeneratorTemplate: CONDENSE_TEMPLATE,
//             returnSourceDocuments: true,
//             questionGeneratorChainOptions: {
//                 llm: nonStreamingModel,
//             },
//         }
//     );
//     return chain;
// }

function makeChain(
    vectorStore: PineconeStore,
    writer: WritableStreamDefaultWriter
) {
    const encoder = new TextEncoder();

    // Using Llama3 via ChatOllama for Streaming
    const streamingModel = new ChatOllama({
        model: "llama3",
        temperature: 0,
        streaming: true,
        baseUrl: "http://localhost:11434",
        callbacks: [
            {
                async handleLLMNewToken(token) {
                    await writer.ready;
                    await writer.write(encoder.encode(`${token}`));
                },
                async handleLLMEnd() {
                    console.log("LLM end called");
                },
            },
        ],
    });

    // Non-streaming model for the question generator
    const nonStreamingModel = new ChatOllama({
        model: "llama3",
        temperature: 0,
        baseUrl: "http://localhost:11434",
    });

    // UPDATED: Configure retriever to get more documents
    const retriever = vectorStore.asRetriever({
        // k: 10,              // Retrieve 10 documents instead of default 4
        // searchType: "mmr",  // Use MMR for better diversity
        // searchKwargs: {
        //     fetchK: 20,     // Fetch 20 candidates, then select best 10
        // }
        k: 6,              // Start with 6 instead of 10
        searchType: "similarity",  // Use similarity instead of MMR (faster)
    });

    const chain = ConversationalRetrievalQAChain.fromLLM(
        streamingModel,
        retriever,  // Use configured retriever instead of vectorStore.asRetriever()
        {
            qaTemplate: QA_TEMPLATE,
            questionGeneratorTemplate: CONDENSE_TEMPLATE,
            returnSourceDocuments: true,
            questionGeneratorChainOptions: {
                llm: nonStreamingModel,
            },
        }
    );
    return chain;
}

export async function callChain({
                                    question,
                                    chatHistory,
                                    transformStream,
                                }: callChainArgs) {
    try {
        const sanitizedQuestion = question.trim().replaceAll("\n", " ");
        const pineconeClient = await getPineconeClient("biology");

        // This will automatically use 'mxbai-embed-large' updated in vector-store.ts earlier
        const vectorStore = await getVectorStore("biology-index",pineconeClient);

        const encoder = new TextEncoder();
        const writer = transformStream.writable.getWriter();
        const chain = makeChain(vectorStore, writer);
        const formattedChatHistory = formatChatHistory(chatHistory);

        // LangChain "call" logic
        chain
            .invoke({
                question: sanitizedQuestion,
                chat_history: formattedChatHistory,
            })
            .then(async (res) => {
                const sourceDocuments = res?.sourceDocuments || [];
                const firstTwoDocuments = sourceDocuments.slice(0, 2);
                const pageContents = firstTwoDocuments.map(
                    ({ pageContent }: { pageContent: string }) => pageContent
                );

                const stringifiedPageContents = JSON.stringify(pageContents);

                await writer.ready;
                await writer.write(encoder.encode("tokens-ended"));

                setTimeout(async () => {
                    await writer.ready;
                    await writer.write(encoder.encode(`${stringifiedPageContents}`));
                    await writer.close();
                }, 100);
            });

        return transformStream?.readable;
    } catch (e) {
        console.error(e);
        throw new Error("Call chain method failed to execute!!");
    }
}