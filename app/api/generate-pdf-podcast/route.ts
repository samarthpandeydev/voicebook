import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

async function generatePodcast(content: string, retryCount = 0) {
  const prompt = `Create a detailed, in-depth podcast conversation between Alex and Sarah discussing the following PDF document content. They MUST thoroughly analyze and discuss every aspect of the document in AT LEAST 55 conversation lines:

  ${content}

  Guidelines:
  1. REQUIRED: Generate AT LEAST 55 total lines of dialogue
  2. Structure the conversation to cover:
     - Document overview and initial impressions (10+ lines)
     - Main points and key findings (20+ lines)
     - Critical analysis of the content (15+ lines)
     - Real-world applications (5+ lines)
     - Personal takeaways (5+ lines)
  3. Use natural conversation patterns with detailed responses
  4. Each speaker MUST have at least 25 lines
  5. NO short responses - each reply should be detailed and meaningful

  Format: 
  - Use ONLY "Alex:" and "Sarah:" as speaker labels
  - Make the conversation flow naturally
  - Include thoughtful transitions
  - NO abbreviated or short exchanges`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.2-90b-text-preview',
    temperature: 0.9,
    max_tokens: 8192,
    top_p: 0.95,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  });

  const script = completion.choices[0].message.content;
  
  const lineCount = script?.split('\n')
    .filter(line => {
      const trimmedLine = line.trim();
      return trimmedLine.startsWith('Alex:') || trimmedLine.startsWith('Sarah:');
    })
    .length || 0;

  console.log(`Generated ${lineCount} lines of dialogue`);

  if (!script || lineCount < 10) {
    if (retryCount < 2) {
      retryCount++;
      return generatePodcast(content, retryCount);
    }
    throw new Error(`Generated script has only ${lineCount} lines (minimum 55 required)`);
  }

  return NextResponse.json({ script });
}

interface DocumentMetadata {
  text: string;
  pageNumber: number;
  chunk: number;
}

export async function POST(req: Request) {
  try {
    const { pdfName } = await req.json();
    
    if (!pdfName) {
      throw new Error('No PDF name provided');
    }

    console.log('Searching for PDF:', pdfName);

    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    
    const checkResponse = await index.query({
      vector: new Array(768).fill(0),
      topK: 1,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: { $eq: pdfName }
      }
    });

    if (!checkResponse.matches.length) {
      console.error('PDF not found in database:', pdfName);
      throw new Error(`PDF "${pdfName}" not found in the database`);
    }

    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const sampleText = "document content main points summary";
    const embedding = await model.embedContent(sampleText);
    
    const queryResponse = await index.query({
      vector: embedding.embedding.values,
      topK: 100,
      includeMetadata: true,
      filter: { 
        type: { $eq: 'document' },
        source: { $eq: pdfName }
      }
    });

    if (!queryResponse.matches.length) {
      throw new Error('No document content found in the database');
    }

    const content = queryResponse.matches
      .filter((match): match is typeof match & { metadata: DocumentMetadata } => {
        return Boolean(match.metadata) && 
               typeof match.metadata === 'object' &&
               typeof match.metadata.text === 'string' &&
               typeof match.metadata.pageNumber === 'number' &&
               typeof match.metadata.chunk === 'number';
      })
      .sort((a, b) => {
        if (a.metadata.pageNumber === b.metadata.pageNumber) {
          return a.metadata.chunk - b.metadata.chunk;
        }
        return a.metadata.pageNumber - b.metadata.pageNumber;
      })
      .map(match => `[Page ${match.metadata.pageNumber}] ${match.metadata.text}`)
      .join('\n\n');

    if (!content.trim()) {
      throw new Error('No valid document content found');
    }

    return generatePodcast(content);
  } catch (error) {
    console.error('Error generating podcast:', error);
    return NextResponse.json(
      { error: 'Error generating podcast script' },
      { status: 500 }
    );
  }
}