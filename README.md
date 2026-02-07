# ちょいMEMO (ChoiMEMO)

シンプルで直感的なメモアプリ

## 技術スタック

- React 18
- Vite
- Firebase (Authentication, Firestore, Cloud Storage)
- React Router
- Vercel (デプロイ)

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## Firebase設定

### プロジェクト情報

- **プロジェクトID**: choimemo
- **リージョン**: asia-northeast2 (Osaka)
- **設定完了日**: 2026-02-07

### 有効化済みサービス

- ✅ **Authentication**: メール/パスワード認証
- ✅ **Firestore Database**: ロケーション asia-northeast2
- ⏭️ **Storage**: Phase 2で設定予定（画像添付機能実装時）

### ローカル開発環境のセットアップ

1. `.env.local.example`を`.env.local`にコピー:
   ```bash
   cp .env.local.example .env.local
   ```

2. `.env.local`にFirebaseコンソールから取得した設定値を記入:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. 開発サーバーを再起動:
   ```bash
   npm run dev
   ```

## プロジェクト構造

```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/          # ページコンポーネント
├── lib/            # Firebase設定、データベース抽象化レイヤー
├── hooks/          # カスタムフック
└── styles/         # スタイルファイル
```

## 詳細

詳しい情報は [CLAUDE.md](./CLAUDE.md) と [requirements_definition.md](./requirements_definition.md) を参照してください。
