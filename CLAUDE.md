# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ちょいMEMO (ChoiMEMO)** - A simple, intuitive memo application built with React and Firebase, designed for App Store distribution.

## Tech Stack

- **Frontend**: React (with Vite for build tooling)
- **Authentication**: Firebase Authentication (email/password)
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Firebase Cloud Storage (for future image attachments)
- **Deployment**: Vercel
- **Navigation**: Swipe-based navigation between memos

## Architecture Principles

### Database Abstraction Layer

All Firebase operations must be wrapped in abstraction functions located in `lib/database.js` to enable potential future migration to Supabase. Example structure:

```javascript
// lib/database.js
export async function getMemos(userId) {
  // Firebase implementation here
  // Future Supabase migration only requires changes in this file
}
```

This abstraction keeps migration costs low and isolates database logic from UI components.

### Data Model

Firestore structure:
```
users/{userId}/memos/{memoId}
  ├── content: string (max 10,000 chars)
  ├── imageUrls: string[] (future feature)
  ├── created_at: timestamp
  └── updated_at: timestamp
```

### Auto-save Implementation

Memo content must use debounced auto-save (500ms-1s delay) to minimize Firestore write operations and stay within free tier limits.

### Security

- Firestore Security Rules enforce user-only data access (`request.auth.uid == userId`)
- Content validation: max 10,000 characters
- File uploads: max 5MB (future feature)
- Rules files must be maintained in repository for deployment

### Routing Structure

- `/signup` - New user registration
- `/login` - User login
- `/` - Main memo editing interface (requires authentication)

Unauthenticated users should be redirected to `/login`.

### Swipe Navigation

Left/right swipe gestures navigate between memos chronologically. Implementation should target 60fps for smooth animations.

## Firebase Free Tier Limits

Development must respect these quotas:
- Firestore: 50,000 reads/day, 20,000 writes/day
- Storage: 5GB, 1GB download/day
- Authentication: Unlimited users (charged after 50k MAU)

## Future Phases

- **Phase 2**: Image attachments, Apple/Google sign-in, offline support
- **Phase 3**: Search, tags/categories, sharing
- **Phase 4**: Supabase migration for cost optimization (if >10k users)

## Design Assets

Design files (icons, logos) are located in the `デザイン/` directory.

## Development Notes

- All authentication state should persist automatically (Firebase Auth handles this)
- Component design should support future offline-first functionality
- Keep Firebase configuration (apiKey, etc.) separate - these are safe to expose as Security Rules handle access control

## Code Style Guidelines

**IMPORTANT: The developer is a beginner. All code must be beginner-friendly.**

### Commenting Rules

1. **Every function must have a JSDoc comment** explaining:
   - What the function does
   - What each parameter means
   - What it returns
   - Example usage (if complex)

2. **Complex logic must have inline comments** explaining:
   - Why the code is written this way
   - What the code does in plain language
   - Any non-obvious behavior

3. **Use Japanese for comments** when explaining concepts (English is OK for technical terms)

### Example of Good Code Style

```typescript
/**
 * ユーザーのメモ一覧を取得する関数
 *
 * @param userId - 取得したいユーザーのID
 * @returns メモの配列（作成日時が新しい順）
 *
 * 使用例:
 * const memos = await getMemos('user123')
 */
export async function getMemos(userId: string): Promise<Memo[]> {
  // Firestoreからデータを取得
  // collection()でコレクションを指定し、getDocs()で全データを取得
  const snapshot = await getDocs(
    collection(db, `users/${userId}/memos`)
  )

  // Firestoreのドキュメントを、アプリで使いやすい形（Memo型）に変換
  return snapshot.docs.map(doc => ({
    id: doc.id, // ドキュメントIDをメモのIDとして使用
    ...doc.data() // その他のデータ（content, created_atなど）を展開
  }))
}
```

### What to Comment

- ✓ Function purpose and parameters
- ✓ Complex conditionals (`if`, `switch`)
- ✓ Array/object transformations (`.map()`, `.filter()`, etc.)
- ✓ API calls and database operations
- ✓ State management logic
- ✓ Non-obvious TypeScript types
- ✓ Workarounds or temporary solutions

### What NOT to Comment

- ✗ Obvious variable assignments (`const name = 'John'`)
- ✗ Simple return statements
- ✗ Self-explanatory code

**Remember: When in doubt, add more comments rather than fewer.**
