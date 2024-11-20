import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Function to generate embeddings using Gemini
async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const loader = new PDFLoader(blob);
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await textSplitter.splitDocuments(docs);

    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // Process chunks and generate embeddings
    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => ({
        id: `${file.name}-${i}`,
        values: await generateEmbeddings(chunk.pageContent),
        metadata: {
          text: chunk.pageContent,
          source: file.name,
          pageNumber: chunk.metadata.pageNumber || 1,
          type: 'document',
          chunk: i,
        },
      }))
    );

    // Upsert vectors in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${vectors.length} chunks from PDF`,
      chunks: vectors.length
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Error processing PDF: ' + (error as Error).message },
      { status: 500 }
    );
  }
}