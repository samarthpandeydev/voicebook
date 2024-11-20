export interface Message {
  role: string;
  content: string;
  context?: Array<{
    text: string;
    page: number;
    relevance: number;
  }>;
}

export interface CaptionTrack {
  languageCode: string;
  vssId?: string;
  baseUrl: string;
  name?: string;
}

export type MetadataValue = string | number | boolean | null;

export interface GenericMetadata {
  [key: string]: MetadataValue | Record<string, MetadataValue>;
}

export interface SpeechRecognitionResult extends Event {
  results: {
    [key: string]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
  resultIndex: number;
}

export type PineconeMetadata = {
  type: string;
  text: string;
  [key: string]: string | number | boolean;
};