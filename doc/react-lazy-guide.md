# React.lazy ガイド - 遅延ロード（Lazy Loading）

## React.lazy とは？

**React.lazy = コンポーネントを「必要になった時だけ」読み込む機能**

通常、すべてのコンポーネントは最初から読み込まれますが、React.lazyを使うと、**そのページにアクセスした時に初めて読み込まれる**ようになります。

### 例え話：レストランのメニュー

```
【通常の読み込み】
お客さん: 「こんにちは」
店員: 「いらっしゃいませ！」
    → 和食、洋食、中華、デザート、ドリンク、全メニューを持ってくる
お客さん: 「今日は和食だけでいいのに...」

【React.lazy（遅延ロード）】
お客さん: 「こんにちは」
店員: 「いらっしゃいませ！」
お客さん: 「和食メニューを見せて」
店員: 「はい、和食メニューです」← 必要な時だけ持ってくる
お客さん: 「次は中華メニュー」
店員: 「はい、中華メニューです」← また必要な時だけ
```

---

## なぜReact.lazyが必要？

### 1. 初期ロードが速くなる

```javascript
// 【通常】すべてを最初に読み込む
import LoginPage from './pages/LoginPage'      // ⬇️ 2.5 KB
import SignupPage from './pages/SignupPage'    // ⬇️ 2.6 KB
import MemoPage from './pages/MemoPage'        // ⬇️ 12 KB
// ...他のページ全部

合計: 約30 KB を最初に全部ダウンロード
→ ログインページしか見ないのに、メモページのコードもダウンロード 😢

// 【React.lazy】必要な時だけ読み込む
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const MemoPage = lazy(() => import('./pages/MemoPage'))

最初: 約5 KB だけダウンロード
/login にアクセス: LoginPage (2.5 KB) だけ追加ダウンロード
/signup にアクセス: SignupPage (2.6 KB) だけ追加ダウンロード
/ にアクセス: MemoPage (12 KB) だけ追加ダウンロード
→ 必要な分だけダウンロード 😊
```

### 2. ユーザーが使わないページは読み込まれない

```
例: ログインだけして終わるユーザー
→ メモページのコードは一生ダウンロードされない
→ 通信量の節約！
```

---

## 使い方

### ステップ1: 通常のimportをやめる

```javascript
// 【通常のimport】
import LoginPage from './pages/LoginPage'
```

### ステップ2: React.lazyに変更

```javascript
// 【React.lazy】
import { lazy } from 'react'

const LoginPage = lazy(() => import('./pages/LoginPage'))
```

### ステップ3: Suspenseで囲む

React.lazyで読み込むコンポーネントは、必ず `<Suspense>` で囲む必要があります。

```javascript
import { lazy, Suspense } from 'react'
import LoadingSpinner from './components/LoadingSpinner'

const LoginPage = lazy(() => import('./pages/LoginPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      {/* 読み込み中は LoadingSpinner を表示 */}
      <LoginPage />
    </Suspense>
  )
}
```

---

## 実際のコード例（このプロジェクト）

### src/App.tsx

```typescript
/**
 * アプリのメインコンポーネント
 */

import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Firebase SDK を初期化
import './lib/firebase'

/**
 * ページコンポーネントを遅延ロード（コード分割）
 *
 * React.lazy を使用することで、各ページは初回アクセス時に動的に読み込まれます。
 * これにより初期バンドルサイズが大幅に削減され、ページの読み込み速度が向上します。
 *
 * 例: ログインページにアクセスするまで、メモページのコードはダウンロードされません
 */
const SignupPage = lazy(() => import('./pages/SignupPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'))
const AuthActionPage = lazy(() => import('./pages/AuthActionPage'))
const MemoPage = lazy(() => import('./pages/MemoPage'))

/**
 * アプリ全体のルーティングを定義するコンポーネント
 *
 * Suspense の役割:
 * - React.lazy でロードされるコンポーネントを囲む必要があります
 * - コンポーネントの読み込み中は fallback に指定したコンポーネントを表示します
 * - 読み込みが完了すると、実際のページコンポーネントに切り替わります
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      {/* Suspense で全ルートを囲む（遅延ロードされるページの読み込み中の表示を管理） */}
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* アカウント作成ページ */}
          <Route path="/signup" element={<SignupPage />} />

          {/* ログインページ */}
          <Route path="/login" element={<LoginPage />} />

          {/* パスワードリセットページ */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* メール確認待ちページ */}
          <Route path="/verify-email" element={<EmailVerificationPage />} />

          {/* Firebaseメールリンクの処理ページ */}
          <Route path="/__/auth/action" element={<AuthActionPage />} />

          {/* メインのメモ編集ページ（ログイン必須） */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MemoPage />
              </ProtectedRoute>
            }
          />

          {/* 定義されていないURLにアクセスされた場合はトップページにリダイレクト */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
```

---

## Suspenseとは？

**Suspense = 読み込み中の表示を管理するコンポーネント**

React.lazyで読み込むコンポーネントは、ダウンロードに時間がかかる場合があります。その間、何も表示しないと画面が真っ白になってしまいます。

Suspenseを使うと、**読み込み中に表示する内容**を指定できます。

### Suspenseの使い方

```javascript
<Suspense fallback={<LoadingSpinner />}>
  {/* ↑ 読み込み中はこれを表示 */}
  <LoginPage />
  {/* ↑ 読み込み完了後はこれを表示 */}
</Suspense>
```

### 読み込みの流れ

```
1. ユーザーが /login にアクセス
    ↓
2. React.lazy が LoginPage をダウンロード開始
    ↓
3. ダウンロード中は <LoadingSpinner /> を表示
    ↓
4. ダウンロード完了
    ↓
5. <LoginPage /> を表示
```

---

## どうやって動いているのか？

### 1. ビルド時（`npm run build`）

```
src/App.tsx を見る
    ↓
「lazy(() => import('./pages/LoginPage'))」を発見
    ↓
Viteが LoginPage を別ファイル（チャンク）に分離
    ↓
dist/assets/LoginPage-BM_4dwEz.js として生成
```

### 2. ユーザーがアクセス時

```
ユーザーがアプリを開く
    ↓
index.html + メインのJSファイル（約6 KB）をダウンロード
    ↓
アプリ起動（でもまだLoginPageのコードはない）
    ↓
ユーザーが /login にアクセス
    ↓
「あ、LoginPageが必要だ！」
    ↓
LoginPage-BM_4dwEz.js (2.5 KB) をダウンロード開始
    ↓
ダウンロード中: <LoadingSpinner /> を表示
    ↓
ダウンロード完了: <LoginPage /> を表示
```

---

## チャンク分割との関係

React.lazyとmanualChunksは**別々の最適化技術**ですが、組み合わせることで最大の効果を発揮します。

### React.lazy（ルートベースのコード分割）

**役割**: ページごとにファイルを分割

```
【React.lazyなし】
index.js (30 KB) ← 全ページのコードが入っている

【React.lazyあり】
index.js (6 KB)              ← メインのコード
LoginPage.js (2.5 KB)        ← ログインページのコード
SignupPage.js (2.6 KB)       ← アカウント作成ページのコード
MemoPage.js (12 KB)          ← メモページのコード
```

### manualChunks（ライブラリの分割）

**役割**: ライブラリごとにファイルを分割

```
【manualChunksなし】
index.js (664 KB) ← React、Firebase、すべてが入っている

【manualChunksあり】
react.js (158 KB)              ← React本体
firebase-auth.js (142 KB)      ← Firebase認証
firebase-firestore.js (249 KB) ← Firestore
vendor.js (157 KB)             ← その他
index.js (6 KB)                ← アプリのコード
```

### 組み合わせた効果

```
最初にアプリを開く
    ↓
ダウンロード:
  - react.js (158 KB)
  - firebase-auth.js (142 KB)  ← manualChunksのおかげで分割
  - firebase-firestore.js (249 KB)
  - vendor.js (157 KB)
  - index.js (6 KB)

/login にアクセス
    ↓
ダウンロード:
  - LoginPage.js (2.5 KB)      ← React.lazyのおかげで必要な時だけ

/ にアクセス
    ↓
ダウンロード:
  - MemoPage.js (12 KB)        ← React.lazyのおかげで必要な時だけ
```

---

## ビフォー・アフター

### 改善前（React.lazyなし）

```javascript
// 通常のimport（すべて最初に読み込む）
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import MemoPage from './pages/MemoPage'
// ...

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<MemoPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**結果**: 初期バンドルサイズ 197 KB (gzip)

### 改善後（React.lazyあり）

```javascript
// React.lazy（必要な時だけ読み込む）
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const MemoPage = lazy(() => import('./pages/MemoPage'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<MemoPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

**結果**: 初期バンドルサイズ 173.6 KB (gzip)

### 改善効果

| 項目 | 改善前 | 改善後 | 効果 |
|------|--------|--------|------|
| **初期バンドルサイズ** | 197 KB | 173.6 KB | **約12%削減** |
| **ページチャンク** | なし | 各1-12 KB | **必要時のみロード** |
| **未訪問ページのコード** | ダウンロードされる | ダウンロードされない | **通信量削減** |

---

## 注意点

### 1. Suspenseで囲む必要がある

```javascript
// ❌ エラー！Suspenseがない
const LoginPage = lazy(() => import('./pages/LoginPage'))

function App() {
  return <LoginPage />  // エラー: Suspenseで囲む必要があります
}

// ✅ 正しい
const LoginPage = lazy(() => import('./pages/LoginPage'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPage />
    </Suspense>
  )
}
```

### 2. default exportが必要

```javascript
// ❌ エラー！名前付きエクスポート
export const LoginPage = () => { /* ... */ }

// ✅ 正しい（default export）
const LoginPage = () => { /* ... */ }
export default LoginPage
```

### 3. 条件付きimportはできない

```javascript
// ❌ エラー！条件の中でlazyを使えない
const Page = isLogin ? lazy(() => import('./MemoPage')) : lazy(() => import('./LoginPage'))

// ✅ 正しい（先に定義）
const MemoPage = lazy(() => import('./MemoPage'))
const LoginPage = lazy(() => import('./LoginPage'))

const Page = isLogin ? MemoPage : LoginPage
```

---

## LoadingSpinner コンポーネント

### src/components/LoadingSpinner.tsx

このプロジェクトでは、読み込み中に表示する共通コンポーネントを作成しています。

```typescript
/**
 * ローディングスピナーコンポーネント
 *
 * アプリ内の全てのローディング状態で使用する統一されたスピナーです。
 * - React.lazy の Suspense fallback
 * - データ読み込み中
 * - アカウント削除処理中
 */

import React from 'react'
import '../styles/LoadingSpinner.css'

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
    </div>
  )
}

export default LoadingSpinner
```

このスピナーを使うことで、アプリ全体で統一されたローディング体験を提供できます。

---

## まとめ

### React.lazyとは

- **必要な時だけコンポーネントを読み込む機能**
- ページごとにファイルを分割できる
- 初期ロード速度が向上

### 使い方

```javascript
// 1. lazyをimport
import { lazy, Suspense } from 'react'

// 2. コンポーネントをlazyで読み込む
const LoginPage = lazy(() => import('./pages/LoginPage'))

// 3. Suspenseで囲む
<Suspense fallback={<LoadingSpinner />}>
  <LoginPage />
</Suspense>
```

### Suspenseの役割

- 読み込み中に表示する内容を指定
- `fallback` プロパティで読み込み中のコンポーネントを指定

### チャンク分割との違い

| 技術 | 目的 | 対象 |
|------|------|------|
| **React.lazy** | ページごとに分割 | あなたが書いたページコンポーネント |
| **manualChunks** | ライブラリごとに分割 | React、Firebaseなどの外部ライブラリ |

**両方を組み合わせることで、最大のパフォーマンス向上を実現！**

---

## 参考資料

- [React公式ドキュメント - React.lazy](https://react.dev/reference/react/lazy)
- [React公式ドキュメント - Suspense](https://react.dev/reference/react/Suspense)
- [Code-Splitting（コード分割）](https://react.dev/learn/code-splitting-with-react-lazy)

---

**作成日**: 2026-02-23
**関連ファイル**: `src/App.tsx`, `src/components/LoadingSpinner.tsx`
**関連最適化**: チャンク分割（`doc/chunk-splitting-guide.md`）
