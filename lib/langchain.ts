import {ChatOllama} from "@langchain/ollama";
import {PineconeStore} from "@langchain/pinecone";
import {ConversationalRetrievalQAChain} from "@langchain/classic/chains";
import {getPineconeClient} from "@/lib/pinecone-client.js";
import {getVectorStore} from "@/lib/vector-store.js";
import {formatChatHistory} from "@/lib/utils.js";

const CONDENSE_TEMPLATE = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;

// const QA_TEMPLATE = `
// You are a helpful AI assistant specializing in science education.
//
// Instructions:
// - Answer using ONLY the provided context.
// - Provide comprehensive, detailed answers with multiple paragraphs when appropriate.
// - For essay questions, cover the topic thoroughly using all relevant information from the context.
// - Break down complex topics into clear sections with examples.
// - If the answer is not in the context, respond with: "The requested information is not covered in the current syllabus."
// - Keep responses friendly, clear, and educational.
// - Use Markdown formatting for better readability (headings, lists, etc.).
//
// Context:
// {context}
//
// Question:
// {question}
//
// Detailed Answer:
// `;

const QA_TEMPLATE = `
You are a helpful AI assistant specializing in science education.

Instructions:
- First, determine whether the question can be fully answered using ONLY the provided context.
- If it cannot, respond ONLY with:
  "The requested information is not covered in the current syllabus."
- Do NOT provide any additional explanation in that case.

- If it can be answered:
  - Answer using ONLY the provided context.
  - Provide comprehensive, detailed answers with multiple paragraphs when appropriate.
  - Break down complex topics into clear sections with examples.
  - Use Markdown formatting for better readability.

Context:
{context}

Question:
{question}

Answer:
`;


type callChainArgs = {
    question: string;
    chatHistory: [string, string][];
    transformStream: TransformStream;
};

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

    return ConversationalRetrievalQAChain.fromLLM(
        streamingModel,
        retriever,
        {
            qaTemplate: QA_TEMPLATE,
            questionGeneratorTemplate: CONDENSE_TEMPLATE,
            returnSourceDocuments: true,
            questionGeneratorChainOptions: {
                llm: nonStreamingModel,
            },
        }
    );
}

export async function callChain({
                                    question,
                                    chatHistory,
                                    transformStream,
                                }: callChainArgs) {
    try {
        const sanitizedQuestion = question.trim().replaceAll("\n", " ");
        const pineconeClient = await getPineconeClient("biology");

        const vectorStore = await getVectorStore("biology-index",pineconeClient);

        const encoder = new TextEncoder();
        const writer = transformStream.writable.getWriter();
        const chain = makeChain(vectorStore, writer);
        const formattedChatHistory = formatChatHistory(chatHistory);

        // LangChain call logic
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