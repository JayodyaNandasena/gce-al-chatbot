

// This operation might fail because indexes likely need
// more time to init, so give some 5 mins after index
// creation and try again.
import {getPineconeClient} from "@/lib/pinecone-client.js";
import {getChunkedDocsFromPDF} from "@/lib/pdf-loader.js";
import {pineconeEmbedAndStore} from "@/lib/vector-store.js";

(async () => {
    try {
        const pineconeClient = await getPineconeClient("biology");
        console.log("Preparing chunks from PDF file");
        const docs = await getChunkedDocsFromPDF();
        console.log(`Loading ${docs.length} chunks into pinecone...`);
        await pineconeEmbedAndStore("biology-index", pineconeClient, docs);
        console.log("Data embedded and stored in pine-cone biology-index");
    } catch (error) {
        console.error("Init client script failed ", error);
    }
})();
