# Firebase Cloud Functions 完全ガイド

このドキュメントでは、Firebase Cloud Functionsについて、初心者向けに詳しく解説します。

## 目次
1. [Cloud Functionsとは](#cloud-functionsとは)
2. [クライアント側との違い](#クライアント側との違い)
3. [Cloud Functionsの使い道](#cloud-functionsの使い道)
4. [メリットとデメリット](#メリットとデメリット)
5. [実装例](#実装例)
6. [このプロジェクトでの活用](#このプロジェクトでの活用)

---

## Cloud Functionsとは

### 基本的な定義

**Cloud Functions = サーバー側で自動的に実行されるプログラム**

あなたのアプリ（クライアント）ではなく、**Googleのサーバー上で動くコード**です。

### 例え話

```
普通のコード（クライアント側）:
┌─────────────────┐
│ あなたのPC/スマホ │
│ で実行される      │
└─────────────────┘
→ ユーザーが操作しないと動かない

Cloud Functions（サーバー側）:
┌─────────────────┐
│ Googleのサーバー  │
│ で実行される      │
└─────────────────┘
→ 特定のイベントが起きたら自動的に動く
```

### 実行の流れ

```
ユーザーの操作
   ↓
Firebaseにイベント発生（例: アカウント削除）
   ↓
【Cloud Functionsが自動的に起動】← ここがポイント
   ↓
サーバー側で処理を実行
   ↓
完了
```

---

## クライアント側との違い

### 比較表

| 項目 | クライアント側 | Cloud Functions（サーバー側） |
|------|--------------|----------------------------|
| **実行場所** | ユーザーのPC/スマホ | Googleのサーバー |
| **実行タイミング** | ユーザーが操作したとき | イベント発生時に自動 |
| **信頼性** | ユーザーが途中で閉じると失敗 | 確実に実行される |
| **セキュリティ** | コードが見える（ブラウザの開発者ツールで確認可能） | コードが見えない（サーバー内部） |
| **設定** | 不要 | デプロイが必要 |
| **コスト** | 無料 | 使いすぎると課金 |
| **実行速度** | 速い（ユーザーのデバイスで即座に実行） | 少し遅い（サーバーとの通信が必要） |

### 図解: クライアント側の処理

```
ユーザーのPC/スマホ
┌─────────────────────┐
│ ボタンをクリック      │
│       ↓             │
│ JavaScriptが実行     │
│       ↓             │
│ Firestoreに保存      │
└─────────────────────┘
```

**問題点**:
- ユーザーがブラウザを閉じると処理が中断される
- コードが見えるのでセキュリティリスクがある

### 図解: Cloud Functionsの処理

```
ユーザーのPC/スマホ          Googleのサーバー
┌─────────────────┐         ┌──────────────────┐
│ ボタンをクリック  │         │                  │
│       ↓         │         │                  │
│ Firebaseに通知   │ ──────→ │ Cloud Functions  │
│                 │         │ が自動起動        │
│ ブラウザを閉じる │         │       ↓          │
│ （処理は続行）   │         │ 処理を実行        │
│                 │         │       ↓          │
│                 │         │ Firestoreに保存   │
└─────────────────┘         └──────────────────┘
```

**メリット**:
- ユーザーがブラウザを閉じても処理が続く
- コードが見えないのでセキュリティが高い

---

## Cloud Functionsの使い道

### 1. データの自動削除

**例**: ユーザーアカウント削除時に、関連データも削除

```javascript
// アカウント削除時に自動実行
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  // ユーザーのメモをすべて削除
  const memosRef = admin.firestore().collection(`users/${user.uid}/memos`);
  await memosRef.get().then(snapshot => {
    snapshot.docs.forEach(doc => doc.ref.delete());
  });
});
```

**実行タイミング**:
```
ユーザーがアカウント削除ボタンを押す
↓
Firebase Authenticationがアカウントを削除
↓
Cloud Functionsが自動起動
↓
ユーザーのメモをすべて削除
```

### 2. 通知の送信

**例**: 新しいメモが作成されたら、メール通知を送る

```javascript
exports.sendEmailOnNewMemo = functions.firestore
  .document('users/{userId}/memos/{memoId}')
  .onCreate(async (snapshot, context) => {
    const memoData = snapshot.data();
    const userId = context.params.userId;

    // メール送信処理
    await sendEmail(userId, 'New memo created', memoData.content);
  });
```

### 3. データの加工・集計

**例**: メモの文字数を自動的にカウント

```javascript
exports.countMemoCharacters = functions.firestore
  .document('users/{userId}/memos/{memoId}')
  .onWrite(async (change, context) => {
    const newData = change.after.data();
    const characterCount = newData.content.length;

    // 文字数を別のフィールドに保存
    await change.after.ref.update({ characterCount });
  });
```

### 4. 定期実行

**例**: 毎日0時に古いメモを削除

```javascript
exports.deleteOldMemos = functions.pubsub
  .schedule('0 0 * * *') // 毎日0時
  .onRun(async (context) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    // 1ヶ月以上古いメモを削除
    const oldMemos = await admin.firestore()
      .collectionGroup('memos')
      .where('created_at', '<', oneMonthAgo)
      .get();

    oldMemos.docs.forEach(doc => doc.ref.delete());
  });
```

### 5. セキュリティの強化

**例**: サーバー側でのみ実行可能な処理

```javascript
// クライアント側では実行できない処理
exports.adminOnlyFunction = functions.https.onCall(async (data, context) => {
  // 管理者チェック
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      '管理者のみ実行可能です'
    );
  }

  // 管理者のみが実行できる処理
  await deleteAllData();
});
```

---

## メリットとデメリット

### メリット

#### ✅ 1. 自動的に動く

```
従来の方法:
ユーザーがボタンを押す → 処理を実行 → 完了

Cloud Functions:
イベント発生 → 自動的に処理を実行 → 完了
```

ユーザーが何もしなくても、バックグラウンドで処理が実行されます。

#### ✅ 2. 安全

```
クライアント側:
ブラウザの開発者ツールで誰でもコードを見られる
→ セキュリティリスク

Cloud Functions:
サーバー内部のコードなので誰も見られない
→ 安全
```

#### ✅ 3. 確実

```
クライアント側:
ユーザーがブラウザを閉じる → 処理が中断される

Cloud Functions:
サーバー側で実行されるので、確実に完了する
```

#### ✅ 4. サーバーの管理が不要

従来のサーバー開発では、サーバーの管理（OSのアップデート、セキュリティ対策など）が必要でしたが、Cloud Functionsは**サーバーレス**なので、管理が不要です。

### デメリット

#### ❌ 1. 設定が必要

```bash
# Cloud Functionsのデプロイ手順
1. Firebase CLIをインストール
   npm install -g firebase-tools

2. プロジェクトを初期化
   firebase init functions

3. コードを書く
   vi functions/index.js

4. デプロイ
   firebase deploy --only functions
```

クライアント側のコードと違い、別途デプロイが必要です。

#### ❌ 2. 料金がかかる可能性

**無料枠**:
- 呼び出し回数: 200万回/月
- 実行時間: 40万GB秒/月
- アウトバウンドデータ転送: 5GB/月

**超過すると課金される**:
- 呼び出し: 100万回あたり $0.40
- 実行時間: 100万GB秒あたり $0.0000025

**このプロジェクトでは**:
- ユーザー数が少ない間は無料枠で十分
- 月間数千ユーザー程度なら問題なし

#### ❌ 3. デバッグが難しい

クライアント側のコードはブラウザの開発者ツールでデバッグできますが、Cloud Functionsはサーバー側で実行されるため、ログを確認する必要があります。

```bash
# ログを確認
firebase functions:log
```

#### ❌ 4. 実行が少し遅い

```
クライアント側: 即座に実行（0.1秒）
Cloud Functions: サーバーとの通信が必要（0.5秒〜数秒）
```

---

## 実装例

### 例1: アカウント削除時にメモを削除

#### ファイル構成

```
プロジェクトルート/
├── src/              # クライアント側のコード
├── functions/        # Cloud Functionsのコード
│   ├── index.js      # メインファイル
│   └── package.json  # 依存関係
└── firebase.json     # Firebase設定
```

#### functions/index.js

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin SDKを初期化
admin.initializeApp();

/**
 * ユーザーアカウント削除時に、そのユーザーのメモをすべて削除
 *
 * 実行タイミング: Firebase Authenticationでユーザーが削除されたとき
 */
exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  console.log(`ユーザー削除イベント発生: ${userId}`);

  try {
    // ユーザーのメモコレクションへの参照
    const memosRef = admin.firestore().collection(`users/${userId}/memos`);

    // すべてのメモを取得
    const snapshot = await memosRef.get();

    console.log(`削除するメモ数: ${snapshot.size}`);

    // バッチ処理で削除（一度に500件まで）
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // バッチを実行
    await batch.commit();

    console.log(`ユーザー ${userId} のメモをすべて削除しました`);

    return { success: true };
  } catch (error) {
    console.error('メモの削除に失敗しました:', error);
    throw error;
  }
});
```

#### デプロイ

```bash
# functions/ディレクトリに移動
cd functions

# 依存関係をインストール
npm install

# プロジェクトルートに戻る
cd ..

# Cloud Functionsをデプロイ
firebase deploy --only functions
```

#### 実行結果

```
ユーザーがアカウント削除ボタンを押す
↓
Firebase Authenticationがアカウントを削除
↓
Cloud Functions "deleteUserData" が自動起動
↓
ログ出力: "ユーザー削除イベント発生: user123"
↓
ログ出力: "削除するメモ数: 25"
↓
25件のメモを削除
↓
ログ出力: "ユーザー user123 のメモをすべて削除しました"
```

### 例2: メモ作成時に通知を送る

```javascript
/**
 * メモ作成時にコンソールにログを出力
 *
 * 実行タイミング: Firestoreに新しいメモが作成されたとき
 */
exports.onMemoCreated = functions.firestore
  .document('users/{userId}/memos/{memoId}')
  .onCreate(async (snapshot, context) => {
    // パラメータを取得
    const userId = context.params.userId;
    const memoId = context.params.memoId;

    // メモのデータを取得
    const memoData = snapshot.data();

    console.log(`新しいメモが作成されました`);
    console.log(`ユーザーID: ${userId}`);
    console.log(`メモID: ${memoId}`);
    console.log(`内容: ${memoData.content.substring(0, 50)}...`);

    // 将来的にメール送信などの処理を追加できる
    // await sendEmail(userId, 'New memo created');

    return { success: true };
  });
```

### 例3: メモ更新時に文字数をカウント

```javascript
/**
 * メモ更新時に文字数を自動的にカウント
 *
 * 実行タイミング: Firestoreのメモが作成または更新されたとき
 */
exports.countMemoCharacters = functions.firestore
  .document('users/{userId}/memos/{memoId}')
  .onWrite(async (change, context) => {
    // 削除イベントの場合はスキップ
    if (!change.after.exists) {
      return null;
    }

    const newData = change.after.data();
    const characterCount = newData.content.length;

    // 既に文字数が保存されている場合はスキップ
    if (newData.characterCount === characterCount) {
      return null;
    }

    // 文字数を保存
    await change.after.ref.update({
      characterCount: characterCount,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`メモの文字数を更新しました: ${characterCount}文字`);

    return { success: true };
  });
```

---

## このプロジェクトでの活用

### アカウント削除時のメモ削除

#### 現在の問題

```typescript
// src/pages/MemoPage.tsx（クライアント側）

const handleDeleteAccount = async () => {
  // 1. アカウントを削除
  await deleteUser(user);

  // 問題: メモはFirestoreに残ったまま
}
```

**問題点**:
- アカウントは削除されるが、メモは残る
- 孤児データ（orphaned data）が発生

#### Cloud Functionsを使った解決策

```javascript
// functions/index.js（サーバー側）

exports.deleteUserData = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  // ユーザーのメモをすべて削除
  const memosRef = admin.firestore().collection(`users/${userId}/memos`);
  const snapshot = await memosRef.get();

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
});
```

**実行の流れ**:
```
1. ユーザーが「アカウント削除」ボタンをクリック
   ↓
2. クライアント側: deleteUser(user) を実行
   ↓
3. Firebase Authenticationがアカウントを削除
   ↓
4. Cloud Functions "deleteUserData" が自動起動
   ↓
5. ユーザーのメモをすべて削除
   ↓
6. 完了（アカウントもメモも削除された）
```

### 将来的な活用例

#### 1. 画像の自動削除（Phase 2）

```javascript
exports.deleteUserImages = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  // ユーザーの画像をすべて削除
  const bucket = admin.storage().bucket();
  const files = await bucket.getFiles({ prefix: `users/${userId}/` });

  await Promise.all(files[0].map(file => file.delete()));
});
```

#### 2. 古いメモの自動削除

```javascript
exports.deleteOldMemos = functions.pubsub
  .schedule('0 0 * * *') // 毎日0時
  .onRun(async (context) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 6ヶ月以上更新されていないメモを削除
    const oldMemos = await admin.firestore()
      .collectionGroup('memos')
      .where('updated_at', '<', sixMonthsAgo)
      .get();

    const batch = admin.firestore().batch();
    oldMemos.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });
```

---

## まとめ

### Cloud Functionsの重要ポイント

| 項目 | 説明 |
|------|------|
| **実行場所** | Googleのサーバー（クライアントではない） |
| **実行タイミング** | イベント発生時に自動 |
| **主な用途** | データの自動削除、通知送信、定期実行 |
| **メリット** | 自動的、安全、確実 |
| **デメリット** | 設定が必要、料金がかかる可能性 |

### クライアント側 vs Cloud Functions

| 処理内容 | クライアント側 | Cloud Functions |
|---------|--------------|----------------|
| **ボタンのクリック処理** | ✅ 適している | ❌ 不要 |
| **データの表示** | ✅ 適している | ❌ 不要 |
| **アカウント削除時のデータ削除** | ❌ 不確実 | ✅ 適している |
| **定期実行（毎日0時など）** | ❌ 不可能 | ✅ 適している |
| **メール送信** | ❌ セキュリティリスク | ✅ 適している |

### このプロジェクトでの推奨

**現時点**:
- クライアント側でメモを削除してからアカウントを削除
- シンプルで実装が簡単

**将来的（Phase 2以降）**:
- Cloud Functionsを導入
- アカウント削除時に自動的にメモと画像を削除
- より安全で確実

---

## 参考リンク

- [Firebase公式ドキュメント - Cloud Functions](https://firebase.google.com/docs/functions?hl=ja)
- [Cloud Functions for Firebase の使ってみる](https://firebase.google.com/docs/functions/get-started?hl=ja)
- [トリガーの種類](https://firebase.google.com/docs/functions/firestore-events?hl=ja)
