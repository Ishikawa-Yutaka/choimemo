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
① useEffect 実行
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

## なぜ「同じデータ」なのに再レンダリングされるのか

`refreshUser()` の中で次のコードを実行している：

```tsx
setUser({ ...auth.currentUser })
//        ↑ スプレッド演算子で新しいオブジェクトを作成
```

ここで重要なのが、JavaScript のオブジェクトの比較の仕組み。

### JavaScript の比較ルール

```js
// プリミティブ型（数値・文字列など）→ 中身で比較
1 === 1          // true  → 同じとみなす
'abc' === 'abc'  // true  → 同じとみなす

// オブジェクト → 参照（メモリのアドレス）で比較
{ a: 1 } === { a: 1 }  // false！中身が同じでも別のオブジェクト
```

React の `setState` は `===` で新旧の値を比較する。
オブジェクトは参照が違えば**中身が全く同じでも「変化した」と判断**して再レンダリングする。

```
emailVerified が true になった後でも:

前の user: { uid: 'abc', emailVerified: true, ... }  ← オブジェクトA
新しい user: { uid: 'abc', emailVerified: true, ... }  ← オブジェクトB（スプレッドで作成）

オブジェクトA === オブジェクトB → false
→ Reactは「変化した」と判断
→ AuthProvider が再レンダリング
→ refreshUser 関数が再作成される（新しい参照）
→ useEffect が再実行される
```

---

## なぜ refreshUser の参照が変わるのか

React では、コンポーネントが再レンダリングされるたびに、
そのコンポーネント内で定義された関数は**毎回新しく作られる**。

```tsx
// AuthProvider 内
const refreshUser = async () => { ... }
// ↑ レンダリングのたびに新しい関数オブジェクトが作られる
// 前回の refreshUser とは別のもの（参照が違う）
```

`useEffect` の依存配列に関数を入れると、
その関数の**参照**が変わるたびに `useEffect` が再実行される。

```tsx
useEffect(() => {
  handleAction() // applyActionCode を含む
}, [searchParams, refreshUser]) // refreshUser の参照が変わると再実行
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
| オブジェクトの比較 | 中身が同じでも参照が違えば `===` は false |
| Reactの再レンダリング | `setState` で新しいオブジェクトを渡すと必ず再レンダリング |
| 関数の再作成 | 再レンダリングのたびに関数が新しく作られる |
| useEffect の再実行 | 依存配列の参照が変わると再実行される |
| useCallback | 関数の参照を固定してループを防ぐ |
