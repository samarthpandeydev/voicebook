# Voicebook - PDF & YouTube to Podcast Converter

Voicebook is a sophisticated web application that transforms PDF documents and YouTube videos into engaging podcast-style conversations between two AI personas (Alex and Sarah). The application leverages advanced AI technologies for content processing, embedding generation, and natural language understanding.

## 🚀 Features

### PDF Processing
- Upload and process PDF documents
- Automatic content chunking and embedding
- Vector storage in Pinecone database
- Generate AI-powered podcast conversations
- Interactive chat with document context

### YouTube Integration
- Process YouTube videos via URL
- Automatic caption/transcript extraction
- Content vectorization and storage
- Generate podcast discussions about video content
- Context-aware chat about video content

### Podcast Generation
- Dynamic conversation generation between Alex and Sarah
- Minimum 55 lines of detailed dialogue
- Structured discussion format:
  - Introduction/Overview
  - Main points analysis
  - Critical discussion
  - Real-world implications
  - Personal perspectives

### Interactive Features
- Real-time audio playback
- Voice-enabled chat interface
- Context-aware responses
- PDF/Video content reference
- Semantic search capabilities

## 🛠 Tech Stack

### Frontend
- **Next.js 15.0.3** - React framework
- **React 19** - UI library
- **TailwindCSS** - Styling
- **TypeScript** - Type safety
- **React Icons** - Icon components

### Backend (API Routes)
- **Next.js API Routes** - Serverless functions
- **Pinecone** - Vector database
- **Google AI (Gemini)** - Embeddings generation
- **Groq** - LLM for conversation generation
- **LangChain** - Document processing
- **PDF Parse** - PDF text extraction

### AI/ML Components
- **Gemini Embedding Model** - Vector embeddings
- **Llama 3.2 90B** - Podcast generation
- **Mixtral 8x7B** - Chat responses
- **Web Speech API** - Voice interface

## 📦 Key Dependencies
```json
{
  "@google/generative-ai": "^0.21.0",
  "@langchain/community": "^0.3.14",
  "@pinecone-database/pinecone": "^4.0.0",
  "groq-sdk": "^0.8.0",
  "langchain": "^0.3.5",
  "next": "15.0.3"
}
```

## 🏗 Architecture

### Document Processing Flow
1. PDF/YouTube content upload
2. Content chunking and preprocessing
3. Embedding generation via Gemini AI
4. Vector storage in Pinecone
5. Podcast script generation via Groq
6. Interactive chat capabilities

### Data Flow
1. Content Ingestion → Chunking → Embedding → Storage
2. Query Processing → Semantic Search → Context Retrieval → Response Generation
3. Chat Interface → Voice Processing → Context-Aware Responses

## 🔧 Environment Setup

### 1. API Keys Required

#### Pinecone API Key
1. Visit [Pinecone Console](https://app.pinecone.io/)
2. Sign up or login to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and environment

#### Google AI (Gemini) API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create or sign in to your Google Cloud account
3. Enable the Gemini API
4. Create a new API key
5. Copy the key

#### Groq API Key
1. Visit [Groq Console](https://console.groq.com/)
2. Create an account or sign in
3. Go to API section
4. Generate new API key
5. Copy the key

### 2. Environment Configuration

1. Clone the repository:
```bash
git clone https://github.com/yourusername/voicebook.git
cd voicebook
```

2. Copy the environment example file:
```bash
cp .env.example .env
```

3. Update the .env file with your API keys:
```env
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name
PINECONE_ENVIRONMENT=your_environment
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Pinecone Index Setup

1. Create a new index in Pinecone console with:
   - Dimensions: 768 (Gemini embeddings)
   - Metric: Cosine
   - Pod Type: s1.x1 (recommended)

2. Update your .env with the index name:
```env
PINECONE_INDEX_NAME=your-index-name
```

### 4. Development Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
```

3. Build for production:
```bash
npm run build
npm start
# or
yarn build
yarn start


## 🎯 Key Components

### Content Processing
- PDF document chunking and embedding generation
- YouTube transcript extraction and processing
- Vector storage and retrieval

### Conversation Generation
- Structured podcast script generation
- Context-aware chat responses
- Voice interface integration

### User Interface
- Responsive design with TailwindCSS
- Audio playback controls
- Interactive chat interface
- Voice command support

## 📝 API Routes

### Main Endpoints
- `/api/upload` - PDF processing
- `/api/youtube` - YouTube video processing
- `/api/generate-podcast` - Podcast script generation
- `/api/chat` - Context-aware chat
- `/api/podcast-chat` - Podcast-specific chat
- `/api/podcast-yt-chat` - YouTube podcast chat

## 🔒 Security Considerations

- Environment variables for API keys
- Server-side processing of sensitive operations
- Rate limiting implementation
- Error handling and validation

## 🎨 UI/UX Features

- Clean, modern interface
- Responsive design
- Loading states and animations
- Error handling and user feedback
- Voice interaction capabilities

## 📚 Documentation References

- [Next.js Documentation](https://nextjs.org/docs)
- [Pinecone Documentation](https://docs.pinecone.io/)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [LangChain Documentation](https://js.langchain.com/docs)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests for any enhancements.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
