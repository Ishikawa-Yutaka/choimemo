# イベントバブリングと stopPropagation() の解説

## 概要

`event.stopPropagation()` は、**イベントが親要素に伝わるのを止める**標準JavaScriptの関数です。

- **技術元**: 標準JavaScript（DOM API）
- **Reactでの扱い**: SyntheticEvent（合成イベント）でラップされているが、使い方は同じ
- **よく使う場面**: 入れ子になったクリック可能な要素がある時

---

## イベントバブリング（Event Bubbling）とは

### 基本的な仕組み

HTML要素は階層構造になっています。子要素でイベントが発生すると、そのイベントは親要素へ、さらにその親要素へと「浮かび上がる（バブル）」ように伝わっていきます。

```html
<div>                    ← 祖父要素
  <div>                  ← 親要素
    <button>クリック</button>  ← 子要素（ここをクリック）
  </div>
</div>
```

ボタンをクリックすると：
```
1. button のクリックイベント発火
   ↓（バブリング）
2. 親 div のクリックイベント発火
   ↓（バブリング）
3. 祖父 div のクリックイベント発火
```

このように、**イベントが下から上へ伝わる仕組み**を「イベントバブリング」と言います。

---

## 問題が起こる例

### HTML構造

```html
<div class="memo-item" onclick="openMemo()">
  <p>メモの内容</p>
  <button onclick="deleteMemo()">🗑️ 削除</button>
</div>
```

### 削除ボタンをクリックした時

```
1. 削除ボタンのクリックイベント発火
   → deleteMemo() が実行される
   ↓（イベントバブリング発生）
2. 親要素（.memo-item）のクリックイベントも発火
   → openMemo() も実行される 💥
```

**結果**: 削除とメモを開く処理が両方実行されてしまう！

---

## stopPropagation() で解決

### 使い方

```javascript
button.addEventListener('click', (event) => {
  event.stopPropagation() // イベントの伝播をストップ
  deleteMemo()
})
```

### Reactでの使い方

```tsx
<div className="memo-item" onClick={openMemo}>
  <p>メモの内容</p>
  <button onClick={(e) => {
    e.stopPropagation() // ← ここで親への伝播を止める
    deleteMemo()
  }}>
    🗑️ 削除
  </button>
</div>
```

### 動作

```
1. 削除ボタンのクリックイベント発火
   → deleteMemo() が実行される
   → stopPropagation() で伝播をストップ ✋

2. 親要素にはイベントが伝わらない
   → openMemo() は実行されない ✅
```

---

## 実際のコード例（ちょいMEMOアプリ）

### MemoList.tsx の実装

```tsx
// メモアイテム全体（クリックでメモを開く）
<button
  className="memo-list-item"
  onClick={() => {
    onMemoClick(index)  // メモを開く処理
    onClose()
  }}
>
  <div className="memo-list-item-preview">
    {getPreviewText(memo.content)}
  </div>

  {/* 削除ボタン */}
  <button
    className="memo-list-item-delete"
    onClick={(event) => {
      // ★重要: イベントの伝播を止める
      event.stopPropagation()

      // 削除確認ダイアログ
      const confirmed = window.confirm('このメモを削除しますか？')
      if (!confirmed) return

      // 削除処理
      onMemoDelete(index)
    }}
  >
    <HiOutlineTrash />
  </button>
</button>
```

### stopPropagation() がない場合

```
削除ボタンをクリック
  ↓
1. 削除処理が実行される
  ↓（イベントバブリング）
2. 親要素（メモアイテム）のonClickも発火
  ↓
3. onMemoClick(index) が実行される
  ↓
4. 削除したばかりのメモを開こうとしてエラー 💥
```

### stopPropagation() がある場合

```
削除ボタンをクリック
  ↓
1. event.stopPropagation() でストップ
  ↓
2. 削除処理が実行される
  ↓
3. 親要素には伝わらない
  ↓
4. 削除だけが実行される ✅
```

---

## 他の関連メソッド

### 1. `event.preventDefault()`

**役割**: ブラウザのデフォルト動作を止める

```tsx
// リンクのデフォルト動作（ページ遷移）を止める
<a href="/page" onClick={(e) => {
  e.preventDefault() // ページ遷移しない
  console.log('クリックされたけど遷移しない')
}}>
  リンク
</a>

// フォーム送信のデフォルト動作を止める
<form onSubmit={(e) => {
  e.preventDefault() // ページリロードしない
  handleSubmit()     // 独自の送信処理
}}>
```

### 2. `event.stopImmediatePropagation()`

**役割**: イベントの伝播を止める + 同じ要素の他のイベントリスナーも止める

```javascript
button.addEventListener('click', (e) => {
  e.stopImmediatePropagation()
  console.log('1つ目のリスナー')
})

button.addEventListener('click', (e) => {
  // ↑で stopImmediatePropagation() が呼ばれたので、
  // このリスナーは実行されない
  console.log('2つ目のリスナー')
})
```

---

## まとめ

| メソッド | 役割 | 使用例 |
|---------|------|--------|
| `stopPropagation()` | イベントが親要素に伝わるのを止める | 入れ子のクリック可能要素 |
| `preventDefault()` | ブラウザのデフォルト動作を止める | フォーム送信、リンクのページ遷移 |
| `stopImmediatePropagation()` | 伝播 + 同じ要素の他のリスナーも止める | 複数リスナーの制御 |

---

## イベントバブリングの3つのフェーズ

実際には、イベントは3つのフェーズを経て伝わります：

```
1. キャプチャフェーズ（Capture Phase）
   ルート → ターゲットに向かって下る

2. ターゲットフェーズ（Target Phase）
   ターゲット要素でイベント発火

3. バブリングフェーズ（Bubbling Phase）
   ターゲット → ルートに向かって上る ← stopPropagation()で止めるのはここ
```

```html
<html>              ← (1) キャプチャ開始
  <body>            ← (2)
    <div>           ← (3)
      <button>      ← (4) ターゲット要素（ここをクリック）
                       (5) バブリング開始
    </div>          ← (6)
  </body>           ← (7)
</html>             ← (8) バブリング終了
```

通常は**バブリングフェーズ**でイベントリスナーが実行されます。

---

## React での SyntheticEvent（合成イベント）

Reactでは、ブラウザのネイティブイベントをラップした「SyntheticEvent」を使います。

### なぜラップするのか？

- ブラウザ間の互換性を保つため
- Reactの独自最適化のため
- イベントプーリング（パフォーマンス向上）のため

### 使い方は標準JavaScriptと同じ

```tsx
// 標準JavaScript
element.addEventListener('click', (event) => {
  event.stopPropagation()
})

// React（同じ書き方）
<button onClick={(event) => {
  event.stopPropagation()
}}>
```

### SyntheticEvent の特徴

```tsx
const handleClick = (event: React.MouseEvent) => {
  console.log(event.type)        // "click"
  console.log(event.target)      // クリックされた要素
  console.log(event.currentTarget) // イベントリスナーがついている要素

  event.stopPropagation()  // 標準と同じ
  event.preventDefault()   // 標準と同じ
}
```

---

## よくある使用例

### 1. モーダルの外側クリックで閉じる

```tsx
<div className="modal-overlay" onClick={closeModal}>
  <div className="modal-content" onClick={(e) => {
    e.stopPropagation() // モーダル内部のクリックは親に伝えない
  }}>
    モーダルの内容
  </div>
</div>
```

### 2. ドロップダウンメニュー

```tsx
<div className="dropdown" onClick={openDropdown}>
  ドロップダウン
  <div className="dropdown-menu" onClick={(e) => {
    e.stopPropagation() // メニュー内のクリックは親に伝えない
  }}>
    <button>オプション1</button>
    <button>オプション2</button>
  </div>
</div>
```

### 3. リスト内のアクションボタン

```tsx
<div className="list-item" onClick={openItem}>
  <span>アイテム名</span>
  <button onClick={(e) => {
    e.stopPropagation() // 編集ボタンのクリックは親に伝えない
    editItem()
  }}>
    編集
  </button>
  <button onClick={(e) => {
    e.stopPropagation() // 削除ボタンのクリックは親に伝えない
    deleteItem()
  }}>
    削除
  </button>
</div>
```

---

## デバッグ方法

イベントバブリングの動作を確認するには：

```tsx
<div onClick={(e) => {
  console.log('祖父がクリックされた', e.currentTarget)
}}>
  祖父
  <div onClick={(e) => {
    console.log('親がクリックされた', e.currentTarget)
  }}>
    親
    <button onClick={(e) => {
      console.log('子がクリックされた', e.currentTarget)
      // e.stopPropagation() をコメントアウト/アンコメントして試す
    }}>
      子ボタン
    </button>
  </div>
</div>
```

---

## まとめ

- **イベントバブリング**: 子要素のイベントが親要素に伝わる仕組み
- **stopPropagation()**: イベントの伝播を止める標準JavaScript関数
- **Reactでも同じように使える**: SyntheticEventでラップされているが、APIは同じ
- **よくある使用例**: 入れ子のクリック可能要素、モーダル、ドロップダウンなど

入れ子構造でクリックイベントを扱う時は、必ず「イベントバブリングが起こるかも？」と意識しましょう！
