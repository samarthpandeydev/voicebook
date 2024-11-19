import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { Groq } from 'groq-sdk';
import { GoogleGenerativeAI } from "@google/generative-ai";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface VideoMetadata {
  text: string;
  chunk: number;
  type: 'video';
  source: string;
}

function isVideoMetadata(metadata: any): metadata is VideoMetadata {
  return metadata?.type === 'video';
}

export async function POST(req: Request) {
  try {
    const { message, history, videoId, script } = await req.json();

    if (!script) {
      throw new Error('No podcast script provided');
    }

    // Query all video chunks first
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    const queryResponse = await index.query({
      vector: new Array(768).fill(0),
      filter: { 
        source: videoId,
        type: 'video'
      },
      topK: 100,
      includeMetadata: true
    });

    if (!queryResponse.matches.length) {
      throw new Error('No video content found in the database');
    }

    // Sort chunks by their order
    const orderedChunks = queryResponse.matches
      .filter((match): match is typeof match & { metadata: VideoMetadata } => 
        match.metadata !== undefined && 
        isVideoMetadata(match.metadata) &&
        typeof match.metadata.text === 'string')
      .sort((a, b) => a.metadata.chunk - b.metadata.chunk)
      .map(match => match.metadata.text);

    // Get semantic search results for the question
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const embedding = await model.embedContent(message);
    
    const semanticResponse = await index.query({
      vector: embedding.embedding.values,
      filter: { 
        source: videoId,
        type: 'video'
      },
      topK: 5,
      includeMetadata: true
    });

    const relevantContexts = semanticResponse.matches
      .filter((match): match is typeof match & { metadata: VideoMetadata } => 
        match.metadata !== undefined && 
        isVideoMetadata(match.metadata) &&
        match.score !== undefined && 
        match.score > 0.7)
      .map(match => ({
        text: match.metadata.text,
        chunk: match.metadata.chunk,
        relevance: match.score
      }));

    const videoContext = orderedChunks.join('\n\n');

    const prompt = `You are an AI assistant analyzing both a YouTube video and its podcast discussion by Alex and Sarah. Provide detailed, informative responses.

Available Information:
1. Original Video Content:
${videoContext}

2. Most Relevant Video Sections:
${relevantContexts.map(ctx => `[Part ${ctx.chunk + 1}] ${ctx.text}`).join('\n\n')}

3. Podcast Discussion:
${script}

Previous conversation:
${history.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n')}

User question: ${message}

Response Guidelines:
1. Provide detailed responses (4-6 sentences)
2. Analyze question intent:
   - Video-specific questions: Reference specific parts of the video content
   - Podcast-specific questions: Include Alex/Sarah's detailed insights
   - Comparison questions: Thorough analysis of both video and podcast perspectives
   - General questions: Comprehensive summary with key takeaways
3. Include relevant quotes or specific examples
4. Maintain a clear structure in your response
5. When citing the video, mention the specific part
6. When referencing the podcast discussion, mention the speaker`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.2-90b-text-preview',
      temperature: 0.7,
      max_tokens: 2000,  // Increased for longer responses
    });

    return NextResponse.json({ 
      response: completion.choices[0].message.content,
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