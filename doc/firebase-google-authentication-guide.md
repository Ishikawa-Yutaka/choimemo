# Firebase Google認証 実装ガイド

このドキュメントでは、Firebase Authentication を使用した Google ソーシャルログインの実装手順を説明します。

## 目次

1. [Firebase Consoleでの設定](#firebase-consoleでの設定)
2. [コード実装](#コード実装)
3. [承認済みドメインの設定](#承認済みドメインの設定)
4. [トラブルシューティング](#トラブルシューティング)

---

## Firebase Consoleでの設定

### 1. Google認証プロバイダーを有効化

1. **Firebase Console を開く**
   - https://console.firebase.google.com/
   - 対象のプロジェクトを選択

2. **Authentication → Sign-in method に移動**
   - 左メニューの「Authentication」をクリック
   - 上部タブの「Sign-in method」をクリック

3. **Google を有効化**
   - プロバイダー一覧から「Google」を探してクリック
   - 「Enable（有効にする）」トグルをONにする
   - **プロジェクトのサポートメール**を選択（必須）
   - 「Save（保存）」をクリック

これで Firebase 側の Google 認証が有効になりました。

---

## コード実装

### 1. 必要なインポート

```typescript
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'
```

### 2. Google ログイン処理の実装

```typescript
const handleGoogleLogin = async () => {
  try {
    // Google 認証プロバイダーを作成
    const provider = new GoogleAuthProvider()

    // ポップアップで Google ログインを実行
    // ユーザーが Google アカウントを選択すると、Firebase に自動登録される
    const result = await signInWithPopup(auth, provider)

    // ログイン成功
    console.log('ログイン成功:', result.user)

    // メモページなどへ遷移
    navigate('/', { replace: true })
  } catch (error) {
    // エラー処理
    const err = error as any
    console.error('Google ログインエラー:', err.code, err.message)
  }
}
```

### 3. ボタンコンポーネントの例

```tsx
<button
  type="button"
  onClick={handleGoogleLogin}
  disabled={isLoading}
>
  {isLoading ? 'ログイン中...' : 'Google でログイン'}
</button>
```

### 4. エラーハンドリング

よくあるエラーコードと対処法：

```typescript
switch (err.code) {
  case 'auth/popup-closed-by-user':
    // ユーザーがポップアップを閉じた
    errorMessage = 'ログインがキャンセルされました。'
    break

  case 'auth/popup-blocked':
    // ブラウザがポップアップをブロックした
    errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。'
    break

  case 'auth/account-exists-with-different-credential':
    // 同じメールアドレスが既に別の方法で登録されている
    errorMessage = 'このメールアドレスは既に別の方法で登録されています。'
    break

  case 'auth/unauthorized-domain':
    // 承認済みドメインに追加されていない
    errorMessage = 'このドメインは許可されていません。Firebase Consoleで設定してください。'
    break

  default:
    errorMessage = 'Google ログインに失敗しました。時間をおいて再度お試しください。'
    break
}
```

---

## 承認済みドメインの設定

Google 認証を使用するドメインは、Firebase Console で承認する必要があります。

### 設定手順

1. **Firebase Console を開く**
   - https://console.firebase.google.com/
   - プロジェクトを選択

2. **Authentication → Settings に移動**
   - 左メニューの「Authentication」をクリック
   - 上部タブの「Settings」をクリック

3. **Authorized domains セクションを探す**
   - 下にスクロールして「Authorized domains」を見つける

4. **ドメインを追加**
   - 「Add domain」ボタンをクリック
   - ドメイン名を入力（プロトコルやパスは不要）

### 追加が必要なドメイン

#### 開発環境用
```
localhost
```

**注意**: ポート番号は通常不要ですが、エラーが出る場合は以下のように追加してください：
```
localhost:5173
localhost:5174
localhost:5175
```

#### 本番環境用（例: Vercel）
```
your-app.vercel.app
```

❌ **間違った例:**
```
https://your-app.vercel.app/
http://localhost:5173/
```

✅ **正しい例:**
```
your-app.vercel.app
localhost
```

### デフォルトで承認されているドメイン

以下のドメインは自動的に承認されています：
- `localhost`（通常）
- `127.0.0.1`（通常）
- `<project-id>.firebaseapp.com`
- `<project-id>.web.app`

---

## トラブルシューティング

### エラー: `auth/unauthorized-domain`

**症状:**
- Google ログインボタンをクリックするとエラーが表示される
- エラーメッセージ: "このドメインは許可されていません"

**原因:**
- 使用しているドメインが Firebase Console の「Authorized domains」に追加されていない

**解決方法:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. 使用しているドメインを追加
   - 開発環境: `localhost`
   - 本番環境: `your-app.vercel.app` など
3. ページをリロードして再試行

---

### ポップアップがブロックされる

**症状:**
- ボタンをクリックしても何も起きない
- ブラウザのアドレスバー付近に「ポップアップがブロックされました」というメッセージが表示される

**解決方法:**
1. ブラウザの設定でポップアップを許可
2. アドレスバーのアイコンをクリックして「このサイトではポップアップを常に許可する」を選択

---

### 同じメールアドレスで別の認証方法を使用している

**症状:**
- エラーコード: `auth/account-exists-with-different-credential`
- 例: example@gmail.com でメール/パスワード認証を使っているユーザーが Google 認証でログインしようとした

**解決方法:**
- ユーザーに既存の認証方法でログインしてもらう
- または、Firebase Console で「アカウントリンク」機能を有効にする

---

## 実装例（完全版）

```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface GoogleLoginButtonProps {
  onError?: (errorMessage: string, errorCode: string | null) => void
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onError }) => {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)

      // Google 認証プロバイダーを作成
      const provider = new GoogleAuthProvider()

      // ポップアップで Google ログインを実行
      await signInWithPopup(auth, provider)

      // ログイン成功したらメモページ（/）へ遷移
      navigate('/', { replace: true })
    } catch (error) {
      const err = error as any
      const errorCode = err.code ?? null
      let errorMessage = 'Google ログインに失敗しました。時間をおいて再度お試しください。'

      switch (err.code) {
        case 'auth/popup-closed-by-user':
          errorMessage = 'ログインがキャンセルされました。'
          break
        case 'auth/popup-blocked':
          errorMessage = 'ポップアップがブロックされました。ブラウザの設定を確認してください。'
          break
        case 'auth/account-exists-with-different-credential':
          errorMessage = 'このメールアドレスは既に別の方法で登録されています。'
          break
        case 'auth/unauthorized-domain':
          errorMessage = 'このドメインは許可されていません。Firebase Consoleで設定してください。'
          break
      }

      if (onError) {
        onError(errorMessage, errorCode)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
    >
      {isLoading ? 'ログイン中...' : 'Google でログイン'}
    </button>
  )
}

export default GoogleLoginButton
```

---

## 参考リンク

- [Firebase Authentication - Google](https://firebase.google.com/docs/auth/web/google-signin)
- [signInWithPopup API リファレンス](https://firebase.google.com/docs/reference/js/auth.md#signinwithpopup)
- [Firebase Console](https://console.firebase.google.com/)

---

## まとめ

Firebase での Google 認証実装の手順：

1. ✅ Firebase Console で Google 認証を有効化
2. ✅ 使用するドメインを「Authorized domains」に追加
3. ✅ `GoogleAuthProvider` と `signInWithPopup` を使ってコード実装
4. ✅ エラーハンドリングを追加
5. ✅ ログイン成功後の遷移処理を実装

これで Google ソーシャルログインが完成です！
