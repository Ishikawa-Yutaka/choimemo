# React のルーティング（画面遷移）について

## 通常のWebサイトとReactの違い

### 通常のWebサイト（HTMLファイルが複数ある）

```
/login           → login.html を読み込む（サーバーから取得）
/signup          → signup.html を読み込む（サーバーから取得）
/forgot-password → forgot-password.html を読み込む（サーバーから取得）
```

URLが変わるたびに、サーバーから別のHTMLファイルを取得する。
ページを読み込み直すので「チカッ」と画面が一瞬白くなる。

---

### Reactアプリ（SPA = シングルページアプリケーション）

```
index.html が1つだけ存在（ファイルは1つ）
  ↓
App.tsx が「今のURLが何か」を見て、表示するコンポーネントを切り替える
```

HTMLファイルは1つだけで、URLが変わっても**ページを読み込み直さない**。
JavaScriptがURLを見て、表示するコンポーネントを瞬時に切り替える。
だから画面遷移がスムーズで「チカッ」としない。

---

## App.tsx でのルーティング設定

このプロジェクトでは `react-router-dom` というライブラリを使ってルーティングを管理している。

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

const App = () => {
  return (
    <BrowserRouter>       {/* ← ルーティング機能を有効にする */}
      <Routes>            {/* ← URLに応じてどれか1つのRouteを表示する */}

        <Route path="/login"          element={<LoginPage />} />
        <Route path="/signup"         element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/"               element={<MemoPage />} />

      </Routes>
    </BrowserRouter>
  )
}
```

### 各パーツの役割

| パーツ | 役割 |
|--------|------|
| `<BrowserRouter>` | ルーティング機能全体をまとめる入れ物。アプリ全体を包む |
| `<Routes>` | URLに一致する `<Route>` を1つだけ選んで表示する |
| `<Route path="..." element={...}>` | `path` のURLにアクセスしたら `element` のコンポーネントを表示 |

---

## 新しいページを追加するときの手順

1. **ページコンポーネントを作成**
   `src/pages/NewPage.tsx` を作る

2. **App.tsx にルートを追加**
   ```tsx
   import NewPage from './pages/NewPage'

   <Route path="/new-page" element={<NewPage />} />
   ```

3. **他のページからリンクを張る**
   ```tsx
   import { Link } from 'react-router-dom'

   <Link to="/new-page">新しいページへ</Link>
   ```

---

## ページ遷移の方法（2種類）

### 1. `<Link>` コンポーネント（クリックで遷移）

```tsx
import { Link } from 'react-router-dom'

// HTMLの <a href="..."> に相当するが、ページをリロードしない
<Link to="/login">ログインページへ</Link>
```

### 2. `useNavigate` フック（コードで遷移）

```tsx
import { useNavigate } from 'react-router-dom'

const navigate = useNavigate()

// ログイン成功後など、処理の完了後にコードで遷移させたい場合
const handleLogin = async () => {
  await signInWithEmailAndPassword(...)
  navigate('/')         // → トップページへ遷移
  navigate('/login', { replace: true })  // → 戻るボタンで戻れないように遷移
}
```

`replace: true` を使うと、ブラウザの「戻る」ボタンで前のページに戻れなくなる。
ログイン後のリダイレクトなどに使う（ログイン画面に戻られると困るため）。

---

## ProtectedRoute（ログイン保護）

このプロジェクトでは `ProtectedRoute` というコンポーネントで、
ログインしていないユーザーがメモページにアクセスできないようにしている。

```tsx
// App.tsx
<Route
  path="/"
  element={
    <ProtectedRoute>   {/* ← ログインチェック */}
      <MemoPage />
    </ProtectedRoute>
  }
/>
```

`ProtectedRoute` の中では Firebase の認証状態を確認し、
未ログインなら `/login` にリダイレクトする。

---

## まとめ

- ReactはSPA（シングルページアプリ）なのでHTMLファイルは1つだけ
- URLの管理は `App.tsx` の `<Routes>` で行う
- 新しいページを追加したら必ず `App.tsx` にルートを追加する
- リンクは `<Link to="...">` または `useNavigate()` を使う
