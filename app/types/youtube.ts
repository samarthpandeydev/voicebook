export interface CaptionTrack {
    languageCode: string;
    vssId?: string;
    baseUrl: string;
  }
  
  export interface SpeechRecognitionEvent {
    resultIndex: number;
    results: {
      [key: number]: {
        transcript: string;
      }[];
    };
  }