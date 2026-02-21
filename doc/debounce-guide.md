# デバウンス（Debounce）実装ガイド

## デバウンスとは

**デバウンス（debounce）**は、連続して発生するイベントを「まとめて1回だけ実行する」プログラミングテクニックです。

「入力が落ち着くまで待つ」という考え方で、無駄な処理を減らし、パフォーマンスとコストを改善します。

---

## 具体例：メモアプリでの自動保存

### ❌ デバウンスなしの場合

ユーザーが「こんにちは」と入力すると：

```
「こ」入力        → Firestoreに保存！（1回目）
「こん」入力      → Firestoreに保存！（2回目）
「こんに」入力    → Firestoreに保存！（3回目）
「こんにち」入力  → Firestoreに保存！（4回目）
「こんにちは」入力 → Firestoreに保存！（5回目）
```

**問題点：**
- 5回もFirestoreに書き込みが発生
- 無料枠をすぐに使い切る（Firestore: 20,000 writes/day）
- サーバー負荷が高い
- コストが高い

---

### ✅ デバウンスありの場合（500ms）

```
「こ」入力        → タイマー開始（500ms後に保存予定）
「こん」入力      → 前のタイマーキャンセル、新しいタイマー開始
「こんに」入力    → 前のタイマーキャンセル、新しいタイマー開始
「こんにち」入力  → 前のタイマーキャンセル、新しいタイマー開始
「こんにちは」入力 → 前のタイマーキャンセル、新しいタイマー開始
（ユーザーが入力を止める）
500ms経過        → Firestoreに保存！（1回だけ）
```

**メリット：**
- ✅ **1回だけ保存**される（効率的）
- ✅ Firestore書き込み回数を大幅削減
- ✅ コスト削減
- ✅ サーバー負荷を軽減
- ✅ ユーザー体験は損なわない（画面はすぐ更新される）

---

## デバウンスの仕組み

### 基本的な流れ

1. **イベント発生（入力など）**
   - タイマーをセット：「500ms後に処理を実行するよ」

2. **次のイベントが来たら**
   - 前のタイマーをキャンセル：「やっぱりまだ実行しない」
   - 新しいタイマーをセット：「また500ms後に実行するよ」

3. **イベントが止まったら**
   - タイマーが完了するまで待つ

4. **500ms経過**
   - **初めて処理を実行**

### 図解

```
時間軸 →

入力「こ」   入力「ん」   入力「に」   [500ms待機]   保存！
  ↓          ↓          ↓
タイマー開始  リセット    リセット
[500ms]     [500ms]    [500ms]
  ✗          ✗          ✓（完了）
```

---

## コード実装例

### TypeScript + React での実装

```typescript
import { useRef, useEffect } from 'react'

const useDebouncedSave = () => {
  // タイマーIDを保持するRef
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // コンポーネントアンマウント時にタイマーをクリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // デバウンス付き保存関数
  const handleMemoChange = (newContent: string) => {
    // 1. 画面表示を即座に更新（ローカルState）
    setMemos((prevMemos) =>
      prevMemos.map((memo, index) =>
        index === currentIndex
          ? { ...memo, content: newContent }
          : memo
      )
    )

    // 2. 前回のタイマーが残っていればキャンセル
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 3. 新しいタイマーをセット（500ms後に保存）
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // 4. 500ms経過後、Firestoreに保存
        await updateMemo(userId, memoId, { content: newContent })
        console.log('メモを自動保存しました')
      } catch (error) {
        console.error('メモの更新に失敗しました:', error)
      }
    }, 500) // 500ms = 0.5秒のデバウンス
  }

  return { handleMemoChange }
}
```

---

## よくある質問

### Q1: 変換中（IME入力中）はどうなる？

**A:** 変換中も`onChange`イベントは発火するので、変換のたびにタイマーがリセットされます。

```
「こんにちは」と入力する場合：

1. 「こ」入力 → タイマー開始
2. 「ん」入力 → タイマーリセット
3. 「に」入力 → タイマーリセット
4. 「ち」入力 → タイマーリセット
5. 「は」入力 → タイマーリセット
6. 変換開始（「こんにちは」→「今日は」など） → タイマーリセット
7. 変換確定（Enter） → タイマーリセット
8. （ユーザーが入力を完全に止める）
9. 500ms経過 → 保存！
```

**ポイント：**
- ❌ 「確定したら500ms後」ではない
- ✅ **「最後に何か入力してから500ms後」**

---

### Q2: デバウンス時間はどう決める？

**推奨値：**
- **検索ボックス**: 300〜500ms
- **自動保存**: 500〜1000ms
- **リサイズ処理**: 100〜300ms

**考え方：**
- 短すぎる → 処理が頻繁に実行される（デバウンスの意味が薄い）
- 長すぎる → ユーザーが「保存されてない？」と不安になる

このアプリでは **500ms（0.5秒）** を採用：
- ユーザーが入力を止めてから0.5秒で保存
- 無駄な保存を減らしつつ、体感的に「すぐ保存される」感覚

---

### Q3: 画面の表示はいつ更新される？

**A:** 即座に更新されます。

デバウンスは「Firestoreへの保存」だけを遅延させています。

```typescript
// 1. 画面表示を即座に更新（ローカルState）
setMemos((prevMemos) => ...)

// 2. Firestoreへの保存は500ms後（デバウンス）
setTimeout(async () => {
  await updateMemo(...)
}, 500)
```

**ユーザー体験：**
- 入力した文字はすぐに画面に表示される
- Firestoreへの保存だけが遅延される
- ユーザーは「遅い」と感じない

---

### Q4: useRefを使う理由は？

**A:** タイマーIDを保持するためです。

**useStateとの違い：**

```typescript
// ❌ useStateを使った場合
const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null)
// 問題: setTimeId()を呼ぶたびに再レンダリングが発生してしまう

// ✅ useRefを使った場合
const timerIdRef = useRef<NodeJS.Timeout | null>(null)
// メリット: 値を変更しても再レンダリングされない
```

**useRefの特徴：**
- 値が変わっても再レンダリングされない
- コンポーネントのライフサイクル全体で値を保持
- タイマーID、DOM参照などの保持に最適

---

## 他の使用例

### 1. 検索ボックス

```typescript
const SearchBox = () => {
  const [query, setQuery] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (value: string) => {
    setQuery(value) // 画面表示を即座に更新

    // 前回の検索タイマーをキャンセル
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 500ms後に検索APIを呼ぶ
    debounceTimerRef.current = setTimeout(async () => {
      const results = await searchAPI(value)
      setResults(results)
    }, 500)
  }

  return (
    <input
      value={query}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="検索..."
    />
  )
}
```

**効果：**
- 「と」「とう」「とうきょう」と入力しても、APIは1回だけ呼ばれる
- サーバー負荷を大幅削減

---

### 2. ウィンドウリサイズ

```typescript
useEffect(() => {
  let resizeTimer: NodeJS.Timeout | null = null

  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)

    resizeTimer = setTimeout(() => {
      console.log('リサイズ完了:', window.innerWidth)
      // 重い処理をここで実行
    }, 300)
  }

  window.addEventListener('resize', handleResize)

  return () => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
  }
}, [])
```

**効果：**
- ウィンドウリサイズ中は処理をスキップ
- リサイズが止まった300ms後に1回だけ実行

---

### 3. スクロール検知

```typescript
useEffect(() => {
  let scrollTimer: NodeJS.Timeout | null = null

  const handleScroll = () => {
    if (scrollTimer) clearTimeout(scrollTimer)

    scrollTimer = setTimeout(() => {
      console.log('スクロール停止:', window.scrollY)
      // 無限スクロールの次ページ読み込みなど
    }, 200)
  }

  window.addEventListener('scroll', handleScroll)

  return () => {
    window.removeEventListener('scroll', handleScroll)
    if (scrollTimer) clearTimeout(scrollTimer)
  }
}, [])
```

---

## スロットル（Throttle）との違い

デバウンスと似た概念に「スロットル」があります。

### デバウンス（Debounce）
**「イベントが止まるまで待つ」**

```
イベント: ●●●●●　　　　　実行！
処理:     　　　　500ms後→ ■
```

**使いどころ：**
- 自動保存
- 検索ボックス
- ウィンドウリサイズ

---

### スロットル（Throttle）
**「一定間隔で必ず実行する」**

```
イベント: ●●●●●●●●●●●●
処理:     ■　　　　■　　　　■
         500ms   500ms
```

**使いどころ：**
- スクロール位置の追跡
- マウス移動の追跡
- ゲームのフレーム更新

---

### どちらを使うか？

| シーン | 推奨 | 理由 |
|--------|------|------|
| 自動保存 | デバウンス | 入力が止まったら保存すればいい |
| 検索ボックス | デバウンス | 入力が止まったら検索すればいい |
| スクロール追跡 | スロットル | 一定間隔で位置を記録したい |
| 無限スクロール | デバウンス | スクロールが止まったら次ページ読み込み |

---

## まとめ

### デバウンスの要点

1. **目的**: 連続イベントをまとめて1回だけ実行
2. **仕組み**: 「最後のイベントから指定時間経過後に実行」
3. **メリット**: パフォーマンス向上、コスト削減、サーバー負荷軽減
4. **実装**: `setTimeout` + `clearTimeout` + `useRef`

### コード実装の基本パターン

```typescript
// 1. タイマーIDを保持するRef
const timerRef = useRef<NodeJS.Timeout | null>(null)

// 2. クリーンアップ
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }
}, [])

// 3. デバウンス処理
const handleEvent = (value: string) => {
  // 画面は即座に更新
  setLocalState(value)

  // 前のタイマーをキャンセル
  if (timerRef.current) {
    clearTimeout(timerRef.current)
  }

  // 新しいタイマーをセット
  timerRef.current = setTimeout(async () => {
    // 重い処理（API呼び出しなど）
    await saveToServer(value)
  }, 500)
}
```

### ちょいMEMOでの使用例

**ファイル**: `src/hooks/useMemoEditing.ts`

- 入力のたびに画面を即座に更新
- 500ms後にFirestoreに自動保存
- 連続入力時は保存をスキップ
- 無料枠を効率的に使用

---

## 参考リンク

- [MDN - setTimeout](https://developer.mozilla.org/ja/docs/Web/API/setTimeout)
- [MDN - clearTimeout](https://developer.mozilla.org/ja/docs/Web/API/clearTimeout)
- [React Hooks - useRef](https://react.dev/reference/react/useRef)
- [React Hooks - useEffect](https://react.dev/reference/react/useEffect)

---

## おわりに

デバウンスは、パフォーマンス最適化の基本テクニックです。

適切に使うことで：
- ✅ ユーザー体験を損なわずにコスト削減
- ✅ サーバー負荷を軽減
- ✅ アプリの快適性を向上

ぜひ他のプロジェクトでも活用してください！
