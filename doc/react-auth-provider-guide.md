# AuthProvider の役割と認証アクセス制御

## 全体の構造

```
main.tsx
└── <AuthProvider>         ← ① ユーザー情報を管理・提供する「倉庫」
      └── <App />
            └── <Routes>
                  ├── /login          → LoginPage（保護なし・誰でもOK）
                  ├── /signup         → SignupPage（保護なし・誰でもOK）
                  ├── /verify-email   → EmailVerificationPage（ページ内で自分でチェック）
                  └── /              → <ProtectedRoute>  ← ② アクセスを判断する「ドア」
                                           └── MemoPage
```

---

## ① AuthProvider の役割 = 「ユーザー情報の倉庫」

`src/contexts/AuthContext.tsx` に実装されている。

### やっていること

```tsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)    // ログインユーザーを保管
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebaseの認証状態を監視（ログイン・ログアウトを自動検知）
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)   // ユーザーが変わったら更新
      setLoading(false)
    })
    return () => unsubscribe()  // 監視解除（メモリリーク防止）
  }, [])

  // user と loading を全コンポーネントに提供
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### AuthProvider が「倉庫」である理由

- **アクセスを制限しない** → ただ情報を持っているだけ
- **どこからでも取り出せる** → `useAuth()` で任意のコンポーネントから参照可能
- **自動更新** → ログイン・ログアウト時に自動でユーザー情報が変わる

```tsx
// どのコンポーネントからでもこれだけで取得できる
const { user, loading } = useAuth()
```

---

## ② アクセス制御 = 「ドア」

AuthProvider はユーザー情報を**提供するだけ**。
アクセスを制限するのは別の仕組みが必要。

### 方法A: ProtectedRoute（ルートをまとめて保護）

`src/components/ProtectedRoute.tsx` に実装されている。

```tsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()   // 倉庫からユーザーを取得

  if (loading) return <div>読み込み中...</div>

  // 未ログイン → ログインページへ
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // メール未確認 → 確認待ちページへ
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace />
  }

  // 全条件クリア → ページを表示
  return <>{children}</>
}
```

**使いどころ**: ログイン必須のページをまとめて保護したい場合

```tsx
// App.tsx
<Route path="/" element={
  <ProtectedRoute>   ← ここでまとめてチェック
    <MemoPage />
  </ProtectedRoute>
} />
```

---

### 方法B: ページ内で直接チェック

`src/pages/EmailVerificationPage.tsx` に実装されている。

```tsx
const EmailVerificationPage = () => {
  const { user, loading } = useAuth()   // 倉庫からユーザーを取得

  if (loading) return <div>読み込み中...</div>

  // 未ログイン → ログインページへ
  if (!user) return <Navigate to="/login" replace />

  // メール確認済み → メモページへ（このページは不要）
  if (user.emailVerified) return <Navigate to="/" replace />

  // 条件クリア → ページを表示
  return <div>メール確認待ち画面...</div>
}
```

**使いどころ**: 特定の条件のユーザーだけが使うページ

---

## 役割の違いまとめ

| | AuthProvider | ProtectedRoute / ページ内チェック |
|---|---|---|
| 役割 | ユーザー情報の提供（倉庫） | アクセス制御（ドア） |
| 場所 | `contexts/AuthContext.tsx` | `components/ProtectedRoute.tsx` / 各ページ |
| アクセス制限 | しない | する |
| 使い方 | `useAuth()` で取得 | `if (!user) return <Navigate>` |

---

## よくある間違い

```tsx
// ❌ AuthProviderで囲んでいるからアクセス制限される、と思いがち
<AuthProvider>
  <Route path="/secret" element={<SecretPage />} />  ← 誰でもアクセス可能！
</AuthProvider>

// ✅ 正しくはProtectedRouteかページ内チェックが必要
<Route path="/secret" element={
  <ProtectedRoute>
    <SecretPage />
  </ProtectedRoute>
} />
```

**AuthProvider は「鍵の存在を確認できる仕組み」、
ProtectedRoute は「鍵がないと通れないドア」。
倉庫があるだけではドアにならない。**
