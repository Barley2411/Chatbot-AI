export type Role = 'user' | 'ai';

export interface Attachment {
  name: string;
  mimeType: string;
  data?: string; // base64 data
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  style?: ResponseStyle;
  attachments?: Attachment[];
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ResponseStyle = 'short' | 'detailed' | 'simple';

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  responseStyle: ResponseStyle;
}
