# ちょいMEMO (ChoiMEMO)

シンプルで直感的なメモアプリ

## 技術スタック

- React 18
- TypeScript
- Vite
- Firebase (Authentication, Firestore, Cloud Storage)
- React Router
- Vercel (デプロイ)
- Vitest + React Testing Library (テスト)

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

# テスト
npm run test          # テストを監視モードで実行
npm run test:run      # テストを1回実行
npm run test:ui       # テストUIを起動
npm run test:coverage # カバレッジレポートを生成
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

### デプロイ状況

✅ **本番環境デプロイ済み**

- **URL**: https://choimemo.vercel.app （実際のURLに置き換え）
- **デプロイ日**: 2026-02-13
- **自動デプロイ**: mainブランチへのpush時に自動デプロイ

### Firestore Security Rules

✅ **セキュリティルールデプロイ済み**

- ログインしたユーザーは自分のメモだけアクセス可能
- 未ログインユーザーはデータにアクセス不可
- メモの文字数制限: 10,000文字

詳細は `doc/firestore-security-rules-deployment.md` を参照。

### アカウント削除機能

✅ **実装済み（クライアント側）**

- メニューからアカウント削除が可能
- アカウント削除時に、すべてのメモも削除される（クライアント側実装）
- 削除確認ダイアログあり
- セキュリティのため、最近ログインしていない場合は再ログインが必要

**将来の予定（Blazeプランアップグレード後）**:
- Cloud Functionsでサーバー側自動削除に移行
- より確実なデータ削除（70-80% → 99.9%）
- 準備済み: `functions/index.js` にCloud Functions実装済み

詳細は `doc/firebase-cloud-functions-guide.md` を参照。

## プロジェクト構造

```
src/
├── components/     # 再利用可能なコンポーネント
├── pages/          # ページコンポーネント
├── lib/            # Firebase設定、データベース抽象化レイヤー、ユーティリティ関数
├── hooks/          # カスタムフック
├── contexts/       # React Context（認証状態管理など）
├── test/           # テストのグローバル設定
└── styles/         # スタイルファイル

# テストファイルは対象ファイルと同じディレクトリに配置
# 例: src/lib/formatters.ts → src/lib/formatters.test.ts
```

## 開発進捗

### 完了済み機能

#### Phase 1: 基本機能

✅ **コア機能**
- ユーザー認証（メール/パスワード、Google認証）
- メール確認機能
- パスワードリセット機能
- メモの作成・編集・削除
- メモ一覧表示
- アカウント削除機能

✅ **コード品質・開発環境**（2026-02-20）
- TypeScript移行完了
- ESLint + Prettier導入
- コードスタイルガイドライン整備（CLAUDE.md）
- 初心者向けコメント規約の確立

✅ **UI/UX改善**（2026-02-20）
- メインページのデザイン実装
- CSS分離（ページコンポーネントのインラインスタイル → CSSファイル化）
  - 全ページでクラス名プレフィックス方式採用（login-*, signup-*, etc.）
  - 259行のコード削減を達成
- メニューにログイン中のメールアドレスを表示
- パスワード入力欄に表示/非表示切り替え機能追加
  - 再利用可能な `PasswordInput` コンポーネント作成
  - 目のアイコン（HiEye/HiEyeSlash）で視認性向上
- パスワードバリデーション強化
  - 6文字以上 + 英字必須 + 数字必須
- 全入力欄に適切なプレースホルダー追加

✅ **コードリファクタリング**（2026-02-22）
- エラーハンドラーの集約（`lib/errorHandlers.ts`）
  - Firebase認証エラーを一元管理
  - 15種類以上のエラーコードに日本語メッセージ対応
  - 6ファイルで重複していたエラー処理を削除
- 日付フォーマッターの集約（`lib/formatters.ts`）
  - 共通のフォーマット関数を作成
- TypeScript型安全性の向上
  - 全ての 'any' 型を削除
  - Timestamp, FirebaseAuthError の適切な型定義
- コードの重複削減：80行以上のコード削減を達成

✅ **コード品質改善**（2026-02-22）
- ESLint/Prettierによる自動フォーマット
  - 18ファイルを自動整形
  - プロジェクト全体でコードスタイル統一
  - 長いインポート文の複数行分割など

✅ **パフォーマンス最適化**（2026-02-22 〜 2026-02-23）
- ルートベースのコード分割実装
  - React.lazyによる全ページコンポーネントの遅延ロード
  - 初期バンドルサイズ削減：197 KB → 173.6 KB (gzip、約12%削減)
  - ページごとのチャンク分離（各1-12 KB）
  - 必要なページのみ動的ロード
- ローディングUXの統一
  - 共通のLoadingSpinnerコンポーネント作成
  - 全ローディング状態でスピナーアニメーション表示
  - 「読み込み中...」テキストを全て削除し、視覚的フィードバックに統一
- ライブラリのチャンク分割（2026-02-23）
  - vite.config.jsにmanualChunks設定を追加
  - 最大チャンクサイズ削減：664 KB → 249 KB (gzip、約62%削減)
  - ライブラリ別に分割：React、Firebase Auth、Firebase Firestore、Router、Vendor
  - キャッシュ効率の大幅向上（ライブラリコードの再ダウンロード不要）
  - 500KB超過警告の解消
- 未使用コード削減（2026-02-23）
  - Firebase Storage を遅延ロードに変更（Phase 2まで不要のため）
  - schemas チャンク (58 KB) の削除を実現
- React.memo / useCallback / useMemoによる再レンダリング最適化（2026-02-23）
  - コンポーネントのメモ化：Header、FloatingButton、NavigationArrows、MemoEditor
  - カスタムフックの関数メモ化：useMemoOperations、useMemoEditing
  - MemoPageの関数・値メモ化：全ハンドラー関数、日付計算
  - タイピング時の不要な再レンダリングを削減

✅ **テストインフラ構築とユニットテスト完了**（2026-02-24）
- Vitest + React Testing Library環境構築完了
  - jsdom環境でのブラウザAPI対応
  - カバレッジ設定（v8プロバイダー）
  - グローバルテスト設定とクリーンアップ処理
- **ユニットテスト作成完了（全123テスト）**
  - **Phase 1**: ユーティリティ関数（33テスト）
    - formatters.test.ts: 日付・テキストフォーマット（12テスト）
    - errorHandlers.test.ts: Firebase認証エラーハンドリング（21テスト）
  - **Phase 2**: カスタムフック（40テスト）
    - useMemoOperations.test.ts: メモ操作ロジック（10テスト）
    - useMemoEditing.test.ts: デバウンス付き自動保存（8テスト）
    - useSwipeNavigation.test.ts: スワイプナビゲーション（22テスト）
  - **Phase 3**: コンポーネント（50テスト）
    - LoadingSpinner.test.tsx: ローディング表示（6テスト）
    - Header.test.tsx: ヘッダーUI・インタラクション（13テスト）
    - FloatingButton.test.tsx: 新規作成ボタン（12テスト）
    - PasswordInput.test.tsx: パスワード入力・表示切替（19テスト）
- **テストカバレッジ: 99.37%**
  - 文（Statements）: 99.37%
  - 分岐（Branch）: 95.94%
  - 関数（Functions）: 100%
  - 行（Lines）: 99.31%
- テスト実行時間: 1.31s（高速）

✅ **デプロイ・セキュリティ**
- Vercelへのデプロイ完了
- Firestore Security Rulesの設定完了

✅ **セキュリティ監査完了**（2026-02-24）
- 包括的なセキュリティチェック実施
- Firebase Security Rules最適化（バリデーション強化）
- 環境変数・認証フロー・入力検証の確認完了
- HTTPS/依存関係の脆弱性チェック完了

### 今後の予定

#### Phase 2: 機能拡張（予定）
- 画像添付機能
- Apple/Google Sign-in（現在はGoogle認証のみ実装済み）
- オフライン対応
- **新規ユーザー向けオンボーディングツアー**（検討中・保留）

#### Phase 3: 高度な機能（予定）
- メモの検索機能
- タグ/カテゴリ機能
- メモの共有機能

#### Phase 4: スケーラビリティ（予定）
- Supabase移行（ユーザー数が10,000人を超えた場合）

## 詳細

詳しい情報は [CLAUDE.md](./CLAUDE.md) と [requirements_definition.md](./requirements_definition.md) を参照してください。
