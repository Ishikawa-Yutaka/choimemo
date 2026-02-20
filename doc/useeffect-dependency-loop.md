# useEffect の依存配列と再実行ループ

## 発生した問題

メール確認リンクをクリックすると、一瞬「アカウントが作成されました！」が表示された後、
エラー画面に切り替わる。コンソールには 400 エラーが出ていた。

```
Failed to load resource: the server responded with a status of 400 ()
identitytoolkit.googleapis.com/v1/accounts:update
```

---

## 原因：useEffect が2回実行された

### 処理の流れ（修正前）

```
① useEffect 実行（AuthActionPage.tsx）
   → applyActionCode(oobCode) 成功（oobCode が無効になる）
   → refreshUser() を呼ぶ
       → reload()
       → setUser({ ...auth.currentUser })  ← State が更新される

② AuthProvider が再レンダリングされる

③ refreshUser 関数が再作成される（新しい参照）

④ useEffect が「refreshUser が変わった」と検知して再実行される

⑤ applyActionCode(同じ oobCode) を再度呼ぶ
   → 400 エラー（oobCode は1回使ったら無効）

⑥ エラー画面に切り替わる
```

---

## データの流れ全体図

### ファイル間の関係

```
【AuthContext.tsx】
  ↓ refreshUser を作成（useCallback でメモ化）
  ↓
【main.tsx】
  <AuthProvider>  ← refreshUser を提供
    <App />
  </AuthProvider>
  ↓
【AuthActionPage.tsx】
  const { refreshUser } = useAuth()  ← refreshUser を受け取る
  ↓
  useEffect(() => {
    await refreshUser()  ← 実行
  }, [searchParams, refreshUser])
```

---

## なぜ `useAuth()` が必要なのか

### ❌ できないこと

```tsx
// これはできない！
import { refreshUser } from '../contexts/AuthContext'
```

**理由：** `refreshUser` は `export` されていない。`AuthProvider` の中で作られた変数だから。

---

### ✅ 正しい方法：Context を使う

```tsx
// AuthContext.tsx（提供側）
export function AuthProvider({ children }) {
  const refreshUser = useCallback(async () => { ... }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)  // { user, loading, refreshUser } を返す
}
```

```tsx
// AuthActionPage.tsx（使用側）
const { refreshUser } = useAuth()
//      ↑ refreshUser だけ取り出す（分解代入）
```

---

## なぜ「同じデータ」なのに再レンダリングされるのか

### 再レンダリングの原因は `setUser()`

```tsx
const refreshUser = async () => {
  if (auth.currentUser) {
    await reload(auth.currentUser)
    setUser({ ...auth.currentUser })  // ← これが再レンダリングのトリガー
  }
}
```

**重要：** `useEffect` は再レンダリングの原因ではない！

---

### React の基本ルール

```tsx
const [user, setUser] = useState(null)

setUser(新しい値)  // State を更新
  ↓
コンポーネントが再レンダリングされる（React の仕組み）
```

---

### JavaScript のオブジェクト比較

```js
// プリミティブ型 → 中身で比較
1 === 1          // true
'abc' === 'abc'  // true

// オブジェクト → 参照（メモリアドレス）で比較
{ a: 1 } === { a: 1 }  // false！（中身が同じでも別オブジェクト）
```

React の `setState` は `===` で新旧の値を比較する。
オブジェクトは参照が違えば**中身が全く同じでも「変化した」と判断**して再レンダリングする。

```
emailVerified が true になった後でも:

前の user: { uid: 'abc', emailVerified: true, ... }  ← オブジェクトA
新しい user: { uid: 'abc', emailVerified: true, ... }  ← オブジェクトB（スプレッドで作成）

オブジェクトA === オブジェクトB → false
→ React は「変化した」と判断
→ AuthProvider が再レンダリング
→ refreshUser 関数が再作成される（useCallback がない場合）
→ useEffect が再実行される
```

---

## 再レンダリングで関数が再作成される理由

```tsx
export function AuthProvider({ children }) {
  // ↑ ここから再度実行される

  const [user, setUser] = useState(...)

  // setUser() が呼ばれて再レンダリング
  // → この関数定義も再度実行される
  const refreshUser = async () => { ... }
  // ↑ 新しい関数オブジェクトが作られる

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
```

**コンポーネントが再レンダリングされると、中の関数も全部再作成される。**

---

## `if (auth.currentUser)` と `reload()` の違い

### `if (auth.currentUser)` → 存在チェック

```tsx
if (auth.currentUser) {
  // ↑ ユーザーがログインしているか確認するだけ
  //   null チェック（ログアウト状態かどうか）
}
```

**目的：** エラー防止

---

### `reload(auth.currentUser)` → 最新情報を取得

```tsx
await reload(auth.currentUser)
// ↑ Firebase サーバーから最新のユーザー情報をダウンロード
```

**目的：** ブラウザの古い情報を最新化する

---

### なぜ reload() が必要か

```
メール確認リンクをクリック
  ↓
applyActionCode() 成功
  ↓
Firebase サーバー上では emailVerified が true になる
  ↓
でもブラウザの auth.currentUser.emailVerified はまだ false のまま！
```

ブラウザが持っている `auth.currentUser` は **キャッシュされた古い情報**。

```
【Before（reload なし）】
Firebase サーバー           ブラウザ
emailVerified: true   ←→   emailVerified: false（古い）

【After（reload あり）】
Firebase サーバー           ブラウザ
emailVerified: true   ←→   emailVerified: true（同期完了）
```

---

### `if` は emailVerified を見ていない

```tsx
if (auth.currentUser) {
  // ↑ 「ログイン中か」を確認（null エラー防止）
  //   emailVerified の値は関係ない

  await reload(auth.currentUser)
  // ↑ 「emailVerified などを最新にする」
}
```

| チェック内容 | 目的 | 見ているもの |
|------------|------|------------|
| `if (auth.currentUser)` | **null チェック** | オブジェクトの有無（ログイン中か） |
| `reload(auth.currentUser)` | **データ同期** | emailVerified などの最新値 |

---

## メールリンクとログイン状態

### メールリンクは自動ログインしない

**メールリンク（oobCode）の役割：**

✅ やること：
- `emailVerified` を `false` → `true` にする（サーバー側）

❌ やらないこと：
- ログイン処理
- セッションの作成

---

### 実際の流れ

#### アカウント作成時（すでにログイン状態）

```
① /signup でアカウント作成
  ↓
createUserWithEmailAndPassword() → ログイン状態になる
  ↓
sendEmailVerification() → 確認メール送信
  ↓
/verify-email に遷移（ログイン状態のまま）
```

#### メールリンクをクリック（同じブラウザ）

```
ブラウザは既にログイン状態
  ↓
メールリンクをクリック
  ↓
/__/auth/action に遷移
  ↓
まだログイン状態のまま（auth.currentUser が存在）
  ↓
applyActionCode() で emailVerified を true にする
  ↓
refreshUser() でブラウザの情報を最新化
```

#### メールリンクをクリック（別のブラウザ）

```
別のブラウザはログインしていない
  ↓
メールリンクをクリック
  ↓
/__/auth/action に遷移
  ↓
applyActionCode() で emailVerified を true にする（サーバー側だけ）
  ↓
refreshUser() を呼ぶが...
  ↓
if (auth.currentUser) が false（未ログイン）
  ↓
何もしない
  ↓
「アカウントが作成されました」画面
  ↓
「ちょいMEMOを始める」→ 手動でログインが必要
```

---

## 解決策：useCallback で関数の参照を固定

`useCallback` を使うと、依存配列が変わらない限り**同じ関数参照**を返し続ける。

```tsx
// 修正前：レンダリングのたびに新しい関数が作られる
const refreshUser = async () => {
  if (auth.currentUser) {
    await reload(auth.currentUser)
    setUser({ ...auth.currentUser })
  }
}

// 修正後：useCallback で参照を固定
const refreshUser = useCallback(async () => {
  if (auth.currentUser) {
    await reload(auth.currentUser)
    setUser({ ...auth.currentUser })
  }
}, []) // 依存配列が空 = 初回のみ作成、以降は同じ参照を使い回す
```

### 修正後の処理の流れ

```
① useEffect 実行
   → applyActionCode(oobCode) 成功
   → refreshUser() → setUser() → AuthProvider 再レンダリング

② refreshUser の参照は変わらない（useCallback で固定済み）

③ useEffect は再実行されない

④ 成功画面のまま表示される
```

---

## useCallback とは

関数をメモ化（キャッシュ）するフック。

```tsx
const メモ化された関数 = useCallback(
  () => { /* 処理 */ },
  [依存する値] // この値が変わった時だけ関数を再作成する
)
```

| 依存配列 | 動作 |
|--------|------|
| `[]`（空） | 初回のみ作成。以降は常に同じ参照 |
| `[value]` | `value` が変わった時だけ再作成 |
| なし | 毎回再作成（useCallback を使う意味がない） |

---

## useCallback を使うべき場面

```
✓ useEffect の依存配列に関数を入れる場合
✓ 子コンポーネントに関数を props として渡す場合
  （子が React.memo で最適化されている場合）
✗ 単純な処理でパフォーマンス問題がない場合（過剰最適化になる）
```

---

## まとめ

| ポイント | 内容 |
|--------|------|
| データの流れ | AuthContext → useAuth() → AuthActionPage |
| Context の役割 | コンポーネント間でデータを共有（export/import の代わり） |
| 再レンダリングの原因 | setState（useEffect ではない） |
| オブジェクトの比較 | 中身が同じでも参照が違えば `===` は false |
| 関数の再作成 | 再レンダリングのたびに関数が新しく作られる |
| useEffect の再実行 | 依存配列の参照が変わると再実行される |
| useCallback | 関数の参照を固定してループを防ぐ |
| reload() の役割 | サーバーから最新情報を取得（ブラウザのキャッシュを更新） |
| メールリンク | emailVerified を true にするだけ（ログインはしない） |
