# Firebase APIキーの役割と仕組み

このドキュメントでは、Firebase設定で使用する各APIキーの役割と、セキュリティの考え方について説明します。

---

## 📋 目次

1. [各キーの役割](#各キーの役割)
2. [プロジェクト識別 vs アプリ識別](#プロジェクト識別-vs-アプリ識別)
3. [セキュリティについて](#セキュリティについて)
4. [実際の使われ方](#実際の使われ方)

---

## 各キーの役割

### 1. `VITE_FIREBASE_API_KEY`

**役割**: FirebaseサービスへのアクセスをGoogleが識別するためのキー

- **何をするもの？**: Googleのサーバーに「このリクエストはchoimemoプロジェクトからです」と伝える識別子
- **公開されても大丈夫？**: ✅ **はい、公開されても問題ありません**
  - ブラウザで動くアプリには必ず含まれるため、誰でも見れます
  - 実際のセキュリティはFirestore Security Rulesで制御します
- **形式**: `AIzaSy` で始まる39文字の文字列
- **例**: `AIzaSyBoulemK0TgiSxqAj3_9mR4bvvNf3R_vto`

---

### 2. `VITE_FIREBASE_AUTH_DOMAIN`

**役割**: 認証（ログイン）時に使用するドメイン

- **何をするもの？**: ユーザーがログイン/サインアップする際にリダイレクトされるURL
- **どこで使われる？**:
  - メール/パスワードでのログイン
  - Google/Appleログイン時の認証画面表示
  - パスワードリセットメールのリンク先
- **形式**: `{project-id}.firebaseapp.com`
- **例**: `choimemo.firebaseapp.com`

---

### 3. `VITE_FIREBASE_PROJECT_ID`

**役割**: Firebaseプロジェクトを一意に識別するID

- **何をするもの？**: どのFirebaseプロジェクトにアクセスするかを指定
- **重要性**: このIDでFirestoreのデータベースやStorageのバケットが決まります
- **命名ルール**: プロジェクト作成時に決めた名前（後から変更不可）
- **例**: `choimemo`

**補足**:
- 同じPROJECT_IDなら、Web版/iOS版/Android版すべてで同じデータベースにアクセス
- 開発環境と本番環境を分けたい場合は、別のプロジェクト（別のPROJECT_ID）を作る

---

### 4. `VITE_FIREBASE_STORAGE_BUCKET`

**役割**: 画像やファイルを保存する場所（バケット）のアドレス

- **何をするもの？**: Cloud Storageにファイルをアップロード/ダウンロードする際の保存先
- **このアプリでの使い道**:
  - Phase 2で実装予定の画像添付機能で使用
  - ユーザーがメモに画像を添付した時の保存先
- **形式**: `{project-id}.appspot.com` または `{project-id}.firebasestorage.app`
- **例**: `choimemo.firebasestorage.app`

---

### 5. `VITE_FIREBASE_MESSAGING_SENDER_ID`

**役割**: プッシュ通知を送信する際の識別番号

- **何をするもの？**: Firebase Cloud Messaging (FCM) でプッシュ通知を送る時に使用
- **このアプリでの使い道**:
  - 現時点では使用しない予定
  - 将来的に「メモのリマインダー通知」などで使うかもしれない
- **形式**: 12桁の数字
- **例**: `575129595482`

---

### 6. `VITE_FIREBASE_APP_ID`

**役割**: Firebaseアプリ（Webアプリ）を一意に識別するID

- **何をするもの？**:
  - 1つのFirebaseプロジェクトに複数のアプリ（iOS、Android、Web）を登録できる
  - このIDでどのアプリかを識別
  - Firebase Analyticsでアプリごとのアクセス解析に使用
- **形式**: `1:{messaging-sender-id}:web:{ランダム文字列}`
- **例**: `1:575129595482:web:43a5f32d3b310c31e3f263`

---

## プロジェクト識別 vs アプリ識別

### 階層構造

```
Firebaseプロジェクト「choimemo」 ← PROJECT_ID で識別
  │
  ├── Webアプリ ← APP_ID で識別
  ├── iOSアプリ ← 別のAPP_ID
  └── Androidアプリ ← 別のAPP_ID

  共通リソース（すべてのアプリで共有）:
  ├── Firestore Database（データベース）
  ├── Authentication（ユーザー管理）
  └── Storage（ファイル保存）
```

### PROJECT_ID（プロジェクト識別）

**役割**: Firebaseプロジェクト全体を識別
**範囲**: すべてのアプリ（Web、iOS、Android）で共通

**例**:
- あなたが「ちょいMEMO」というサービスを作る
- Web版、iPhone版、Android版を作る予定
- これら全部で**同じデータベース**を使いたい
- → すべて**同じPROJECT_ID** (`choimemo`) を使う

**具体的な使われ方**:
```javascript
// Firestoreのパス
users/user123/memos/memo456
// ↑ これは PROJECT_ID "choimemo" のデータベースにアクセス

// Web版でもiOS版でも同じデータベースを見る
// = 同じPROJECT_IDだから
```

### APP_ID（アプリ識別）

**役割**: 個別のアプリ（Web、iOS、Androidなど）を識別
**範囲**: プラットフォームごとに別々

**例**:
- Web版の「ちょいMEMO」 → APP_ID: `1:575129595482:web:xxxxx`
- iOS版の「ちょいMEMO」 → APP_ID: `1:575129595482:ios:yyyyy`
- Android版の「ちょいMEMO」 → APP_ID: `1:575129595482:android:zzzzz`

**具体的な使われ方**:
```javascript
// Firebase Analytics（アクセス解析）で使われる
"今日のアクティブユーザー数"
  - Web版: 100人 ← APP_IDで識別
  - iOS版: 50人  ← 別のAPP_IDで識別
  - Android版: 30人 ← 別のAPP_IDで識別

// プラットフォーム別に統計を取れる
```

### なぜこういう設計になっているのか？

#### ケース1: 複数プラットフォームで同じサービスを提供

```
「ちょいMEMO」サービス
├── PROJECT_ID: choimemo（全体で共通）
│   ├── 共有データ: ユーザーのメモ
│   └── 共有認証: 同じアカウントでログイン
│
├── Web版（ブラウザ）
│   └── APP_ID: ...web:xxxxx
│
├── iOS版（iPhone/iPad）
│   └── APP_ID: ...ios:yyyyy
│
└── Android版（Androidスマホ）
    └── APP_ID: ...android:zzzzz
```

**メリット**:
- ✅ Web版でメモを書いて、iPhone版でも同じメモが見える
- ✅ でも、アクセス解析はプラットフォームごとに分けられる
- ✅ プッシュ通知もプラットフォームごとに設定できる

#### ケース2: 本番環境と開発環境を分ける

```
プロジェクト1: choimemo（本番環境）
  └── PROJECT_ID: choimemo
      └── APP_ID: ...web:xxxxx

プロジェクト2: choimemo-dev（開発環境）
  └── PROJECT_ID: choimemo-dev
      └── APP_ID: ...web:yyyyy
```

**メリット**:
- ✅ 開発中のバグで本番データを壊さない
- ✅ テスト用のデータと本番データを分離

---

## セキュリティについて

### ❓ これらのキーが漏れても大丈夫なの？

**答え: はい、大丈夫です！** ただし条件があります。

### ✅ 公開されても問題ない理由

#### 1. クライアントサイドアプリの仕組み

- ReactアプリはブラウザでJavaScriptとして実行されます
- つまり、誰でもブラウザの開発者ツールで見ることができます
- そのため、これらのキーを隠すことは不可能です

#### 2. 本当のセキュリティはFirestore Security Rules

```javascript
// 例: Firestoreのセキュリティルール
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザーは自分のメモだけアクセス可能
    match /users/{userId}/memos/{memoId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

このルールで：
- ✅ ログインしたユーザー本人のデータだけアクセス可能に制限
- ✅ APIキーを知っていても、他人のデータは読めません
- ✅ 未ログインユーザーは何もアクセスできません

### ⚠️ 注意が必要なこと

#### 1. Firestore Security Rulesを必ず設定する

- ❌ テストモードのまま放置すると、誰でもデータを読み書きできてしまう
- ⏰ テストモードは30日後に自動で無効化されますが、それまでは危険
- ✅ 本番リリース前に必ずSecurity Rulesを設定する

#### 2. Firebase Consoleでアクセス制限を設定

- ✅ Allowed domainsを設定して、特定のドメインからのみアクセス可能にする
- ✅ 不正利用による課金を防ぐ

---

## 実際の使われ方

### PROJECT_IDが使われる場面

```javascript
// Firestoreのデータにアクセス
import { getFirestore } from 'firebase/firestore'
import { db } from './lib/firebase'

const db = getFirestore(app)
// ↑ このdbは PROJECT_ID "choimemo" のデータベース

// どのアプリ（Web/iOS/Android）から使っても
// 同じデータベースにアクセスする
```

### APP_IDが使われる場面

```javascript
// Firebase Analytics（アクセス解析）
import { logEvent } from 'firebase/analytics'

logEvent(analytics, 'page_view')
// ↑ このイベントは APP_ID "...web:xxxxx" として記録

// Firebase Console で見ると：
// "Web版: 今日のページビュー 500回"
// "iOS版: 今日のページビュー 300回"
// のように分けて表示される
```

### 認証（Authentication）

```javascript
// ユーザー登録
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from './lib/firebase'

await createUserWithEmailAndPassword(auth, email, password)
// ↑ AUTH_DOMAINを使って認証画面を表示
```

### ストレージ（Storage）

```javascript
// 画像アップロード（Phase 2で実装予定）
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from './lib/firebase'

const imageRef = ref(storage, `users/${userId}/images/${fileName}`)
// ↑ STORAGE_BUCKETに保存される
await uploadBytes(imageRef, file)
```

---

## 📊 まとめ表

| キー | 役割 | 公開OK? | 重要度 | 使用場面 |
|------|------|---------|--------|----------|
| **API_KEY** | プロジェクト識別 | ✅ はい | ⭐⭐⭐ | すべてのFirebase操作 |
| **AUTH_DOMAIN** | 認証用URL | ✅ はい | ⭐⭐⭐ | ログイン・サインアップ |
| **PROJECT_ID** | プロジェクト名 | ✅ はい | ⭐⭐⭐ | データベース・ストレージ |
| **STORAGE_BUCKET** | ファイル保存先 | ✅ はい | ⭐⭐ | 画像・ファイルアップロード |
| **MESSAGING_SENDER_ID** | 通知用ID | ✅ はい | ⭐ | プッシュ通知 |
| **APP_ID** | アプリ識別 | ✅ はい | ⭐⭐ | アクセス解析・統計 |

### 重要ポイント

1. **これらのキーは公開されても問題ない**
   - クライアントサイドアプリでは隠すことが不可能
   - セキュリティはFirestore Security Rulesで確保

2. **PROJECT_IDとAPP_IDの違い**
   - PROJECT_ID: プロジェクト全体（データベース）を識別
   - APP_ID: 個別のアプリ（Web/iOS/Android）を識別

3. **セキュリティの要**
   - Firestore Security Rules を必ず設定
   - テストモードのまま本番運用しない
   - Allowed domainsを設定して不正利用を防ぐ

---

## 参考リンク

- [Firebase公式ドキュメント](https://firebase.google.com/docs)
- [Firestore Security Rules ガイド](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication ガイド](https://firebase.google.com/docs/auth)

---

**作成日**: 2026-02-07
**プロジェクト**: ちょいMEMO
