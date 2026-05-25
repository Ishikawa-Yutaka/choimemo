# onSnapshotによるカーソル飛びバグの修正

## 症状

メモの文中にテキストを入力していると、たまにカーソルが文章の最後に飛んでしまう。

## 原因

### 処理の流れ（バグ発生時）

```
1. ユーザーが文の途中で入力
   → useMemoEditing の handleMemoChange が実行
   → ローカルState の updated_at を new Date() で更新

2. 500ms後にデバウンスで Firestore に保存
   → updateMemo() が serverTimestamp() で updated_at を設定

3. onSnapshot が発火（1回目 = 楽観的更新）
   → serverTimestamp() がまだサーバーで未確定のため、updated_at が null
   → フォールバックで new Date()（現在時刻）が使われる

4. useMemoData の競合回避ロジックで比較
   → ローカルの updated_at（入力時の時刻）< サーバーの updated_at（現在時刻）
   → サーバー側が「新しい」と誤判定される

5. ローカルの State がサーバーのデータで上書きされる
   → もし保存後〜onSnapshot到着の間に追加入力があった場合、古い内容に戻る
   → React が textarea を再レンダリング → カーソルが文末にリセット
```

### ポイント: onSnapshot は1回の保存で2回発火する

`serverTimestamp()` を使って Firestore に書き込むと、`onSnapshot` は2回コールバックを呼ぶ:

1. **1回目（楽観的更新）**: サーバー時刻が未確定 → `updated_at` が **null**
2. **2回目（確定）**: サーバーから正式な時刻が届く → `updated_at` に正しい値が入る

バグは1回目の発火で起きていた。

## 修正内容

### 修正1: `src/lib/database.ts`（subscribeToMemos 関数）

`updated_at` が null のときのフォールバックを変更:

```typescript
// 修正前（バグあり）
updated_at: data.updated_at
  ? convertTimestampToDate(data.updated_at)
  : new Date(),    // ← 現在時刻 → ローカルより新しくなり誤判定

// 修正後
updated_at: data.updated_at
  ? convertTimestampToDate(data.updated_at)
  : new Date(0),   // ← 1970年 → ローカルより古いので正しく判定される
```

**なぜ `new Date(0)` ?**
- `new Date(0)` は1970年1月1日（UNIX時間の起点）
- ローカルの `updated_at`（ユーザーが入力した時刻）より確実に古い
- これにより、比較ロジック `localMemo.updated_at > serverMemo.updated_at` が正しく動く
- ローカルが勝つので、編集中のデータが上書きされない

**他デバイスからの更新には影響しない:**
- 他デバイスからの変更は、サーバーで時刻が確定済みの状態で届く
- `updated_at` は null にならないため、フォールバックは使われない

### 修正2: `src/hooks/useMemoData.ts`（リアルタイム同期ロジック）

content が同じ場合はローカルのオブジェクトをそのまま返すように変更:

```typescript
// 修正前
if (localMemo && localMemo.updated_at > serverMemo.updated_at) {
  return localMemo
}
return serverMemo

// 修正後
if (localMemo) {
  if (localMemo.updated_at > serverMemo.updated_at) {
    return localMemo
  }
  // content が同じならローカルのオブジェクトを維持
  if (localMemo.content === serverMemo.content) {
    return localMemo
  }
}
return serverMemo
```

**なぜ content を比較する?**
- 自分の保存が確定して onSnapshot の2回目が発火した場合、content は同じ
- オブジェクト参照が変わると React が再レンダリングしてカーソルが飛ぶ
- 同じオブジェクト参照を返せば再レンダリングが起きず、カーソル位置が維持される

**配列全体の参照も維持する:**

修正1・2だけでは不十分だった。個々のメモのオブジェクト参照を維持しても、`fetchedMemos.map(...)` で**新しい配列**が作られるため、`memos` state が更新され再レンダリングが発生していた。

```typescript
// 全要素が同じ参照なら、元の配列をそのまま返す
// → React が「変更なし」と判断し、再レンダリングをスキップする
if (
  newMemos.length === prevMemos.length &&
  newMemos.every((memo, i) => memo === prevMemos[i])
) {
  return prevMemos  // ← 元の配列をそのまま返す
}
return newMemos
```

**なぜ配列の参照が重要?**
- `setMemos` の中で新しい配列を返すと、React は「state が変わった」と判断して再レンダリングする
- 元の配列（`prevMemos`）をそのまま返すと、React は `Object.is()` で「同じ」と判断して再レンダリングをスキップする
- 個々の要素が同じでも、配列自体が新しいオブジェクトなら React は変更ありと判断してしまう

### 修正3: `src/hooks/useMemoEditing.ts`（useRef で依存配列を最適化）

`handleMemoChange` の `useCallback` 依存配列に `memos` が入っていたことが、カーソル飛びのもう一つの原因だった:

```typescript
// 修正前（カーソル飛びあり）
const handleMemoChange = useCallback(
  (newContent: string) => {
    const currentMemo = memos[currentIndex]  // ← memos を直接参照
    // ...
  },
  [userId, memos, currentIndex, setMemos]    // ← memos が依存配列に入っている
)
```

**問題の流れ:**
```
1. onSnapshot 発火 → setMemos で memos が更新される
2. memos が変わった → handleMemoChange が新しい関数として再作成される
3. MemoEditor の onChange プロップが新しい関数になる
4. React.memo が「onChange が変わった」と判断 → MemoEditor を再レンダリング
5. textarea の value が再設定される → カーソルが文末に飛ぶ
```

**修正: useRef で最新の値を参照する**

```typescript
// useRef で最新の memos と currentIndex を保持する
// （値が変わっても再レンダリングは起きない）
const memosRef = useRef(memos)
memosRef.current = memos  // 毎回のレンダリングで最新の値を入れる

const currentIndexRef = useRef(currentIndex)
currentIndexRef.current = currentIndex

const handleMemoChange = useCallback(
  (newContent: string) => {
    // memos ではなく memosRef.current で参照
    const idx = currentIndexRef.current
    const currentMemo = memosRef.current[idx]
    // ...
  },
  [userId, setMemos]  // ← memos と currentIndex が不要になった！
)
```

**なぜ useRef ?**
- `useRef` は値が変わっても再レンダリングを起こさない（`useState` との違い）
- `.current` プロパティで常に最新の値にアクセスできる
- `useCallback` の依存配列に入れる必要がないため、関数が再作成されない
- 結果として MemoEditor の `onChange` プロップが安定し、React.memo が効く

## 学んだこと

### 1. `serverTimestamp()` と `onSnapshot` の挙動

- `serverTimestamp()` はクライアント側では値を持たない（サーバーで決まる）
- `onSnapshot` は楽観的更新で即座に発火するが、この時 `serverTimestamp()` のフィールドは null
- フォールバック値の選び方が重要（`new Date()` だと現在時刻になり比較が狂う）

### 2. React の再レンダリングとオブジェクト参照

- React は props のオブジェクト参照が変わると再レンダリングする
- 中身が同じでも `{ ...memo }` で新しいオブジェクトを作ると別物と判定される
- 内容が変わっていないなら、元のオブジェクトをそのまま返すことで不要な再レンダリングを防げる

### 3. デバウンス + リアルタイム同期の競合

- デバウンスで保存 → onSnapshot で通知 → ローカル State 更新、という流れで競合が起きやすい
- 「ローカルが編集中かどうか」を正しく判定する仕組みが必要
- 時刻比較だけでなく、content の一致も判定に使うとより安全

### 4. useRef と useState の使い分け

- **useState**: 値が変わったら画面を更新したいとき（例: メモの内容、ローディング状態）
- **useRef**: 値を参照したいだけで、画面の更新は不要なとき（例: タイマーID、最新の配列への参照）
- `useCallback` の依存配列に `useState` の値を入れると、値が変わるたびに関数が再作成される
- `useRef` なら依存配列に入れる必要がなく、関数の再作成を防げる

### 5. React の配列比較（Object.is）

- React の `setState` は `Object.is()` で新旧の値を比較する
- `[a, b, c]` と `[a, b, c]` は中身が同じでも**別の配列オブジェクト**なので `Object.is()` は `false`
- `map()` や `filter()` は常に新しい配列を返すため、中身が同じでも React は「変更あり」と判断する
- 元の配列をそのまま `return prevState` すれば、React は「変更なし」と判断して再レンダリングをスキップする
