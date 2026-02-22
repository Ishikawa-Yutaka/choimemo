import { Timestamp } from 'firebase/firestore'

// User types
export interface User {
  uid: string
  email: string | null
}

// Memo types
export interface Memo {
  id: string
  content: string
  imageUrls?: string[]
  created_at: Date
  updated_at: Date
}

// Firestore document data (before conversion)
export interface MemoDocument {
  content: string
  imageUrls?: string[]
  /** Firestore Timestamp（Date型に変換される前の生データ） */
  created_at: Timestamp
  /** Firestore Timestamp（Date型に変換される前の生データ） */
  updated_at: Timestamp
}

// API Response types
export interface CreateMemoInput {
  content: string
  imageUrls?: string[]
}

export interface UpdateMemoInput {
  content?: string
  imageUrls?: string[]
}
