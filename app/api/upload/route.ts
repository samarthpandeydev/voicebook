import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAI } from "@google/generative-ai";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function checkPDFExists(fileName: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  
  const queryResponse = await index.query({
    vector: Array(768).fill(0),
    filter: {
      source: { $eq: fileName },
      type: { $eq: 'document' }
    },
    topK: 1,
    includeMetadata: true
  });

  return queryResponse.matches.length > 0;
}

async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
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

    // Check if PDF already exists in database
    const pdfExists = await checkPDFExists(file.name);
    
    if (pdfExists) {
      return NextResponse.json({ 
        success: true, 
        message: 'PDF already exists in database',
        alreadyExists: true
      });
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

    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => ({
        id: `${file.name}-${i}`,
        values: await generateEmbeddings(chunk.pageContent),
        metadata: {
          text: chunk.pageContent,
          source: file.name,
          pageNumber: chunk.metadata.pageNumber || 1,
          type: 'document',
          chunk: i
        },
      }))
    );

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
    return NextResponse.json({ 
      error: 'Error processing PDF file' 
    }, { status: 500 });
  }
} 