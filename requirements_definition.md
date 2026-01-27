# メモアプリ 要件定義書

**作成日**: 2025年1月26日  
**バージョン**: 1.0

---

## 1. プロジェクト概要

### 1.1 アプリ名
**ちょいMEMO**（英語表記: ChoiMEMO）

### 1.2 アプリ表記一覧

| 用途 | 表記 |
|------|------|
| 日本語ストア | ちょいMEMO |
| 英語ストア | ChoiMEMO |
| URL / アプリID | choimemo |
| ドメイン | choimemo.app |

### 1.2 目的
シンプルで直感的なメモアプリを開発し、将来的にアプリストアでの販売を目指す。

### 1.3 ターゲットユーザー
- シンプルなメモ機能を求めるスマートフォンユーザー
- 素早くメモを取りたい人
- 複雑な機能を必要としない人

---

## 2. 技術スタック

| 領域 | 技術 | 選定理由 |
|------|------|----------|
| フロントエンド | React | 状態管理が容易、スワイプ操作ライブラリが豊富 |
| 認証 | Firebase Authentication | 無料枠が充実、実装が簡単 |
| データベース | Firebase Firestore | リアルタイム同期、オフライン対応可能 |
| ストレージ | Firebase Cloud Storage | 画像・ファイル保存用、5GB無料 |
| デプロイ | Vercel | GitHub連携で自動デプロイ、無料枠が充実 |

### 2.1 Firebase選定理由

- **非アクティブでもサービス停止しない**（Supabaseは7日で停止）
- 認証・データベース・ストレージが一体化
- 日本語ドキュメントが豊富
- 無料枠で開発〜小規模運用が可能

### 2.2 Vercel選定理由

- **GitHub連携で自動デプロイ**（git pushするだけ）
- 無料枠が十分（帯域幅100GB/月）
- 世界中にCDNあり（高速表示）
- カスタムドメイン無料
- SSL証明書自動発行（HTTPS対応）
- 商用利用可能

---

## 3. 機能要件

### 3.1 認証機能

| 機能 | 詳細 |
|------|------|
| アカウント作成 | ユーザー名（メールアドレス）とパスワードで登録 |
| ログイン | メールアドレスとパスワードで認証 |
| ログアウト | セッション終了 |
| ログイン状態維持 | 自動でログイン状態を保持 |

### 3.2 メモ機能

| 機能 | 詳細 |
|------|------|
| メモ作成 | テキスト入力でメモを作成 |
| 自動保存 | 文字入力確定後、自動で保存（デバウンス処理：500ms〜1秒） |
| メモ更新 | 既存メモの編集・更新 |
| メモ削除 | 不要なメモの削除 |
| ファイル添付 | 画像・ファイルをメモに添付可能（将来対応） |

### 3.3 ナビゲーション

| 操作 | 動作 |
|------|------|
| アプリ起動 | 新規メモ作成ページを表示 |
| 右→左スワイプ | 過去のメモ（1つ前）を表示 |
| 左→右スワイプ | 新しいメモ（1つ先）を表示 |

---

## 4. 画面構成

### 4.1 ページ一覧

| ページ | パス | 説明 |
|--------|------|------|
| アカウント作成 | `/signup` | 新規ユーザー登録 |
| ログイン | `/login` | 既存ユーザーログイン |
| メモ編集 | `/` | メイン画面（メモ作成・編集） |

### 4.2 画面遷移図

```
[アプリ起動]
    │
    ├─ 未ログイン ──→ [ログインページ]
    │                      │
    │                      ├─ ログイン成功 ──→ [メモページ]
    │                      │
    │                      └─ アカウント作成 ──→ [アカウント作成ページ]
    │                                                │
    │                                                └─ 登録成功 ──→ [メモページ]
    │
    └─ ログイン済み ──→ [メモページ]
                            │
                            ├─ スワイプ ──→ 過去メモ表示
                            │
                            └─ ログアウト ──→ [ログインページ]
```

---

## 5. データモデル

### 5.1 Firestore コレクション構成

```
users/
└── {userId}/
    └── memos/
        └── {memoId}/
            ├── content: string        // メモ本文
            ├── imageUrls: string[]    // 添付画像URL（将来対応）
            ├── created_at: timestamp  // 作成日時
            └── updated_at: timestamp  // 更新日時
```

### 5.2 Cloud Storage 構成

```
users/
└── {userId}/
    └── memos/
        └── {memoId}/
            ├── image1.jpg
            ├── image2.png
            └── ...
```

---

## 6. 非機能要件

### 6.1 パフォーマンス

| 項目 | 要件 |
|------|------|
| 自動保存 | デバウンス処理（500ms〜1秒）で無駄なAPI呼び出しを防止 |
| スワイプ操作 | 滑らかなアニメーション（60fps目標） |

### 6.2 セキュリティ

| 項目 | 要件 |
|------|------|
| 認証 | Firebase Authentication によるセキュアな認証 |
| データアクセス | Firestore Security Rules でユーザー自身のデータのみアクセス可能 |
| 通信 | HTTPS による暗号化通信 |

#### 6.2.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ユーザーのメモ
    match /users/{userId}/memos/{memoId} {
      // 読み取り：ログイン済み & 自分のデータのみ
      allow read: if request.auth != null 
                  && request.auth.uid == userId;
      
      // 作成：ログイン済み & 自分のデータのみ & データ検証
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 10000;
      
      // 更新：ログイン済み & 自分のデータのみ & データ検証
      allow update: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.content is string
                    && request.resource.data.content.size() <= 10000;
      
      // 削除：ログイン済み & 自分のデータのみ
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
  }
}
```

#### 6.2.2 Cloud Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/memos/{memoId}/{fileName} {
      // 読み書き：ログイン済み & 自分のデータのみ & 5MB制限
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId
                         && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

#### 6.2.3 セキュリティ検証項目

| 検証 | 目的 |
|------|------|
| `request.auth != null` | ログイン必須 |
| `request.auth.uid == userId` | 自分のデータのみアクセス可能 |
| `content is string` | データ型の検証 |
| `content.size() <= 10000` | メモ最大10,000文字制限 |
| `request.resource.size < 5MB` | ファイルサイズ制限 |

#### 6.2.4 CSR + Firebase のセキュリティ構造

```
[ブラウザ] → [Firebase SDK] → [Security Rules] → [Firestore/Storage]
                                     ↑
                              ここでアクセス制御
```

**注意**: Firebase の設定（apiKey等）はブラウザで公開されるが、Security Rules により不正アクセスは防止される。

### 6.3 可用性

| 項目 | 要件 |
|------|------|
| サービス稼働 | Firebase の SLA に準拠（99.95%） |
| オフライン対応 | Firestore のオフライン機能で対応（将来検討） |

---

## 7. Firebase 無料枠と制限

### 7.1 Authentication

| 項目 | 無料枠 |
|------|--------|
| ユーザー数 | 無制限 |
| MAU 5万超過時 | $0.0055/MAU |

### 7.2 Firestore

| 項目 | 無料枠 |
|------|--------|
| ストレージ | 1GB |
| 読み取り | 50,000回/日 |
| 書き込み | 20,000回/日 |
| 削除 | 20,000回/日 |

### 7.3 Cloud Storage

| 項目 | 無料枠 |
|------|--------|
| ストレージ | 5GB |
| ダウンロード | 1GB/日 |
| アップロード | 1GB/日 |

### 7.4 Vercel（ホスティング）

| 項目 | 無料枠 |
|------|--------|
| 帯域幅 | 100GB/月 |
| ビルド時間 | 6,000分/月 |
| デプロイ数 | 無制限 |
| カスタムドメイン | 無料 |
| SSL証明書 | 自動発行 |

### 7.5 無料枠での運用目安

- 個人利用〜数百ユーザー程度は無料で運用可能
- ユーザー1万人超で月額 $50〜100 程度を想定

---

## 8. 将来の拡張予定

### 8.1 Phase 2（収益化後）

- [ ] 画像・ファイル添付機能
- [ ] Apple ID ログイン（App Store 要件）
- [ ] Google アカウントログイン
- [ ] オフライン対応

### 8.2 Phase 3

- [ ] メモ検索機能
- [ ] タグ・カテゴリ機能
- [ ] メモ共有機能

### 8.3 Phase 4（大規模化時：Firebase → Supabase 移行）

ユーザー数が1万人を超え、コスト予測が重要になった場合、Supabase への移行を検討する。

#### 8.3.1 移行対象

| 項目 | Firebase | Supabase | 移行難易度 |
|------|----------|----------|-----------|
| 認証 | Firebase Auth | Supabase Auth | ⚠️ やや面倒 |
| データベース | Firestore (NoSQL) | PostgreSQL (SQL) | ○ 変換必要 |
| ストレージ | Cloud Storage | Supabase Storage | ○ コピー可能 |

#### 8.3.2 認証データの移行

Firebase Auth のパスワードはハッシュ化されているため、以下のいずれかで対応：

| 方法 | 内容 | ユーザー影響 |
|------|------|-------------|
| 方法1 | パスワードリセットを強制 | 再設定が必要 |
| 方法2 | ハッシュごとエクスポート＆インポート | 影響なし（複雑） |
| 方法3 | 新規登録を促す | 再登録が必要 |

#### 8.3.3 データベースの移行（データ構造変換）

```
Firestore（階層構造）:
users/{userId}/memos/{memoId}
├── content
├── created_at
└── updated_at

↓ 変換 ↓

Supabase PostgreSQL（テーブル構造）:
memos テーブル
┌─────────┬─────────┬─────────┬────────────┬────────────┐
│ id      │ user_id │ content │ created_at │ updated_at │
└─────────┴─────────┴─────────┴────────────┴────────────┘
```

#### 8.3.4 移行スクリプト例

```javascript
// 1. Firestore からエクスポート
const users = await getDocs(collection(db, 'users'));
const allMemos = [];

for (const user of users.docs) {
  const memos = await getDocs(collection(db, `users/${user.id}/memos`));
  memos.forEach(memo => {
    allMemos.push({
      id: memo.id,
      user_id: user.id,
      content: memo.data().content,
      created_at: memo.data().created_at,
      updated_at: memo.data().updated_at
    });
  });
}

// 2. Supabase にインポート
await supabase.from('memos').insert(allMemos);
```

#### 8.3.5 移行コスト目安

| ユーザー規模 | 作業時間目安 |
|-------------|-------------|
| 〜100人 | 1〜2日 |
| 〜1,000人 | 3〜5日 |
| 10,000人以上 | 1〜2週間 |

#### 8.3.6 移行を楽にするための設計方針

現段階から以下を意識して実装する：

```javascript
// Firebase SDK をラップして抽象化
// lib/database.js

export async function getMemos(userId) {
  // 現在は Firebase
  const snapshot = await getDocs(
    collection(db, `users/${userId}/memos`)
  );
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Supabase 移行時はここだけ変更
  // const { data } = await supabase
  //   .from('memos')
  //   .select('*')
  //   .eq('user_id', userId);
  // return data;
}

export async function createMemo(userId, content) {
  // 現在は Firebase
  return await addDoc(collection(db, `users/${userId}/memos`), {
    content,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  });
  
  // Supabase 移行時はここだけ変更
  // return await supabase.from('memos').insert({
  //   user_id: userId,
  //   content,
  //   created_at: new Date().toISOString(),
  //   updated_at: new Date().toISOString()
  // });
}
```

この抽象化により、移行時の変更箇所を最小限に抑えられる。

---

## 9. アプリストア公開時の注意点

### 9.1 Apple App Store

- **Apple でサインイン**の実装が必須（SNSログイン提供時）
- プライバシーポリシーの用意
- 年間 $99 のデベロッパー登録費用

### 9.2 Google Play Store

- 初回 $25 のデベロッパー登録費用
- プライバシーポリシーの用意

---

## 10. 開発スケジュール（参考）

| フェーズ | 内容 | 期間目安 |
|----------|------|----------|
| Phase 1 | 基本機能実装（認証・メモCRUD・スワイプ） | 2〜3週間 |
| Phase 2 | テスト・バグ修正 | 1週間 |
| Phase 3 | ストア申請準備 | 1週間 |

---

## 11. 承認

| 役割 | 氏名 | 日付 | 署名 |
|------|------|------|------|
| プロジェクトオーナー | | | |
| 開発者 | | | |

---

**以上**
