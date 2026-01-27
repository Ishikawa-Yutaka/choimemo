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

1. Firebaseコンソールでプロジェクトを作成
2. `.env.local`ファイルを作成し、Firebase設定を追加:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
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
