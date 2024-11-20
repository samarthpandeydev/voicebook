import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { CaptionTrack } from '../../types/shared';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

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

async function getVideoTranscript(videoId: string) {
  const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });

  const captionsMatch = response.data.match(/"captionTracks":(\[.*?\]),/);
  if (!captionsMatch) {
    throw new Error('No captions found');
  }

  const captions = JSON.parse(captionsMatch[1]);
  const englishCaptions = captions.find(
    (caption: CaptionTrack) => 
      caption.languageCode === 'en' || 
      caption.languageCode === 'en-US' ||
      caption.vssId?.includes('.en')
  );

  if (!englishCaptions) {
    throw new Error('No English captions available');
  }

  const transcriptResponse = await axios.get(englishCaptions.baseUrl);
  return transcriptResponse.data;
}

async function checkVideoExists(videoId: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  
  const queryResponse = await index.query({
    vector: Array(768).fill(0),
    filter: {
      source: { $eq: videoId },
      type: { $eq: 'video' }
    },
    topK: 1,
    includeMetadata: true
  });

  return queryResponse.matches.length > 0;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Check if video already exists
    const exists = await checkVideoExists(videoId);
    if (exists) {
      return NextResponse.json({ 
        success: true, 
        videoId,
        message: 'Video already processed'
      });
    }

    // Get video info for title
    const videoInfoResponse = await axios.get(`https://www.youtube.com/oembed?url=${url}&format=json`);
    const title = videoInfoResponse.data.title;

    // Get transcript
    const transcript = await getVideoTranscript(videoId);
    
    // Clean and format transcript
    const text = transcript
      .replace(/<[^>]*>/g, '')
      .replace(/\n\n/g, ' ')
      .trim();
    
    // Split into chunks
    const chunks = [];
    for (let i = 0; i < text.length; i += 1500) {
      chunks.push(text.slice(i, i + 1500));
    }

    // Store in Pinecone with proper embeddings
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
    
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbeddings(chunks[i]);
      
      await index.upsert([{
        id: `${videoId}-${i}`,
        values: embedding,
        metadata: {
          text: chunks[i],
          type: 'video',
          source: videoId,
          title,
          chunk: i
        }
      }]);
    }

    return NextResponse.json({ 
      success: true, 
      videoId,
      chunks: chunks.length 
    });
  } catch (error) {
    console.error('Error processing YouTube video:', error);
    return NextResponse.json(
      { error: 'Error processing video: ' + (error as Error).message },
      { status: 500 }
    );
  }
}