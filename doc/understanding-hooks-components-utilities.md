# カスタムフック vs コンポーネント vs ユーティリティ関数の違い

**作成日**: 2026-02-24
**対象**: React初心者
**目的**: カスタムフック、コンポーネント、ユーティリティ関数の違いを理解する

---

## 📚 目次

1. [3つの違いを一覧で理解](#1-3つの違いを一覧で理解)
2. [コンポーネント（Component）](#2-コンポーネントcomponent)
3. [カスタムフック（Custom Hook）](#3-カスタムフックcustom-hook)
4. [ユーティリティ関数（Utility Function）](#4-ユーティリティ関数utility-function)
5. [実践的な使い分け](#5-実践的な使い分け)
6. [このプロジェクトの実例](#6-このプロジェクトの実例)

---

## 1. 3つの違いを一覧で理解

| 特徴 | コンポーネント | カスタムフック | ユーティリティ関数 |
|-----|-------------|-------------|---------------|
| **名前の規則** | `PascalCase` | `useCamelCase` | `camelCase` |
| **例** | `MemoPage` | `useMemoOperations` | `formatDate` |
| **返り値** | **JSX (UI)** | **データや関数** | **計算結果** |
| **目的** | **画面を表示** | **ロジックを再利用** | **汎用処理を再利用** |
| **Reactフック使用** | ✅ 可能 | ✅ 必須 | ❌ 不可 |
| **状態管理** | ✅ できる | ✅ できる | ❌ できない |
| **呼び出し場所** | JSXタグとして | コンポーネント/フック内 | どこでも |
| **配置場所** | `src/components/`, `src/pages/` | `src/hooks/` | `src/lib/` |

### 判断フローチャート

```
質問: 何を作りたい？
├─ 画面（UI）を作りたい
│  → コンポーネント (Component)
│
├─ 状態管理や副作用が必要なロジック
│  → カスタムフック (Custom Hook)
│
└─ 純粋な計算やデータ変換
   → ユーティリティ関数 (Utility Function)
```

---

## 2. コンポーネント（Component）

### 定義

**UIを表示するための関数。JSXを返す。**

### 特徴

- `PascalCase`で命名（例: `MemoPage`, `Header`, `FloatingButton`）
- JSX（HTML風の構文）を返す
- `useState`, `useEffect`などのフックを使える
- 他のコンポーネントやカスタムフックを使える

### コード例

```typescript
// src/pages/MemoPage.tsx
export default function MemoPage() {
  // ✅ useStateで状態管理できる
  const [content, setContent] = useState('')

  // ✅ useEffectで副作用を処理できる
  useEffect(() => {
    console.log('コンポーネントがマウントされた')
  }, [])

  // ✅ カスタムフックを呼び出せる
  const { memos, createMemo } = useMemoOperations()

  // ✅ JSXを返す（これが画面に表示される）
  return (
    <div className="memo-page">
      <Header />  {/* 他のコンポーネントを使える */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={createMemo}>保存</button>
    </div>
  )
}
```

### 使い方

```typescript
// App.tsx
function App() {
  return (
    <div>
      {/* JSXタグとして使う */}
      <MemoPage />
    </div>
  )
}
```

### このプロジェクトの例

- `src/pages/MemoPage.tsx` - メモ編集画面
- `src/pages/LoginPage.tsx` - ログイン画面
- `src/components/Header.tsx` - ヘッダーUI
- `src/components/FloatingButton.tsx` - 新規作成ボタン
- `src/components/PasswordInput.tsx` - パスワード入力欄

---

## 3. カスタムフック（Custom Hook）

### 定義

**Reactのロジックを再利用するための関数。データや関数を返す。**

### 特徴

- **必ず`use`で始まる名前**（例: `useMemoOperations`, `useAuth`）
- **内部でReactフックを使う**（useState, useEffect, useContext等）
- JSXは返さない（データや関数を返す）
- コンポーネントや他のカスタムフック内でのみ呼び出せる

### コード例

```typescript
// src/hooks/useMemoOperations.ts
export function useMemoOperations() {
  // ✅ useStateで状態を管理
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)

  // ✅ 他のカスタムフックを使える
  const { user } = useAuth()

  // ✅ useEffectで副作用を処理
  useEffect(() => {
    if (!user) return

    const loadMemos = async () => {
      const data = await getMemos(user.uid)
      setMemos(data)
      setLoading(false)
    }

    loadMemos()
  }, [user])

  // メモ作成関数
  const createMemo = async () => {
    const newMemo = await createMemoInDB(user.uid, '')
    setMemos([newMemo, ...memos])
  }

  // メモ削除関数
  const deleteMemo = async (memoId: string) => {
    await deleteMemoInDB(user.uid, memoId)
    setMemos(memos.filter(m => m.id !== memoId))
  }

  // ✅ データと関数を返す（JSXではない）
  return {
    memos,
    loading,
    createMemo,
    deleteMemo,
  }
}
```

### 使い方

```typescript
// MemoPage.tsx
function MemoPage() {
  // カスタムフックを呼び出す（関数として）
  const { memos, loading, createMemo, deleteMemo } = useMemoOperations()

  if (loading) return <LoadingSpinner />

  return (
    <div>
      {memos.map(memo => (
        <div key={memo.id}>
          <p>{memo.content}</p>
          <button onClick={() => deleteMemo(memo.id)}>削除</button>
        </div>
      ))}
      <button onClick={createMemo}>新規作成</button>
    </div>
  )
}
```

### このプロジェクトの例

- `src/hooks/useMemoOperations.ts` - メモのCRUD操作（状態管理あり）
- `src/hooks/useMemoEditing.ts` - デバウンス付き自動保存（useStateでタイマー管理）
- `src/hooks/useSwipeNavigation.ts` - スワイプジェスチャー検出（useEffectでイベントリスナー登録）

---

## 4. ユーティリティ関数（Utility Function）

### 定義

**純粋な計算やデータ変換を行う関数。Reactフックを使わない。**

### 特徴

- `camelCase`で命名（例: `formatDate`, `getAuthErrorMessage`）
- **Reactフックを使わない**（純粋なJavaScript/TypeScript）
- 状態管理や副作用処理はしない
- **どこからでも呼び出せる**（イベントハンドラー内、JSX内、他の関数内）

### コード例

```typescript
// src/lib/formatters.ts

/**
 * Firestoreのタイムスタンプを日本語形式に変換
 *
 * @param timestamp - Firestoreのタイムスタンプ
 * @returns "2月24日（月）" 形式の文字列
 */
export function formatDate(timestamp: Timestamp): string {
  // ✅ 純粋な計算のみ（Reactフック不使用）
  const date = timestamp.toDate()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const weekday = weekdays[date.getDay()]

  return `${month}月${day}日（${weekday}）`
}

/**
 * メモの最初の1行を抽出してプレビュー用テキストを作成
 *
 * @param content - メモの内容
 * @returns 最初の1行（最大50文字）
 */
export function getPreviewText(content: string): string {
  // ✅ 純粋なデータ変換（Reactフック不使用）
  const firstLine = content.split('\n')[0]
  return firstLine.length > 50
    ? firstLine.substring(0, 50) + '...'
    : firstLine
}
```

```typescript
// src/lib/errorHandlers.ts

/**
 * Firebase認証エラーを日本語メッセージに変換
 *
 * @param error - Firebase認証エラー
 * @returns 日本語エラーメッセージ
 */
export function getAuthErrorMessage(error: { code: string }): string {
  // ✅ 条件分岐のみ（Reactフック不使用）
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に使用されています'
    case 'auth/weak-password':
      return 'パスワードが弱すぎます'
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません'
    default:
      return 'エラーが発生しました'
  }
}
```

### 使い方

```typescript
// MemoPage.tsx
function MemoPage() {
  const { memos } = useMemoOperations()

  return (
    <div>
      {memos.map(memo => (
        <div key={memo.id}>
          {/* ✅ JSX内で直接呼び出せる */}
          <span>{formatDate(memo.created_at)}</span>
          <p>{getPreviewText(memo.content)}</p>
        </div>
      ))}
    </div>
  )
}

// LoginPage.tsx
function LoginPage() {
  const handleLogin = async () => {
    try {
      await signInWithEmail(email, password)
    } catch (error) {
      // ✅ イベントハンドラー内で直接呼び出せる
      const message = getAuthErrorMessage(error)
      alert(message)
    }
  }

  return <button onClick={handleLogin}>ログイン</button>
}
```

### このプロジェクトの例

- `src/lib/formatters.ts` - 日付フォーマット、テキストフォーマット
- `src/lib/errorHandlers.ts` - Firebase認証エラーメッセージ変換
- `src/lib/database.ts` - Firestore操作の抽象化レイヤー

---

## 5. 実践的な使い分け

### シナリオ1: メモアプリにいいね機能を追加したい

```typescript
// ❌ 間違い: ユーティリティ関数で状態管理しようとする
export function toggleLike(memoId) {
  const [liked, setLiked] = useState(false)  // エラー！
  // ...
}

// ✅ 正解: カスタムフックで状態管理する
export function useLike(memoId) {
  const [liked, setLiked] = useState(false)

  const toggleLike = () => setLiked(!liked)

  return { liked, toggleLike }
}
```

### シナリオ2: 文字数をカウントしたい

```typescript
// ✅ 正解: ユーティリティ関数（純粋な計算）
export function countCharacters(text: string): number {
  return text.length
}

// ❌ 過剰: カスタムフックにする必要なし
export function useCharacterCount(text: string) {
  const [count, setCount] = useState(0)  // 不要！

  useEffect(() => {
    setCount(text.length)
  }, [text])

  return count
}
```

### シナリオ3: ログインボタンを作りたい

```typescript
// ✅ 正解: コンポーネント（UIを返す）
export function LoginButton({ onClick }) {
  return (
    <button onClick={onClick} className="login-button">
      ログイン
    </button>
  )
}

// ❌ 間違い: カスタムフックでJSXを返そうとする
export function useLoginButton() {
  return <button>ログイン</button>  // エラー！
}
```

---

## 6. このプロジェクトの実例

### ディレクトリ構造

```
src/
├── components/           # コンポーネント（UI）
│   ├── Header.tsx
│   ├── FloatingButton.tsx
│   ├── PasswordInput.tsx
│   └── LoadingSpinner.tsx
│
├── pages/               # ページコンポーネント（画面全体）
│   ├── MemoPage.tsx
│   ├── LoginPage.tsx
│   └── SignupPage.tsx
│
├── hooks/               # カスタムフック（ロジック再利用）
│   ├── useMemoOperations.ts
│   ├── useMemoEditing.ts
│   └── useSwipeNavigation.ts
│
└── lib/                 # ユーティリティ関数（汎用処理）
    ├── formatters.ts
    ├── errorHandlers.ts
    ├── database.ts
    └── firebase.ts
```

### 実例: メモページの構成

```typescript
// src/pages/MemoPage.tsx
import { useState } from 'react'
import Header from '../components/Header'  // ← コンポーネント
import FloatingButton from '../components/FloatingButton'  // ← コンポーネント
import { useMemoOperations } from '../hooks/useMemoOperations'  // ← カスタムフック
import { useMemoEditing } from '../hooks/useMemoEditing'  // ← カスタムフック
import { formatDate } from '../lib/formatters'  // ← ユーティリティ関数

export default function MemoPage() {
  // カスタムフック1: メモ操作ロジック
  const { memos, currentIndex, createMemo, deleteMemo, navigateToMemo } =
    useMemoOperations()

  // カスタムフック2: 自動保存ロジック
  const { content, setContent, isSaving } =
    useMemoEditing(memos[currentIndex])

  const currentMemo = memos[currentIndex]

  return (
    <div className="memo-page">
      {/* コンポーネント: ヘッダーUI */}
      <Header
        title={currentMemo ? formatDate(currentMemo.created_at) : ''}
        onDelete={() => deleteMemo(currentMemo.id)}
      />

      {/* 通常のJSX */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {/* ユーティリティ関数: JSX内で直接使用 */}
      <div className="info">
        作成日: {formatDate(currentMemo.created_at)}
      </div>

      {/* コンポーネント: フローティングボタン */}
      <FloatingButton onClick={createMemo} />
    </div>
  )
}
```

---

## 🎯 まとめ

### 覚えるべき3つのポイント

1. **コンポーネント** = 画面を作る（JSXを返す）
2. **カスタムフック** = ロジックを再利用する（Reactフックを使う）
3. **ユーティリティ関数** = 計算やデータ変換（Reactフックを使わない）

### 判断基準

```
作りたいもの:
├─ 画面に表示したい
│  → コンポーネント
│
├─ useState/useEffectが必要
│  → カスタムフック
│
└─ 純粋な計算・変換
   → ユーティリティ関数
```

### よくある間違い

| 間違い | 正しい方法 |
|-------|----------|
| カスタムフックでJSXを返す | コンポーネントにする |
| ユーティリティ関数でuseStateを使う | カスタムフックにする |
| 単純な計算にカスタムフックを使う | ユーティリティ関数にする |

---

## 📚 参考資料

- [React公式ドキュメント - カスタムフック](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React公式ドキュメント - コンポーネント](https://react.dev/learn/your-first-component)
- このプロジェクトの `CLAUDE.md` - コードスタイルガイドライン

---

**学習のヒント**:
- 最初は混乱するのが普通です！
- 実際にコードを書きながら、少しずつ理解していきましょう
- このプロジェクトのコードを読んで、パターンを学んでください

**作成日**: 2026-02-24
**最終更新**: 2026-02-24
