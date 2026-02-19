# SPA のルーティングと Vercel の設定

## 問題：メールのリンクをクリックすると404になる

確認メールのリンクをクリックすると、Vercel が 404 を返した。

```
404: NOT_FOUND
```

---

## 原因：SPA とサーバーの仕組みの違い

### SPA（シングルページアプリケーション）とは

React + Vite で作ったアプリは SPA。
HTML ファイルは `index.html` の **1つだけ**。
ページの切り替えは JavaScript（React Router）が行う。

```
SPA の仕組み:
① ブラウザが index.html を受け取る
② JavaScript（React）が起動する
③ URLを見てどの画面を表示するか決める（React Router）
④ 画面が切り替わる（サーバーへのリクエストなし）
```

### リンククリック vs 直接アクセスの違い

```
【リンククリック（アプリ内）】
ブラウザ内で処理 → サーバーにリクエストしない → React Router が処理 → OK

【直接アクセス・リロード・メールのリンク】
Vercelサーバーにリクエストが届く → サーバーがファイルを探す → ない → 404
```

今回の確認メールのリンクは**メールアプリからの直接アクセス**なので、
Vercel サーバーにリクエストが届き、404 になった。

---

## 解決策：vercel.json でリライト設定

`vercel.json` をプロジェクトルートに作成する。

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 意味

```
どんな URL でアクセスされても → index.html を返す
```

これで：

```
/__/auth/action?mode=verifyEmail&oobCode=xxx
  ↓ Vercel が index.html を返す
  ↓ React が起動する
  ↓ React Router が /__/auth/action を見て AuthActionPage を表示
  ↓ OK
```

---

## ローカル開発では設定不要な理由

ローカル開発（`npm run dev`）では Vite の開発サーバーが自動でこの設定をしてくれる。

```
ローカル（Vite）  → 自動で index.html を返す → 設定不要
Vercel（本番）    → vercel.json で設定しないと 404 になる
```

---

## SSR との比較

| | SPA（React + Vite） | SSR（Next.js など） |
|--|--|--|
| サーバーの役割 | index.html を返すだけ | 各URLのHTMLを生成して返す |
| vercel.json | **必要** | 不要 |
| `/login` へのアクセス | index.html → React が処理 | サーバーが `/login` の HTML を作る |

SSR はサーバーが各 URL に対して HTML を生成するので、この設定は不要。
SPA はサーバーが index.html しか持っていないので、この設定が必要。

---

## まとめ

- SPA では**サーバーを経由するリクエスト**（直接URL入力・リロード・外部リンク）に注意
- Vercel に SPA をデプロイする場合は `vercel.json` でリライト設定が必要
- アプリ内のリンククリックはサーバーを経由しないので問題ない
