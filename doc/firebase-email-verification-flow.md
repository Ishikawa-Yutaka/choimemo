# Firebase メール確認の仕組み（oobCode と mode）

## 全体の流れ

```
① アカウント作成
   createUserWithEmailAndPassword()
     ↓
② 確認メールを送信
   sendEmailVerification()
     ↓
③ Firebaseがメールを生成・送信
   リンクURL例:
   https://choimemo.vercel.app/__/auth/action?mode=verifyEmail&oobCode=ABC123xyz...
     ↓
④ ユーザーがリンクをクリック
     ↓
⑤ アプリの AuthActionPage に遷移
   URLから mode と oobCode を取得
     ↓
⑥ applyActionCode(auth, oobCode) を実行
   → FirebaseサーバーにoobCodeを送って検証
     ↓
⑦ Firebaseサーバーが確認
   ✅ 正しい → user.emailVerified = true
   ❌ 無効  → エラーを返す
     ↓
⑧ 「アカウントが作成されました！」を表示
```

---

## URLパラメータの説明

Firebaseが確認メールのリンクに自動で付けるパラメータ。

```
https://choimemo.vercel.app/__/auth/action?mode=verifyEmail&oobCode=ABC123xyz
                                            ↑               ↑
                                           mode           oobCode
```

### mode = 操作の種類

```
mode=verifyEmail   → メールアドレスの確認（アカウント作成完了）
mode=resetPassword → パスワードリセット
mode=recoverEmail  → メールアドレスの復元
```

アプリ側はこれを見て「何の処理をすべきか」を判断する。

### oobCode = ワンタイムコード

- **out-of-band code**（帯域外コード）の略
- Firebaseが発行する**1回限り有効なランダムな文字列**
- このコードを `applyActionCode()` に渡すとFirebaseサーバーが検証する

---

## Firebaseサーバーが oobCode を検証する内容

| チェック項目 | 無効になる条件 |
|------------|-------------|
| コードの存在 | でたらめな文字列を入力した場合 |
| 有効期限 | 発行から**24時間**以上経過 |
| 使用済み | すでに一度使われた |
| 対象ユーザー | 別のユーザーのコード |

---

## コードでの実装

### URLパラメータの取得（React Router）

```tsx
import { useSearchParams } from 'react-router-dom'

const [searchParams] = useSearchParams()

// URLから取得
const mode = searchParams.get('mode')       // 'verifyEmail'
const oobCode = searchParams.get('oobCode') // 'ABC123xyz...'
```

### applyActionCode() でメール確認を完了

```tsx
import { applyActionCode } from 'firebase/auth'
import { auth } from '../lib/firebase'

// oobCode をFirebaseサーバーに送って検証・確認完了
await applyActionCode(auth, oobCode)
// これでFirebase上の user.emailVerified が true になる
```

### エラーハンドリング

```tsx
try {
  await applyActionCode(auth, oobCode)
  // 成功
} catch (error) {
  switch (error.code) {
    case 'auth/expired-action-code':
      // リンクの有効期限切れ（24時間以上経過）
      break
    case 'auth/invalid-action-code':
      // リンクが使用済み or 無効
      break
  }
}
```

---

## Firebase Console の設定

確認メールのリンク先をアプリに変更する手順：

1. Firebase Console → Authentication → Templates
2. 「メールアドレスの確認」タブを選択
3. 鉛筆アイコン（編集）をクリック
4. **「操作 URL をカスタマイズ」** をクリック
5. `https://choimemo.vercel.app` を入力して保存

設定後のリンクURL：
```
https://choimemo.vercel.app/__/auth/action?mode=verifyEmail&oobCode=xxx
```

---

## なぜ安全か

oobCode は非常に長いランダムな文字列のため、推測・総当たりが事実上不可能。

```
例: ABCD1234efgh5678IJKL9012mnop3456...（数十文字のランダム文字列）
```

さらに：
- **24時間で期限切れ**になる
- **1回使ったら無効**になる
- **Firebaseサーバー側で検証**するので、クライアントで偽造できない
