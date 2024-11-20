import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface MetadataRecord {
  type: string;
  text: string;
  pageNumber?: number;
}

interface Message {
  role: string;
  content: string;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    // Generate embedding for the query
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embedding = await model.embedContent(message);
    
    // Query Pinecone with the embedding
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const queryResponse = await index.query({
      vector: embedding.embedding.values,
      topK: 10,
      includeMetadata: true,
      filter: { type: 'document'}
    });

    // Process and format the context
    const relevantContexts = queryResponse.matches
      .filter((match): match is typeof match & { metadata: MetadataRecord } => {
        if (!match.metadata || typeof match.metadata !== 'object') return false;
        const metadata = match.metadata;
        return 'type' in metadata && 
               'text' in metadata &&
               typeof metadata.type === 'string' && 
               typeof metadata.text === 'string';
      })
      .sort((a, b) => {
        const pageA = a.metadata.pageNumber ?? 0;
        const pageB = b.metadata.pageNumber ?? 0;
        return pageA - pageB;
      })
      .map(match => match.metadata.text)
      .join('\n\n');

    // Create a comprehensive prompt
    const prompt = `You are a helpful AI assistant answering questions about a PDF document. Use the following context to answer the question. If you cannot find the answer in the context, say so clearly.

Context from the PDF:
${relevantContexts}

Previous conversation:
${history.map((msg: Message) => `${msg.role}: ${msg.content}`).join('\n')}

Question: ${message}

Provide a clear, concise answer based on the context. If citing specific parts, mention the page number.`;

    // Get completion from GROQ
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content,
      context: relevantContexts
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Error processing chat message' },
      { status: 500 }
    );
  }
}