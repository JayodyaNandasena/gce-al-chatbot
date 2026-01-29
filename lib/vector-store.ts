import { OllamaEmbeddings } from "@langchain/ollama";
import { PineconeStore } from '@langchain/pinecone';
import { Pinecone as PineconeClient } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { env } from "@/lib/config.js";

const ollamaEmbeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
});

export async function pineconeEmbedAndStore(
    pineconeIndex: string,
    client: PineconeClient,
    docs: Document[]
) {
    try {
        const index = client.Index(pineconeIndex);

        // We process docs in chunks and limit concurrency
        await PineconeStore.fromDocuments(docs, ollamaEmbeddings, {
            pineconeIndex: index,
            namespace: env.PINECONE_NAME_SPACE,
            textKey: "text",
            maxConcurrency: 5,  // limits how many chunks are embedded at once
        });

        console.log("Successfully embedded and stored documents!");

    } catch (error) {
        console.error("Pinecone storage error: ", error);
        throw new Error("Failed to load your docs to Pinecone!");
    }
}

export async function getVectorStore(pineconeIndex: string, client: PineconeClient) {
    try {
        const index = client.Index(pineconeIndex);

        const vectorStore = await PineconeStore.fromExistingIndex(ollamaEmbeddings, {
            pineconeIndex: index,
            textKey: "text",
            namespace: env.PINECONE_NAME_SPACE,
        });

        return vectorStore;
    } catch (error) {
        console.error("Vector store retrieval error: ", error);
        throw new Error("Something went wrong while getting vector store!");
    }
}