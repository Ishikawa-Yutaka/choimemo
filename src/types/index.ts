// User types
export interface User {
  uid: string;
  email: string | null;
}

// Memo types
export interface Memo {
  id: string;
  content: string;
  imageUrls?: string[];
  created_at: Date;
  updated_at: Date;
}

// Firestore document data (before conversion)
export interface MemoDocument {
  content: string;
  imageUrls?: string[];
  created_at: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
}

// API Response types
export interface CreateMemoInput {
  content: string;
  imageUrls?: string[];
}

export interface UpdateMemoInput {
  content?: string;
  imageUrls?: string[];
}
