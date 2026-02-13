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

## デプロイ（ホスティング）

### Vercelを選んだ理由

このプロジェクトは **Vercel** にデプロイします。

**選定理由**:
1. **将来のSupabase移行を考慮** - SupabaseはVercelとの統合が非常に優れており、移行時の再ホスティングが不要
2. **GitHub自動連携** - `git push` すると自動的にデプロイされる
3. **プレビューデプロイ** - プルリクエストごとに自動でプレビューURL生成
4. **データベース非依存** - Firebase、Supabase、その他どのバックエンドにも対応可能

**比較**: Firebase Hostingも候補でしたが、Supabase移行後に別のホスティングサービスへ再移行が必要になるため、長期的な観点からVercelを選択しました。

### デプロイ手順

1. **Vercelアカウント作成** (https://vercel.com)
2. **GitHubリポジトリと連携**
3. **環境変数を設定** (Firebase設定値)
4. **自動デプロイ** - mainブランチへのpushで自動的にデプロイ

詳細な手順は後日追記予定。

## プロジェクト構造

```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/          # ページコンポーネント
├── lib/            # Firebase設定、データベース抽象化レイヤー
├── hooks/          # カスタムフック
├── contexts/       # React Context（認証状態管理など）
└── styles/         # スタイルファイル
```

## 詳細

詳しい情報は [CLAUDE.md](./CLAUDE.md) と [requirements_definition.md](./requirements_definition.md) を参照してください。
