# チャンク分割 (Chunk Splitting) ガイド

## チャンクとは？

**チャンク (Chunk) = JavaScriptファイルの「かたまり」**

アプリをビルドすると、最終的に1つの大きなJavaScriptファイルになります。でも、それを**いくつかの小さなファイルに分割したもの**がチャンクです。

### 例え話：本の配達

```
【分割前】
📦 超巨大な本 (664 KB)
→ 配達に時間がかかる
→ 1ページだけ読みたくても全部届くのを待つ必要がある
→ 誤字を1つ直しただけでも、全部再配達

【分割後】
📕 第1章: React (158 KB)
📗 第2章: Firebase認証 (142 KB)
📘 第3章: Firestore (249 KB)
📙 第4章: その他 (157 KB)
📄 あなたの書いた部分 (6 KB)

→ 必要な章だけ先に読める
→ 複数の章を同時に配達できる（並列ダウンロード）
→ あなたが書いた部分だけ修正しても、他の章は再配達不要
```

---

## なぜチャンク分割が必要？

### 1. 初回ロードが速くなる

```javascript
// 分割前: 全部ダウンロード
index.js (664 KB) ⬇️ → 時間がかかる

// 分割後: 並列ダウンロード
react.js (158 KB)              ⬇️ ┐
firebase-auth.js (142 KB)      ⬇️ ├─ 同時にダウンロード！
firebase-firestore.js (249 KB) ⬇️ ┘
→ 速い！
```

### 2. キャッシュが効く

```
【あなたがコードを1行修正した時】

■ 分割前: 全部ダウンロードし直し 😢
index.js (664 KB) → 全部再ダウンロード

■ 分割後: 変更部分だけダウンロード 😊
✅ react.js (158 KB)              → キャッシュ使用（ダウンロード不要）
✅ firebase-auth.js (142 KB)      → キャッシュ使用
✅ firebase-firestore.js (249 KB) → キャッシュ使用
✅ vendor.js (157 KB)             → キャッシュ使用
⬇️ index.js (6 KB)                → これだけ再ダウンロード
```

### 3. Viteの警告が消える

```
分割前:
⚠️ Some chunks are larger than 500 kB after minification.

分割後:
✅ 警告なし！すべてのチャンクが500 KB以下
```

---

## 実際にやったこと

### ステップ1: `vite.config.js` に設定を追加

私たちは**設定（ルール）を書いただけ**です。ファイルは手動で作成していません。

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * manualChunks: ライブラリを手動で分割
         *
         * このルールに従って、Viteが自動的にファイルを分割してくれます
         */
        manualChunks(id) {
          // node_modules内のモジュールのみ処理
          if (id.includes('node_modules')) {
            // React関連
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react' // ← "react"という名前のチャンクに分けてね
            }

            // Firebase Auth関連（認証機能）
            if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
              return 'firebase-auth'
            }

            // Firebase Firestore関連（データベース）
            if (
              id.includes('firebase/firestore') ||
              id.includes('@firebase/firestore')
            ) {
              return 'firebase-firestore'
            }

            // Firebase Core（小さいので認証と一緒にする）
            if (id.includes('firebase/app') || id.includes('@firebase/app')) {
              return 'firebase-auth'
            }

            // React Router関連
            if (id.includes('react-router')) {
              return 'router'
            }

            // その他のライブラリ（react-icons、zodなど）
            return 'vendor'
          }
        },
      },
    },
  },
})
```

### ステップ2: ビルド実行

```bash
npm run build
```

Viteが上記のルールに従って、自動的にファイルを生成してくれます。

### ステップ3: 自動生成されるファイル

```
dist/assets/
├── react-CQAp5Ge0.js              (158 KB) ← Viteが自動生成！
├── firebase-auth-LTnKxeXD.js      (142 KB) ← Viteが自動生成！
├── firebase-firestore-BtqeJ3JY.js (249 KB) ← Viteが自動生成！
├── vendor-JUN64H-N.js             (157 KB) ← Viteが自動生成！
├── index-DtgTNvGb.js              (6 KB)   ← あなたのアプリコード
├── MemoPage-Dzll_6K_.js           (12 KB)  ← MemoPageのコード（React.lazy）
└── ...
```

---

## ビフォー・アフター

### 改善前

```
dist/assets/index-DqeAoBub.js     664.29 KB │ gzip: 173.53 kB
dist/assets/schemas-BEhaMpdo.js    58.62 kB │ gzip:  16.00 kB

⚠️ Some chunks are larger than 500 kB after minification.
```

### 改善後

```
dist/assets/firebase-firestore-BtqeJ3JY.js  248.95 kB │ gzip: 57.46 kB
dist/assets/react-CQAp5Ge0.js               158.47 kB │ gzip: 51.11 kB
dist/assets/vendor-JUN64H-N.js              157.09 kB │ gzip: 49.19 kB
dist/assets/firebase-auth-LTnKxeXD.js       141.83 kB │ gzip: 28.61 kB
dist/assets/MemoPage-Dzll_6K_.js             12.11 kB │ gzip:  4.04 kB
dist/assets/index-DtgTNvGb.js                 5.75 kB │ gzip:  2.65 kB

✅ 警告なし！
```

### 改善効果

| 項目 | 改善前 | 改善後 | 効果 |
|------|--------|--------|------|
| **最大チャンクサイズ** | 664 KB | 249 KB | **62%削減** |
| **500KB超過警告** | ⚠️ あり | ✅ なし | **解消** |
| **キャッシュ効率** | 悪い | 良い | **大幅向上** |
| **並列ダウンロード** | 不可 | 可能 | **高速化** |

---

## どうやって動いているのか？

### 1. ビルド時（開発者が `npm run build` を実行）

```
あなたのコード (src/)
    ↓
Vite がビルド
    ↓
vite.config.js のルールを見る
    ↓
「React は react.js に分けよう」
「Firebase は firebase-auth.js に分けよう」
    ↓
自動的にファイルを生成 (dist/)
```

### 2. ユーザーがアプリにアクセス時

```
ユーザーがブラウザでアプリを開く
    ↓
index.html が読み込まれる
    ↓
<script> タグで必要なチャンクを読み込む
    ↓
react.js, firebase-auth.js, index.js などを並列ダウンロード
    ↓
アプリが起動！
```

### 3. ページ遷移時（React.lazy で遅延ロード）

```
ユーザーが /login にアクセス
    ↓
LoginPage-BM_4dwEz.js だけをダウンロード
    ↓
ログインページ表示

ユーザーが / (メモページ) にアクセス
    ↓
MemoPage-Dzll_6K_.js だけをダウンロード
    ↓
メモページ表示
```

---

## 補足: 未使用コードの削減

### Firebase Storage の削除

Phase 2（画像添付機能）まで Firebase Storage は使わないので、一旦削除しました。

```typescript
// src/lib/firebase.ts

// 【削除前】
import { getStorage } from 'firebase/storage' // ← 約58 KB増える
export const storage = getStorage(app)

// 【削除後】コメントだけ残す
/**
 * Storage（ファイル保存）サービス
 * Phase 2 で画像添付機能を実装する際に使用します。
 *
 * パフォーマンス最適化のため、現在はコメントアウトしています。
 * 必要になった際に以下のコメントを解除してください：
 *
 * import { getStorage } from 'firebase/storage'
 * export const storage = getStorage(app)
 */
```

これにより、`schemas` チャンク (58 KB) が消滅しました。

---

## まとめ

### 重要ポイント

1. **チャンク = JavaScriptファイルの分割**
   - 1つの大きなファイルを、複数の小さなファイルに分ける

2. **手動でファイルを作らない**
   - `vite.config.js` に**ルールを書くだけ**
   - Viteが自動的にファイルを生成

3. **メリット**
   - ✅ 初回ロード高速化（並列ダウンロード）
   - ✅ キャッシュ効率向上（変更部分だけ再ダウンロード）
   - ✅ 500KB警告の解消

4. **やること**
   ```bash
   # 1. vite.config.js を編集（ルール追加）
   # 2. ビルド実行
   npm run build
   # 3. Viteが自動的にチャンク分割してくれる！
   ```

### 開発の流れ

```
コードを書く (src/)
    ↓
ビルド (npm run build)
    ↓
Viteがチャンク分割 (自動)
    ↓
dist/ にファイル生成 (自動)
    ↓
Vercelにデプロイ
    ↓
ユーザーが高速にアプリを使える！
```

---

## 参考資料

- [Vite公式ドキュメント - build.rollupOptions.output.manualChunks](https://vitejs.dev/config/build-options.html#build-rollupoptions)
- [Rollup公式ドキュメント - output.manualChunks](https://rollupjs.org/configuration-options/#output-manualchunks)

---

**作成日**: 2026-02-23
**関連ファイル**: `vite.config.js`, `src/lib/firebase.ts`
**関連最適化**: React.lazy によるルートベースコード分割（`src/App.tsx`）
