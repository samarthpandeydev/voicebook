import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface DocumentMetadata {
  text: string;
  pageNumber: number;
  type: 'document';
  source?: string;
}

interface VideoMetadata {
  text: string;
  chunk: number;
  type: 'video';
  source: string;
}

type PineconeMetadata = DocumentMetadata | VideoMetadata;

// Add type guard
function isDocumentMetadata(metadata: any): metadata is DocumentMetadata {
  return metadata?.type === 'document';
}

function isVideoMetadata(metadata: PineconeMetadata | undefined): metadata is VideoMetadata {
  return metadata?.type === 'video';
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

function chunkContent(content: string, maxLength: number = 4000): string[] {
  const chunks: string[] = [];
  let currentChunk = '';
  
  const sentences = content.split(/(?<=[.!?])\s+/);
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { message, history, script, pdfName } = await req.json();

    if (!script) {
      throw new Error('No podcast script provided');
    }

    // Query all PDF chunks first
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const queryResponse = await index.query({
      vector: new Array(768).fill(0),
      topK: 5,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: pdfName ? { $eq: pdfName } : undefined
      }
    });

    if (!queryResponse.matches.length) {
      throw new Error('No document content found in the database');
    }

    // Sort chunks by their order (page number)
    const orderedChunks = queryResponse.matches
      .filter((match): match is typeof match & { metadata: DocumentMetadata } => 
        match.metadata !== undefined && 
        isDocumentMetadata(match.metadata) &&
        typeof match.metadata.text === 'string')
      .sort((a, b) => a.metadata.pageNumber - b.metadata.pageNumber)
      .map(match => match.metadata.text);

    // Get semantic search results 
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embedding = await model.embedContent(message);
    
    const semanticResponse = await index.query({
      vector: embedding.embedding.values,
      topK: 5,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: pdfName ? { $eq: pdfName } : undefined
      }
    });

    const relevantContexts = semanticResponse.matches
      .filter((match): match is typeof match & { metadata: DocumentMetadata } => 
        match.metadata !== undefined && 
        isDocumentMetadata(match.metadata) &&
        match.score !== undefined && 
        match.score > 0.7)
      .map(match => ({
        text: match.metadata.text,
        page: match.metadata.pageNumber,
        relevance: match.score ?? 0
      }))
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0));

    // Chunk the document context
    const documentContextChunks = chunkContent(orderedChunks.join('\n\n'));
    const relevantContextText = relevantContexts
      .map(ctx => `[Page ${ctx.page}] ${ctx.text}`)
      .join('\n\n');

    // Process each chunk and combine responses
    let combinedResponse = '';
    for (const chunk of documentContextChunks) {
      const prompt = `You are an AI assistant analyzing both a PDF document and its podcast discussion by Alex and Sarah. Provide detailed, informative responses.

Available Information:
1. Original Document Content (Part ${documentContextChunks.indexOf(chunk) + 1}/${documentContextChunks.length}):
${chunk}

2. Most Relevant Document Sections:
${relevantContextText}

3. Podcast Discussion:
${script}

Previous conversation:
${history.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

User question: ${message}

Response Guidelines:
1. Analyze the available content and provide a focused response
2. Reference specific details from the document and podcast
3. When citing the document, mention page numbers
4. When referencing the podcast, mention the speaker`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 1000,
      });

      combinedResponse += ' ' + completion.choices[0].message.content;
    }

    return NextResponse.json({ 
      response: combinedResponse.trim(),
      context: relevantContexts,
      audioConfig: { 
        voice: 'en-GB-Male',
        rate: 0.9,
        pitch: 1.0,
        volume: 1
      }
    });
  } catch (error) {
    console.error('Error in podcast chat:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
}