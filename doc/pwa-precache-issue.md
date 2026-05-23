# PWA プリキャッシュの問題と対策

## プリキャッシュとは？

Service Worker（SW）がインストールされた時点で、**全てのビルドファイル（HTML/JS/CSS）を先読みしてキャッシュに保存する仕組み**。

```
初回アクセス時:
ブラウザ → SW登録 → 全ファイルをダウンロード → キャッシュに保存
```

## 何が問題だったか？

### ビルド時のファイル名にはハッシュが付く

Viteでビルドすると、ファイル名にハッシュ（ランダムな文字列）が付く。

```
1回目のデプロイ: ForgotPasswordPage-VmEKIpnX.js
2回目のデプロイ: ForgotPasswordPage-B2XWL1tO.js  ← ハッシュが変わる
```

### プリキャッシュが古いHTMLを返し続ける

```
1回目のデプロイ:
  SW が index.html をプリキャッシュ
  → index.html 内で ForgotPasswordPage-VmEKIpnX.js を参照

2回目のデプロイ（コード修正後）:
  サーバーには新しいファイルがある:
    - index.html（新）→ ForgotPasswordPage-B2XWL1tO.js を参照
    - ForgotPasswordPage-B2XWL1tO.js（新）

  しかしSWが古いプリキャッシュの index.html を返す
    → ForgotPasswordPage-VmEKIpnX.js を読みに行く
    → サーバーにそのファイルはもう存在しない
    → エラー！
```

### 実際に起きたエラー

```
Failed to load module script: Expected a JavaScript-or-Wasm module script
but the server responded with a MIME type of "text/html".
```

**原因の流れ:**

1. SWが古い `index.html` を返す
2. 古い `index.html` が古いJSファイル名を参照
3. サーバーにそのファイルは存在しない
4. Vercelは存在しないURLに `index.html`（HTML）を返す（SPAフォールバック）
5. ブラウザ「JSを期待したのにHTMLが来た！」→ エラー
6. `React.lazy()` の動的インポートが失敗 → **ページが真っ白**

## 解決策: プリキャッシュを無効化

```javascript
// vite.config.js
VitePWA({
  workbox: {
    // プリキャッシュを無効化
    globPatterns: [],
    // ナビゲーションフォールバック不要
    navigateFallback: null,

    // ランタイムキャッシュでリソースごとに戦略を指定
    runtimeCaching: [
      {
        // HTML: 常にネットワークから取得（最新のHTMLが返る）
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
      },
      {
        // JS/CSS: キャッシュを返しつつ裏で更新
        // ハッシュ付きなので新しいファイルは新しいURLになる
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
      },
    ],
  },
})
```

## プリキャッシュ vs ランタイムキャッシュ

| 項目 | プリキャッシュ | ランタイムキャッシュ |
|------|-------------|-----------------|
| キャッシュのタイミング | SW登録時に全ファイルを先読み | アクセスした時にキャッシュ |
| デプロイ後の挙動 | **古いファイルを返し続ける** | NetworkFirstなら常に最新を取得 |
| オフライン（未訪問ページ） | 表示可能 | 表示不可 |
| オフライン（訪問済みページ） | 表示可能 | 表示可能 |

## キャッシュ戦略の種類

| 戦略 | 動作 | 使いどころ |
|------|------|-----------|
| **NetworkFirst** | ネットワーク優先。失敗時のみキャッシュ | HTML（常に最新が必要） |
| **StaleWhileRevalidate** | キャッシュを即返し、裏でネットワークから更新 | JS/CSS/フォント |
| **CacheFirst** | キャッシュ優先。なければネットワーク | 画像（変更頻度が低い） |
| **NetworkOnly** | 常にネットワーク。キャッシュしない | API通信（Firebase等） |

## 教訓

- プリキャッシュは「オフライン対応」が必要な場合に有効
- 頻繁に更新するアプリでは**プリキャッシュが逆効果**になる
- ランタイムキャッシュ + NetworkFirst が「常に最新」と「キャッシュ高速化」を両立できる
- オフライン対応が不要なら、プリキャッシュは無効にしておくのが安全
