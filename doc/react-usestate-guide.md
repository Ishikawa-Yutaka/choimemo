# React useState の完全ガイド

このドキュメントでは、React の `useState` フックについて、初心者向けに詳しく解説します。

## 目次
1. [useStateとは](#useStateとは)
2. [基本的な使い方](#基本的な使い方)
3. [setMemos（更新関数）の正体](#setmemos更新関数の正体)
4. [なぜ直接変更できないのか](#なぜ直接変更できないのか)
5. [配列の更新パターン](#配列の更新パターン)
6. [よくある間違い](#よくある間違い)

---

## useStateとは

**useState = Reactコンポーネントの「状態（State）」を管理するための関数**

### 役割
- コンポーネント内で変化する値（例: メモの内容、メニューの開閉状態）を保持
- 値が変更されたら、自動的に画面を再描画（再レンダリング）

### 基本構文

```typescript
const [値, 値を変更する関数] = useState(初期値)
```

---

## 基本的な使い方

### 例1: 単純な値の管理

```typescript
// カウンターの例
const [count, setCount] = useState(0)

// ボタンをクリックしたら+1
const handleClick = () => {
  setCount(count + 1) // ✅ 正しい
}

// ❌ これは動かない
const handleClickWrong = () => {
  count = count + 1 // エラー: countは読み取り専用
}
```

### 例2: 配列の管理（このプロジェクトの例）

```typescript
// src/pages/MemoPage.tsx（59行目）
const [memos, setMemos] = useState<Memo[]>([])
//     ↑          ↑                    ↑
//   現在の値   更新関数            初期値（空配列）
```

**解説**:
- `memos` - 現在のメモ一覧（配列）
- `setMemos` - メモ一覧を更新する関数（Reactが自動生成）
- `useState<Memo[]>([])` - 初期値は空の配列、型は`Memo[]`

### 例3: オブジェクトの管理

```typescript
const [user, setUser] = useState({
  name: '',
  email: '',
})

// メールアドレスだけ更新
setUser({
  ...user,        // 既存の値をコピー
  email: 'new@example.com', // emailだけ上書き
})
```

---

## setMemos（更新関数）の正体

### 1. どこで定義されている？

`setMemos`は**Reactが自動的に生成する関数**です。

```typescript
// MemoPage.tsx（59行目）
const [memos, setMemos] = useState<Memo[]>([])
//            ↑
//     この関数はReactが作る
```

**実装コードの場所**:
```
node_modules/react/
└── React本体のソースコード（JavaScript）
    └── useState の実装がここにある
```

私たちが書いたコードではなく、**Reactパッケージの中**にあります。

### 2. setMemosは「更新するだけ」の関数？

いいえ、**更新だけではありません**。実際には以下の処理を自動的に実行します：

```typescript
// setMemos(新しい値) を呼び出すと...

// ステップ1: 古い値と新しい値を比較
const oldMemos = [...] // 現在のmemos
const newMemos = [...] // setMemosに渡した新しい値

if (oldMemos !== newMemos) {
  // ステップ2: 内部的にmemosを新しい値に更新
  // （Reactの内部ストレージに保存）

  // ステップ3: 再レンダリング（画面の再描画）をスケジュール
  // → コンポーネント全体が再実行される
  // → 新しいmemosの値で画面が更新される

  // ステップ4: 仮想DOMと実際のDOMを比較
  // → 変更された部分だけ、実際のHTML（DOM）を更新
}
```

### 3. setMemosがやっていること（まとめ）

| ステップ | 処理内容 | 説明 |
|---------|---------|------|
| 1 | **値の更新** | 新しい値をReactの内部ストレージに保存 |
| 2 | **再レンダリングのスケジュール** | コンポーネント全体を再実行する予約をする |
| 3 | **コンポーネントの再実行** | `MemoPage`関数が再度実行される |
| 4 | **DOM更新** | 変更された部分だけHTMLを更新 |

---

## なぜ直接変更できないのか

### ❌ 間違った例（動かない）

```typescript
// 直接変更してしまう（Mutate）
memos.push(新しいメモ)
memos[0] = 更新されたメモ
memos.sort()

// 問題: Reactが変更を検知できない
// → 画面が更新されない
```

### ✅ 正しい例（動く）

```typescript
// 新しい配列を作成して、setMemosに渡す
setMemos([新しいメモ, ...memos])
setMemos(memos.map((memo, i) => i === 0 ? 更新されたメモ : memo))
setMemos([...memos].sort())
```

### なぜ直接変更がダメなのか？

**理由**: Reactは「配列の参照（メモリ上のアドレス）」が変わったかをチェックしている

```typescript
// 直接変更の場合
const oldMemos = [メモ1, メモ2]
memos.push(メモ3) // 配列の中身は変わるが...
const newMemos = [メモ1, メモ2, メモ3]

// Reactのチェック
oldMemos === newMemos
// → true（参照が同じ！）
// → 「変更されていない」と判断してしまう
```

```typescript
// 新しい配列を作る場合
const oldMemos = [メモ1, メモ2]
const newMemos = [...oldMemos, メモ3] // 新しい配列を作成
setMemos(newMemos)

// Reactのチェック
oldMemos === newMemos
// → false（参照が違う！）
// → 「変更された」と判断して再レンダリング
```

---

## 配列の更新パターン

### 1. 配列の先頭に追加

```typescript
// 新しいメモを一番上に追加
setMemos([新しいメモ, ...memos])
//        ↑          ↑
//     先頭に追加   既存の配列を展開
```

**動作**:
```typescript
// 実行前
memos = [メモ1, メモ2, メモ3]

// 実行後
memos = [新しいメモ, メモ1, メモ2, メモ3]
```

### 2. 配列の末尾に追加

```typescript
// 新しいメモを一番下に追加
setMemos([...memos, 新しいメモ])
```

### 3. 配列の特定の要素を更新

```typescript
// インデックス0のメモだけ更新
setMemos(
  memos.map((memo, index) =>
    index === 0 ? 更新されたメモ : memo
  )
)
```

**動作**:
```typescript
// 実行前
memos = [
  { id: 1, content: '古い内容' },
  { id: 2, content: 'メモ2' },
]

// 実行後
memos = [
  { id: 1, content: '新しい内容' }, // ← 更新された
  { id: 2, content: 'メモ2' },
]
```

### 4. 配列から要素を削除

```typescript
// インデックス0のメモを削除
setMemos(memos.filter((_, index) => index !== 0))
```

**動作**:
```typescript
// 実行前
memos = [メモ1, メモ2, メモ3]

// 実行後
memos = [メモ2, メモ3] // メモ1が削除された
```

---

## よくある間違い

### 間違い1: 直接変更してしまう

```typescript
// ❌ ダメな例
const handleAdd = () => {
  memos.push(新しいメモ) // 直接変更
  setMemos(memos) // 参照が同じなので変更検知されない
}

// ✅ 正しい例
const handleAdd = () => {
  setMemos([...memos, 新しいメモ]) // 新しい配列を作成
}
```

### 間違い2: 古い値を使ってしまう

```typescript
// ❌ 連続クリックで問題が起きる例
const handleAdd = () => {
  setMemos([...memos, 新しいメモ]) // memosは古い値の可能性がある
}

// ✅ 正しい例（関数形式）
const handleAdd = () => {
  setMemos((prevMemos) => [...prevMemos, 新しいメモ])
  //        ↑
  //   常に最新の値が渡される
}
```

**なぜ関数形式が安全？**:
- Reactは`prevMemos`に**常に最新の値**を渡してくれる
- 連続してクリックしても、正しく動作する

### 間違い3: オブジェクトの一部だけ更新しようとして失敗

```typescript
// ❌ ダメな例
const handleUpdate = () => {
  const updatedMemo = memos[0]
  updatedMemo.content = '新しい内容' // 直接変更
  setMemos([...memos]) // 参照が同じなので変更検知されない
}

// ✅ 正しい例
const handleUpdate = () => {
  setMemos(
    memos.map((memo, index) =>
      index === 0
        ? { ...memo, content: '新しい内容' } // 新しいオブジェクトを作成
        : memo
    )
  )
}
```

---

## このプロジェクトでの実例

### MemoPage.tsx での使用例

#### 1. メモ一覧の管理（59行目）

```typescript
const [memos, setMemos] = useState<Memo[]>([])
```

#### 2. Firestoreから取得したメモをセット（164行目）

```typescript
// 取得したメモをStateに保存
setMemos(fetchedMemos)
```

#### 3. メモの内容を更新（211-217行目）

```typescript
// メモの内容を即座に画面に反映
setMemos((prevMemos) =>
  prevMemos.map((memo, index) =>
    index === currentIndex
      ? { ...memo, content: newContent, updated_at: new Date() }
      : memo
  )
)
```

**解説**:
- `prevMemos` - 常に最新のmemos配列
- `map()` - 全メモをループ
- `index === currentIndex` - 現在編集中のメモだけ更新
- `{ ...memo, content: newContent }` - 既存の値をコピーして、contentだけ上書き

---

## まとめ

### useStateの重要ポイント

| 項目 | 説明 |
|------|------|
| **useState の役割** | コンポーネントの状態を管理し、変更時に再レンダリング |
| **更新関数の正体** | Reactが自動生成する特別な関数（実装はReact本体にある） |
| **更新関数がやること** | 1. 値の更新<br>2. 再レンダリング<br>3. DOM更新 |
| **直接変更がダメな理由** | Reactは参照の変更を監視している（中身の変更は検知できない） |
| **正しい更新方法** | 新しい配列・オブジェクトを作成してsetXXXに渡す |

### 配列更新のパターン

| 操作 | コード例 |
|------|---------|
| **先頭に追加** | `setMemos([新要素, ...memos])` |
| **末尾に追加** | `setMemos([...memos, 新要素])` |
| **要素を更新** | `setMemos(memos.map((m, i) => i === index ? 新要素 : m))` |
| **要素を削除** | `setMemos(memos.filter((_, i) => i !== index))` |

### ベストプラクティス

- ✅ 常に新しい配列・オブジェクトを作成する
- ✅ スプレッド構文（`...`）を活用する
- ✅ 連続更新の場合は関数形式を使う: `setMemos(prev => ...)`
- ✅ 複雑な更新ロジックはカスタムフックに分離する
- ❌ `push()`, `splice()`, `sort()` など、直接変更するメソッドを使わない
- ❌ オブジェクトのプロパティを直接書き換えない

---

## 参考リンク

- [React公式ドキュメント - useState](https://ja.react.dev/reference/react/useState)
- [配列のState更新](https://ja.react.dev/learn/updating-arrays-in-state)
- [オブジェクトのState更新](https://ja.react.dev/learn/updating-objects-in-state)
