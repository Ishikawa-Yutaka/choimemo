# Firebase Authentication エラーハンドリング完全ガイド

Firebase Authentication を使用する際のエラーハンドリングの仕組みと実装方法を解説します。

---

## 目次

1. [Firebase エラーコードの仕組み](#firebase-エラーコードの仕組み)
2. [エラーはどこで生成されるのか？](#エラーはどこで生成されるのか)
3. [主なエラーコード一覧](#主なエラーコード一覧)
4. [センシティブな操作と再認証](#センシティブな操作と再認証)
5. [実装例](#実装例)
6. [公式ドキュメント](#公式ドキュメント)

---

## Firebase エラーコードの仕組み

### エラーコードの形式

Firebase Authentication のエラーは、すべて `auth/` で始まる統一された形式です。

```
auth/email-already-in-use
auth/wrong-password
auth/requires-recent-login
```

### エラーオブジェクトの構造

```typescript
{
  code: 'auth/email-already-in-use',  // エラーコード
  message: 'The email address is...'  // 英語のエラーメッセージ
}
```

---

## エラーはどこで生成されるのか？

**重要：すべてのエラーコードは Firebase サーバー側で生成されます。**

### 処理の流れ

```
クライアント側
    ↓
  1. signInWithEmailAndPassword(auth, email, password) を呼び出し
    ↓
  2. Firebase SDK が Firebase サーバーにリクエスト送信
    ↓
Firebase サーバー側
    ↓
  3. メールアドレスとパスワードを検証
    ↓
  4. エラーを検知（例: パスワードが間違っている）
    ↓
  5. エラーコード 'auth/wrong-password' を生成
    ↓
クライアント側
    ↓
  6. Firebase SDK がエラーを受け取って throw
    ↓
  7. catch ブロックでエラーをキャッチ
```

### つまり

- ✅ エラーコードは **Firebase が定義・管理**
- ✅ エラーの判定は **Firebase サーバー側で実行**
- ✅ クライアント側は **受け取って処理するだけ**

---

## 主なエラーコード一覧

### メールアドレス関連

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/email-already-in-use` | メールアドレスが既に登録されている | Firebase サーバーがデータベースをチェック |
| `auth/invalid-email` | メールアドレスの形式が不正 | Firebase サーバーが形式を検証 |

**例：**
```typescript
try {
  await createUserWithEmailAndPassword(auth, 'test@example.com', 'password123')
} catch (error) {
  // Firebase サーバーが 'test@example.com' が既に存在すると判定
  // → error.code = 'auth/email-already-in-use'
}
```

---

### パスワード関連

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/weak-password` | パスワードが弱すぎる（6文字未満など） | Firebase サーバーが強度を検証 |
| `auth/wrong-password` | パスワードが間違っている | Firebase サーバーがハッシュを比較 |

**例：**
```typescript
try {
  await createUserWithEmailAndPassword(auth, 'test@example.com', '12345')
} catch (error) {
  // Firebase サーバーがパスワードの長さをチェック
  // → 6文字未満なので error.code = 'auth/weak-password'
}
```

---

### アカウント状態関連

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/user-not-found` | ユーザーが存在しない | Firebase サーバーがデータベースをチェック |
| `auth/user-disabled` | アカウントが無効化されている | Firebase サーバーがアカウント状態を確認 |

---

### Google ログイン関連

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/popup-closed-by-user` | ユーザーがポップアップを閉じた | Firebase SDK がポップアップの状態を検知 |
| `auth/popup-blocked` | ブラウザがポップアップをブロック | Firebase SDK がブラウザの動作を検知 |
| `auth/account-exists-with-different-credential` | 同じメールで別の方法で登録済み | Firebase サーバーがデータベースをチェック |

---

### レート制限

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/too-many-requests` | 短時間に多数のリクエスト | Firebase サーバーがレート制限を検知 |

**例：**
- パスワードリセットメールを何度も送信
- ログイン試行を繰り返す
→ Firebase サーバーが「リクエストが多すぎる」と判定

---

### メール操作関連

| エラーコード | 発生タイミング | 判定場所 |
|------------|--------------|---------|
| `auth/expired-action-code` | メールリンクの有効期限切れ（24時間） | Firebase サーバーがタイムスタンプをチェック |
| `auth/invalid-action-code` | メールリンクが既に使用済みまたは無効 | Firebase サーバーがコードの状態を確認 |

---

## センシティブな操作と再認証

### `auth/requires-recent-login` エラー

**このエラーが発生する操作：**

1. アカウント削除（`deleteUser()`）
2. メールアドレス変更（`updateEmail()`）
3. パスワード変更（`updatePassword()`）

### なぜ発生するのか？

Firebase は**セキュリティ上重要な操作**を行う前に、ユーザーが最近ログインしたことを確認します。

**シナリオ例：**

```
09:00 - ユーザーがログイン
  ↓
  （数時間経過）
  ↓
17:00 - アカウント削除を実行
  ↓
Firebase サーバー:
「最後のログインから8時間経っているので、もう一度ログインしてください」
  ↓
error.code = 'auth/requires-recent-login'
```

### 時間制限

通常、**最後のログインから約5分**が経過すると、このエラーが発生します。

---

### 再認証の方法

Firebase 公式ドキュメントでは、`reauthenticateWithCredential()` を使って再認証することを推奨しています。

#### 実装例（メール/パスワード認証）

```typescript
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth'

const user = auth.currentUser

// 1. ユーザーにパスワードを入力してもらう
const password = prompt('パスワードを入力してください')

// 2. 認証情報を作成
const credential = EmailAuthProvider.credential(user.email, password)

// 3. 再認証を実行
try {
  await reauthenticateWithCredential(user, credential)

  // 4. 再認証成功後にアカウント削除
  await deleteUser(user)

  console.log('アカウントを削除しました')
} catch (error) {
  if (error.code === 'auth/wrong-password') {
    alert('パスワードが間違っています')
  }
}
```

#### 実装例（Google 認証）

```typescript
import {
  reauthenticateWithPopup,
  GoogleAuthProvider,
  deleteUser
} from 'firebase/auth'

const user = auth.currentUser
const provider = new GoogleAuthProvider()

try {
  // 1. Google で再認証
  await reauthenticateWithPopup(user, provider)

  // 2. 再認証成功後にアカウント削除
  await deleteUser(user)

  console.log('アカウントを削除しました')
} catch (error) {
  console.error('再認証に失敗しました:', error)
}
```

---

### 簡易的な対処方法（現在の実装）

ちょいMEMO では、再認証フローを実装せず、エラー発生時にユーザーにログアウト→再ログインを促しています。

```typescript
try {
  await deleteUser(user)
} catch (error) {
  const err = error as FirebaseAuthError

  if (err.code === 'auth/requires-recent-login') {
    // 簡易的な対処：ユーザーに再ログインを促す
    alert(
      'セキュリティのため、アカウント削除には再ログインが必要です。\n\n' +
      '一度ログアウトして、再度ログインしてから削除してください。'
    )
  }
}
```

**メリット：**
- 実装がシンプル
- パスワード入力フォームを作らなくて済む

**デメリット：**
- ユーザーが一度ログアウトする必要がある
- UX がやや悪い

---

## 実装例

### エラーハンドラーの集約（現在の実装）

#### `lib/errorHandlers.ts`

```typescript
/**
 * Firebase Authentication のエラーコードを日本語メッセージに変換
 */
export const getAuthErrorMessage = (error: FirebaseAuthError): string => {
  const errorCode = error.code

  switch (errorCode) {
    // メールアドレス関連
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに登録されています。'

    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。'

    // パスワード関連
    case 'auth/weak-password':
      return 'パスワードが弱すぎます。もう少し複雑にしてください。'

    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // セキュリティのため、どちらも同じメッセージを返す
      return 'メールアドレスまたはパスワードが正しくありません。'

    // アカウント状態
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています。'

    // Google ログイン
    case 'auth/popup-closed-by-user':
      return 'ログインがキャンセルされました。'

    case 'auth/popup-blocked':
      return 'ポップアップがブロックされました。ブラウザの設定を確認してください。'

    // レート制限
    case 'auth/too-many-requests':
      return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。'

    // メール操作
    case 'auth/expired-action-code':
      return 'リンクの有効期限が切れています。再度メールを送信してください。'

    case 'auth/invalid-action-code':
      return 'リンクがすでに使用済みか、無効です。再度メールを送信してください。'

    // その他
    default:
      return '処理に失敗しました。時間をおいて再度お試しください。'
  }
}
```

### 使用例

#### SignupPage.tsx

```typescript
import { getAuthErrorMessage, type FirebaseAuthError } from '../lib/errorHandlers'

try {
  await createUserWithEmailAndPassword(auth, email, password)
} catch (error) {
  // Firebase のエラーを型安全に扱う
  const err = error as FirebaseAuthError

  // エラーコードを保存（開発用）
  setErrorCode(err.code ?? null)

  // 集約したエラーハンドラーで日本語メッセージを取得
  const message = getAuthErrorMessage(err)
  setErrorMessage(message)
}
```

---

## 公式ドキュメント

### Firebase Authentication エラーコード

Firebase 公式サイト → Authentication → Reference → Error Codes

すべてのエラーコードとその意味が一覧で記載されています。

### 再認証について

Firebase 公式サイト → Authentication → Manage Users → Re-authenticate a user

センシティブな操作を行う前の再認証方法が記載されています。

---

## まとめ

### 重要なポイント

1. **すべてのエラーコードは Firebase が生成する**
   - クライアント側はエラーを受け取って処理するだけ

2. **エラー判定は Firebase サーバー側で行われる**
   - メールアドレスの重複チェック
   - パスワードの強度検証
   - レート制限の検知
   - 最終ログイン時刻のチェック

3. **エラーハンドラーの役割**
   - Firebase のエラーコードを受け取る
   - ユーザーフレンドリーな日本語メッセージに変換
   - 一貫性のあるエラー表示を実現

4. **センシティブな操作には再認証が必要**
   - `deleteUser()`, `updateEmail()`, `updatePassword()`
   - `auth/requires-recent-login` エラーが発生する可能性
   - 再認証フローの実装が推奨される

5. **エラーハンドリングを集約するメリット**
   - メッセージの一貫性を保つ
   - 保守性が向上
   - 変更が容易になる

---

## Supabase のエラーハンドリング（移行時の参考）

### Firebase と Supabase の違い

Firebase も Supabase も**エラーはサーバー側で生成される**という基本的な仕組みは同じですが、エラーの形式が異なります。

---

### エラーコードの形式の違い

#### Firebase のエラー形式

```typescript
{
  code: 'auth/email-already-in-use',
  message: 'The email address is already in use...'
}
```

- `error.code` でエラーを判定
- `auth/xxx` という統一された形式

#### Supabase のエラー形式

```typescript
{
  status: 422,
  message: 'User already registered',
  __isAuthError: true
}
```

- `error.status`（HTTP ステータスコード）と `error.message` で判定
- 標準的な HTTP ステータスコードを使用

---

### 実装の比較

#### Firebase のサインアップ

```typescript
import { auth } from './firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

try {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    'test@example.com',
    'password123'
  )

  // 成功時
  console.log(userCredential.user)
} catch (error) {
  // Firebase はエラーを throw する
  console.log(error.code)     // 'auth/email-already-in-use'
  console.log(error.message)  // 'The email address is...'
}
```

#### Supabase のサインアップ

```typescript
import { supabase } from './supabase'

try {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'password123'
  })

  if (error) {
    // Supabase はエラーを throw せず、error オブジェクトとして返す
    console.log(error.status)   // 422
    console.log(error.message)  // 'User already registered'
    throw error
  }

  // 成功時
  console.log(data.user)
} catch (error) {
  // エラー処理
  handleSupabaseError(error)
}
```

**重要な違い：**
- Firebase: エラーを **throw** する
- Supabase: エラーを **戻り値** として返す（`{ data, error }` パターン）

---

### Supabase のエラーハンドラー実装例

```typescript
// lib/supabaseErrorHandlers.ts

/**
 * Supabase Authentication エラーの型定義
 */
export interface SupabaseAuthError {
  status?: number
  message?: string
  __isAuthError?: boolean
}

/**
 * Supabase のエラーを日本語メッセージに変換
 */
export const getSupabaseAuthErrorMessage = (error: SupabaseAuthError): string => {
  const status = error.status
  const message = error.message?.toLowerCase() || ''

  // ステータスコード 422: Unprocessable Entity
  if (status === 422) {
    if (message.includes('already registered')) {
      return 'このメールアドレスはすでに登録されています。'
    }
  }

  // ステータスコード 400: Bad Request
  if (status === 400) {
    if (message.includes('invalid login credentials')) {
      return 'メールアドレスまたはパスワードが正しくありません。'
    }
    if (message.includes('email not confirmed')) {
      return 'メールアドレスが確認されていません。確認メールをご確認ください。'
    }
  }

  // パスワード関連
  if (message.includes('password should be at least')) {
    return 'パスワードは6文字以上で入力してください。'
  }

  // レート制限: 429 Too Many Requests
  if (status === 429) {
    return 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。'
  }

  // デフォルトメッセージ
  return '処理に失敗しました。時間をおいて再度お試しください。'
}
```

---

### Supabase の主なエラーステータス

| ステータスコード | 意味 | 例 |
|----------------|------|-----|
| `400` | Bad Request | 認証情報が間違っている、メールが確認されていない |
| `422` | Unprocessable Entity | メールアドレスが既に登録されている |
| `429` | Too Many Requests | レート制限に引っかかった |
| `500` | Internal Server Error | サーバー側のエラー |

---

### 移行時の変更点

ちょいMEMO を Supabase に移行する場合、**`lib/errorHandlers.ts` を書き換えるだけ**で対応可能です。

#### Before (Firebase)

```typescript
// lib/errorHandlers.ts
export const getAuthErrorMessage = (error: FirebaseAuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'このメールアドレスはすでに登録されています。'

    case 'auth/wrong-password':
      return 'メールアドレスまたはパスワードが正しくありません。'

    // ...他のエラー
  }
}
```

#### After (Supabase)

```typescript
// lib/errorHandlers.ts
export const getAuthErrorMessage = (error: SupabaseAuthError): string => {
  const status = error.status
  const message = error.message?.toLowerCase() || ''

  if (status === 422 && message.includes('already registered')) {
    return 'このメールアドレスはすでに登録されています。'
  }

  if (status === 400 && message.includes('invalid login credentials')) {
    return 'メールアドレスまたはパスワードが正しくありません。'
  }

  // ...他のエラー
}
```

---

### 移行のメリット：抽象化レイヤーの恩恵

**重要：コンポーネント側のコードは変更不要**

```typescript
// SignupPage.tsx（変更なし！）
import { getAuthErrorMessage } from '../lib/errorHandlers'

try {
  // ここだけ database.ts 内で変更（Firebase → Supabase）
  await signup(email, password)
} catch (error) {
  // エラーハンドリングはそのまま
  const message = getAuthErrorMessage(error)
  setErrorMessage(message)
}
```

**変更が必要なファイル：**
- ✅ `lib/database.ts` - Firebase SDK → Supabase SDK に書き換え
- ✅ `lib/errorHandlers.ts` - エラー判定ロジックを書き換え

**変更不要なファイル：**
- ❌ `SignupPage.tsx`
- ❌ `LoginPage.tsx`
- ❌ `MemoPage.tsx`
- ❌ その他すべてのコンポーネント

これが**データベース抽象化レイヤー**（`CLAUDE.md` で推奨）の大きなメリットです！

---

### Firebase vs Supabase の共通点と違い

#### 共通点

✅ **エラーはサーバー側で生成される**
✅ **クライアント側で日本語に変換する**
✅ **集約したエラーハンドラーで処理する**

#### 違い

| 項目 | Firebase | Supabase |
|------|----------|----------|
| エラー判定方法 | `error.code` | `error.status` + `error.message` |
| エラー形式 | `'auth/email-already-in-use'` | `status=422, message='User already registered'` |
| エラーの返し方 | throw する | `{ data, error }` で返す |
| 移行の難易度 | - | 抽象化レイヤーがあれば容易 |

---

## 参考資料

### Firebase

- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [Firebase エラーコード一覧](https://firebase.google.com/docs/reference/js/auth)
- [Re-authenticate a user](https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user)

### Supabase

- [Supabase Authentication ドキュメント](https://supabase.com/docs/guides/auth)
- [Supabase Auth エラーハンドリング](https://supabase.com/docs/reference/javascript/auth-error)
- [Supabase と Firebase の比較](https://supabase.com/alternatives/supabase-vs-firebase)
