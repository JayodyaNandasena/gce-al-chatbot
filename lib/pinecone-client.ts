import { Pinecone } from '@pinecone-database/pinecone';
import {env} from "@/lib/config.js";
import {delay} from "@/lib/utils.js";

let pineconeClientInstance: Pinecone | null = null;

async function createIndex(pc: Pinecone, indexName: string) {
    try {
        await pc.createIndex({
            name: indexName,
            dimension: 1536,
            metric: "cosine",
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: env.PINECONE_ENVIRONMENT
                }
            }
        });

        console.log(`Waiting for ${env.INDEX_INIT_TIMEOUT}s for initialization...`);
        await delay(env.INDEX_INIT_TIMEOUT);
        console.log("Index created !!");
    } catch (error) {
        console.error("error ", error);
        throw new Error("Index creation failed");
    }
}

async function initPineconeClient(subject: string) {
    try {
        // Initialize directly in the constructor
        const pc = new Pinecone({
            apiKey: env.PINECONE_API_KEY,
        });

        const indexName = `${subject.toLowerCase()}-index`;

        // listIndexes returns an object with an 'indexes' array
        const response = await pc.listIndexes();
        const existingIndexes = response.indexes?.map(idx => idx.name) || [];

        if (!existingIndexes.includes(indexName)) {
            await createIndex(pc, indexName);
        } else {
            console.log("Index already exists!!");
        }

        return pc;
    } catch (error) {
        console.error("error", error);
        throw new Error("Failed to initialize Pinecone Client");
    }
}

export async function getPineconeClient(subject: string) {
    if (!pineconeClientInstance) {
        pineconeClientInstance = await initPineconeClient(subject);
    }
    return pineconeClientInstance;
}