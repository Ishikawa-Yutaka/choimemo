# Firestore Security Rules のデプロイ手順

このドキュメントでは、Firestore Security Rules（セキュリティルール）をFirebaseにデプロイする方法を説明します。

## 目次
1. [Security Rulesとは](#security-rulesとは)
2. [なぜデプロイが必要か](#なぜデプロイが必要か)
3. [デプロイ手順](#デプロイ手順)
4. [ルールの確認方法](#ルールの確認方法)
5. [トラブルシューティング](#トラブルシューティング)
6. [セキュリティルールの解説](#セキュリティルールの解説)

---

## Security Rulesとは

**Firestore Security Rules = データベースへのアクセス権限を定義するルール**

### 役割
- 誰がデータを読めるか
- 誰がデータを書けるか
- どんな条件で許可するか

を定義します。

### 例

```javascript
// ❌ 危険な例（テストモード）
allow read, write: if true;
// → 誰でも全てのデータを読み書きできる

// ✅ 安全な例（本番用）
allow read, write: if request.auth.uid == userId;
// → ログインしたユーザーは自分のデータだけ読み書きできる
```

---

## なぜデプロイが必要か

### ローカルとクラウドの違い

```
あなたのPC（ローカル）          Firebase（クラウド）
┌─────────────────┐            ┌──────────────────┐
│ firestore.rules  │  デプロイ  │  Firestore DB     │
│ （ルール定義）    │  ───────→ │  （実際のDB）      │
└─────────────────┘            └──────────────────┘
```

**重要**: ローカルのファイルを編集しただけでは、Firebaseに反映されません！

### デプロイ前（危険）

- ❌ ローカルにルールファイルがあるだけ
- ❌ Firebaseはデフォルトのテストモード
- ❌ 誰でもデータにアクセスできる可能性がある

### デプロイ後（安全）

- ✅ ルールファイルがFirebaseに適用される
- ✅ ログインしたユーザーは自分のデータだけアクセス可能
- ✅ 他人のデータは保護される

---

## デプロイ手順

### 前提条件

- Node.js と npm がインストールされている
- Firebase CLI がインストールされている（`npm install -g firebase-tools`）
- Firebase プロジェクトが作成されている

### ステップ1: Firebase CLI にログイン

```bash
firebase login
```

**実行すると**:
1. ブラウザが開く
2. Googleアカウントでログイン
3. 「Firebase CLIにアクセスを許可しますか？」→ **許可**
4. ターミナルに戻って「Success!」と表示される

**質問が表示される場合**:
- **Enable Gemini in Firebase features?** → No
- **Allow Firebase to collect usage data?** → Yes（推奨）

### ステップ2: プロジェクトディレクトリに移動

```bash
cd /path/to/your/project
```

### ステップ3: Firestore を初期化

```bash
firebase init firestore
```

**質問と回答**:

1. **"Please select an option:"**
   - → **「Use an existing project」** を選択

2. **"Select a default Firebase project:"**
   - → 自分のプロジェクト（例: **「choimemo」**）を選択

3. **"What file should be used for Firestore Rules?"**
   - → **`firestore.rules`**（デフォルトのまま Enter）

4. **"File firestore.rules already exists. Do you want to overwrite it?"**
   - → **「No」** を選択（既存のファイルを使う）
   - ⚠️ **重要**: Yesを選ぶと、既存のルールが上書きされてしまいます！

5. **"What file should be used for Firestore indexes?"**
   - → **`firestore.indexes.json`**（デフォルトのまま Enter）

**成功すると**:
```
✔  Firebase initialization complete!
```

### ステップ4: Security Rules をデプロイ

```bash
firebase deploy --only firestore:rules
```

**実行すると**:
```
=== Deploying to 'your-project'...

i  deploying firestore
i  cloud.firestore: checking firestore.rules for compilation errors...
✔  cloud.firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!
```

**重要な行**:
- `✔ rules file firestore.rules compiled successfully` - ルールが正しい
- `✔ released rules firestore.rules to cloud.firestore` - デプロイ成功

---

## ルールの確認方法

### 方法1: Firebase Console で確認

1. https://console.firebase.google.com/ を開く
2. プロジェクトを選択
3. 左メニュー「Firestore Database」→「ルール」タブ
4. デプロイしたルールが表示されているか確認
5. **ページをリロード**（F5）して最新の状態を確認

### 方法2: ローカルファイルを確認

```bash
cat firestore.rules
```

デプロイされたルールは、このファイルと同じ内容になります。

---

## トラブルシューティング

### 問題1: ログインできない

**エラー**: `Error: Failed to list Firebase projects`

**解決方法**:
```bash
# 一度ログアウト
firebase logout

# 再度ログイン
firebase login
```

### 問題2: プロジェクトが表示されない

**解決方法**:
```bash
# プロジェクト一覧を確認
firebase projects:list
```

プロジェクトが表示されない場合：
- 正しいGoogleアカウントでログインしているか確認
- Firebase Consoleでプロジェクトが存在するか確認

### 問題3: デプロイ後もルールが古いまま

**原因**: ローカルのファイルが間違っている

**解決方法**:
1. `firestore.rules` ファイルを確認
2. 正しいルールに修正
3. 再度デプロイ: `firebase deploy --only firestore:rules`
4. Firebase Console でページをリロード

### 問題4: ルールのコンパイルエラー

**エラー例**:
```
✖ cloud.firestore: rules file firestore.rules has syntax errors
```

**解決方法**:
- `firestore.rules` の構文を確認
- 括弧 `{}` の対応を確認
- セミコロン `;` の位置を確認

---

## セキュリティルールの解説

### このプロジェクトのルール

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザーのメモコレクションへのアクセス制御
    match /users/{userId}/memos/{memoId} {
      // ログインしている かつ 自分のデータの場合のみ許可
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // メモ作成時のバリデーション
      allow create: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 10000;

      // メモ更新時のバリデーション
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 10000;
    }

    // その他すべてのパスへのアクセスを拒否
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 詳細解説

#### 1. 基本的なアクセス制御

```javascript
match /users/{userId}/memos/{memoId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**条件の分解**:
- `request.auth != null` - ログインしている（認証情報がある）
- `request.auth.uid == userId` - ユーザーIDが一致する（自分のデータ）
- `&&` - かつ（両方の条件が真）

**動作例**:

| 状況 | 条件1 | 条件2 | 結果 |
|------|-------|-------|------|
| 未ログイン | ❌ false | - | ❌ 拒否 |
| 他人のデータ | ✅ true | ❌ false | ❌ 拒否 |
| 自分のデータ | ✅ true | ✅ true | ✅ 許可 |

#### 2. メモ作成時のバリデーション

```javascript
allow create: if request.auth != null
              && request.auth.uid == userId
              && request.resource.data.content is string
              && request.resource.data.content.size() <= 10000;
```

**追加のチェック**:
- `request.resource.data.content is string` - contentが文字列型
- `request.resource.data.content.size() <= 10000` - 10,000文字以内

**これにより**:
- ✅ 不正なデータ型を防ぐ
- ✅ 大量のデータ保存を防ぐ
- ✅ Firestoreの無料枠を守る

#### 3. すべてのパスへのアクセス拒否

```javascript
match /{document=**} {
  allow read, write: if false;
}
```

**意味**:
- `{document=**}` - すべてのパス
- `if false` - 常に拒否

**これにより**:
- 明示的に許可されていないパスへのアクセスを全て拒否
- セキュリティの強化

---

## まとめ

### デプロイの流れ

```
1. Firebase CLIにログイン
   ↓
2. プロジェクトを初期化（firebase init firestore）
   ↓
3. ルールファイルを確認・編集
   ↓
4. デプロイ（firebase deploy --only firestore:rules）
   ↓
5. Firebase Consoleで確認
```

### 重要なポイント

| 項目 | 説明 |
|------|------|
| **デプロイは必須** | ローカルのファイルを編集しただけではFirebaseに反映されない |
| **上書き注意** | `firebase init` で既存のルールが消える場合がある |
| **確認は必ず** | Firebase Consoleでルールが正しく反映されているか確認 |
| **テストモード禁止** | 本番環境では必ず適切なルールを設定 |

### セキュリティのベストプラクティス

- ✅ ログイン必須にする
- ✅ ユーザーは自分のデータだけアクセス可能
- ✅ データ型と文字数を制限
- ✅ 定期的にルールを見直す

### 参考リンク

- [Firebase Security Rules 公式ドキュメント](https://firebase.google.com/docs/firestore/security/get-started?hl=ja)
- [ルールのテスト方法](https://firebase.google.com/docs/firestore/security/test-rules-emulator?hl=ja)
- [よくあるセキュリティパターン](https://firebase.google.com/docs/firestore/security/rules-structure?hl=ja)
