import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { env } from "@/lib/config.js";
import path from "node:path";

// TODO: fix pdf path
export async function getChunkedDocsFromPDF() {
    try {
        const pdfPath = path.join(import.meta.dirname, "..", env.PDF_PATH);

        console.log("Loading PDF from:", pdfPath);

        const loader = new PDFLoader(pdfPath);

        const docs = await loader.load();

        // From the docs https://www.pinecone.io/learn/chunking-strategies/
        // const textSplitter = new RecursiveCharacterTextSplitter({
        //     chunkSize: 1000,
        //     chunkOverlap: 200,
        // });
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 2000,      // Increase chunk size
            chunkOverlap: 400,    // Good overlap for context
        });

        return await textSplitter.splitDocuments(docs);
    } catch (e) {
        console.error(e);
        throw new Error("PDF docs chunking failed !");
    }
}