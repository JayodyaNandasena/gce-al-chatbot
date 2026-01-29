import z from "zod";

const envSchema = z.object({
    PINECONE_API_KEY: z.string().trim().min(1),
    PINECONE_ENVIRONMENT: z.string().trim().min(1),
    PINECONE_INDEX_BIOLOGY: z.string().trim().min(1),
    PINECONE_INDEX_CHEMISTRY: z.string().trim().min(1),
    PINECONE_INDEX_PHYSICS: z.string().trim().min(1),
    PINECONE_NAME_SPACE: z.string().trim().min(1),
    PDF_PATH: z.string().trim().min(1),
    INDEX_INIT_TIMEOUT: z.coerce.number().min(1),
});

export const env = envSchema.parse(process.env);
