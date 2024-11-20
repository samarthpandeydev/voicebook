import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

function adjustVectorDimension(vector: number[], targetDimension: number): number[] {
  if (vector.length === targetDimension) return vector;
  if (vector.length > targetDimension) return vector.slice(0, targetDimension);
  return [...vector, ...Array(targetDimension - vector.length).fill(0)];
}

interface Message {
  role: string;
  content: string;
}

interface DocumentMetadata {
  text: string;
  pageNumber: number;
  chunk: number;
}

export async function POST(req: Request) {
  try {
    const { message, history, pdfName, script } = await req.json();
    
    if (!pdfName) {
      console.error('No pdfName provided');
      throw new Error('No pdfName provided');
    }

    if (!script) {
      console.error('No podcast script provided');
      throw new Error('No podcast script provided');
    }

    console.log('Processing chat request:', { pdfName, messageLength: message.length });
    
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    
    // Get initial context
    const queryResponse = await index.query({
      vector: new Array(768).fill(0),
      topK: 10,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: { $eq: pdfName }
      }
    });

    if (!queryResponse.matches.length) {
      throw new Error('No document content found in the database');
    }

    // Sort chunks by page number
    const orderedChunks = queryResponse.matches
      .filter((match): match is typeof match & { metadata: DocumentMetadata } => {
        return Boolean(match.metadata) && 
               typeof match.metadata === 'object' &&
               typeof match.metadata.text === 'string' &&
               typeof match.metadata.pageNumber === 'number' &&
               typeof match.metadata.chunk === 'number';
      })
      .sort((a, b) => a.metadata.pageNumber - b.metadata.pageNumber)
      .map(match => match.metadata.text);

    // Get semantic search results
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embedding = await model.embedContent(message);
    const adjustedVector = adjustVectorDimension(embedding.embedding.values, 768);
    
    const semanticResponse = await index.query({
      vector: adjustedVector,
      topK: 10,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: { $eq: pdfName }
      }
    });

    const relevantContexts = semanticResponse.matches
      .filter((match): match is typeof match & { metadata: DocumentMetadata, score: number } => {
        return Boolean(match.score) && 
               (match.score ?? 0) > 0.7 &&
               Boolean(match.metadata) &&
               typeof match.metadata === 'object' &&
               typeof match.metadata.text === 'string' &&
               typeof match.metadata.pageNumber === 'number';
      })
      .map(match => ({
        text: match.metadata.text,
        page: match.metadata.pageNumber,
        relevance: match.score
      }));

    const prompt = `Analyze this PDF document and its podcast discussion. Answer the user's question.

Context:
1. Key Document Points:
${orderedChunks.slice(0, 3).join('\n')}

2. Relevant Sections:
${relevantContexts.slice(0, 3).map(ctx => `[Page ${ctx.page}] ${ctx.text}`).join('\n')}

3. Podcast Excerpt:
${script.slice(0, 1000)}

Chat History:
${history.slice(-3).map((msg: Message) => `${msg.role}: ${msg.content}`).join('\n')}

Question: ${message}

Guidelines:
- Reference specific content and page numbers
- Include relevant quotes from the document
- Mention speakers when citing the podcast discussion`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1000
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content,
      context: relevantContexts
    });

  } catch (error) {
    console.error('Error in podcast chat:', error);
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    );
  }
}