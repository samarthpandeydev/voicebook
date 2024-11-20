export interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      [key: number]: {
        transcript: string;
      }[];
    };
  }
  
  export interface CaptionTrack {
    languageCode: string;
    vssId?: string;
    baseUrl: string;
  }
  
  export interface Message {
    role: string;
    content: string;
  }