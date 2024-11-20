export interface BaseMetadata {
    text: string;
    type: string;
    source: string;
  }
  
  export interface DocumentMetadata extends BaseMetadata {
    type: 'document';
    pageNumber: number;
  }
  
  export interface VideoMetadata extends BaseMetadata {
    type: 'video';
    chunk: number;
  }
  
  export type PineconeMetadata = DocumentMetadata | VideoMetadata;
  
  export function isDocumentMetadata(metadata: PineconeMetadata): metadata is DocumentMetadata {
    return metadata?.type === 'document';
  }
  
  export function isVideoMetadata(metadata: PineconeMetadata): metadata is VideoMetadata {
    return metadata?.type === 'video';
  }