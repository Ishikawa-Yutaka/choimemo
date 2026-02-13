# デバイス判定のためのメディアクエリ

このドキュメントでは、PCとタッチデバイス（スマホ・タブレット）を判定するメディアクエリについて説明します。

## 目次
1. [基本構造](#基本構造)
2. [hover メディアクエリ](#hover-メディアクエリ)
3. [pointer メディアクエリ](#pointer-メディアクエリ)
4. [組み合わせパターン](#組み合わせパターン)
5. [実際の使用例](#実際の使用例)
6. [よくある間違い](#よくある間違い)

---

## 基本構造

```css
@media (条件1) and (条件2) {
  /* 条件1 AND 条件2が両方とも真の時に適用 */
}

@media (条件1) or (条件2) {
  /* 条件1 OR 条件2のどちらか一方でも真の時に適用 */
}
```

### 論理演算子

| 演算子 | 意味 | 例 |
|--------|------|-----|
| `and` | すべての条件が真 | `(hover: hover) and (pointer: fine)` |
| `or` | どれか一つでも真 | `(hover: none) or (pointer: coarse)` |
| `not` | 条件が偽 | `not all and (hover: hover)` |

---

## hover メディアクエリ

**デバイスがホバー機能（カーソルを要素の上に置く）をサポートしているかを判定**

### `hover: hover`
- **意味**: ホバー機能がある
- **対象デバイス**: PC、マウス付きデバイス
- **例**: デスクトップPC、ノートPC、マウス接続済みタブレット

```css
/* ホバー機能がある時のみ適用 */
@media (hover: hover) {
  .button:hover {
    background-color: blue;
  }
}
```

### `hover: none`
- **意味**: ホバー機能がない
- **対象デバイス**: タッチデバイス
- **例**: スマートフォン、タブレット（マウスなし）

```css
/* ホバー機能がない時のみ適用 */
@media (hover: none) {
  .button:active {
    background-color: blue;
  }
}
```

---

## pointer メディアクエリ

**デバイスのポインティング精度を判定**

### `pointer: fine`
- **意味**: 正確なポインティングができる
- **対象デバイス**: マウス、トラックパッド、ペンタブレット
- **特徴**: 小さいボタンでも正確にクリックできる

```css
/* 正確なポインティングができる時のみ適用 */
@media (pointer: fine) {
  .small-button {
    width: 20px;
    height: 20px;
  }
}
```

### `pointer: coarse`
- **意味**: ポインティング精度が粗い
- **対象デバイス**: タッチスクリーン
- **特徴**: 指でタップするので、小さいボタンは押しにくい

```css
/* ポインティング精度が粗い時のみ適用 */
@media (pointer: coarse) {
  .small-button {
    width: 44px; /* タップしやすいサイズに */
    height: 44px;
  }
}
```

### `pointer: none`
- **意味**: ポインティングデバイスがない
- **対象デバイス**: テレビのリモコン操作、音声操作など
- **使用頻度**: 低い

---

## 組み合わせパターン

### PC判定（推奨）

```css
/* PCまたはマウス付きデバイス */
@media (hover: hover) and (pointer: fine) {
  /* PC用のスタイル */
  .nav-arrow {
    display: flex; /* ナビゲーション矢印を表示 */
  }
}
```

**なぜ `and` を使うのか？**
- ホバー機能 **かつ** 正確なポインティング = 確実にPC
- より厳密にPCを判定できる

### タッチデバイス判定（推奨）

```css
/* スマホ・タブレット */
@media (hover: none) or (pointer: coarse) {
  /* タッチデバイス用のスタイル */
  .swipe-indicator {
    display: block; /* スワイプインジケーターを表示 */
  }
}
```

**なぜ `or` を使うのか？**
- 古いブラウザは `hover` だけサポートしている場合がある
- 古いブラウザは `pointer` だけサポートしている場合がある
- `or` を使うことで、どちらか一方でも検出できればタッチデバイスと判定
- より多くのデバイスで正しく動作する

---

## 実際の使用例

### 例1: ナビゲーション矢印（PC専用）

```css
/* ナビゲーション矢印のスタイル */
.nav-arrow {
  position: fixed;
  width: 48px;
  height: 48px;
  background-color: #facc15;
  /* 他のスタイル... */
}

/* PCでのみ表示 */
@media (hover: hover) and (pointer: fine) {
  .nav-arrow {
    display: flex;
  }
}

/* タッチデバイスでは非表示 */
@media (hover: none) or (pointer: coarse) {
  .nav-arrow {
    display: none;
  }
}
```

**理由**:
- PCはマウスドラッグやキーボード操作がメインなので矢印ボタンが便利
- スマホ・タブレットはスワイプ操作がメインなので矢印は不要

### 例2: スワイプインジケーター（タッチデバイス専用）

```css
/* スワイプ方向インジケーター */
.swipe-arrow-indicator {
  position: fixed;
  top: 50%;
  font-size: 80px;
  color: rgba(250, 204, 21, 0.8);
  /* 他のスタイル... */
}

/* タッチデバイスでのみ表示 */
@media (hover: none) or (pointer: coarse) {
  .swipe-arrow-indicator {
    display: block;
  }
}

/* PCでは非表示 */
@media (hover: hover) and (pointer: fine) {
  .swipe-arrow-indicator {
    display: none;
  }
}
```

**理由**:
- タッチデバイスではスワイプ操作のフィードバックが重要
- PCではマウスドラッグやキーボード操作があるので不要

### 例3: ボタンサイズの調整

```css
/* デフォルトのボタンサイズ */
.action-button {
  width: 32px;
  height: 32px;
  font-size: 16px;
}

/* タッチデバイス用（大きめサイズ） */
@media (pointer: coarse) {
  .action-button {
    width: 44px; /* 最低44px × 44pxが推奨 */
    height: 44px;
    font-size: 20px;
  }
}
```

**理由**:
- 指でのタップは、マウスクリックより面積が大きい
- Apple、Googleともに最低44px × 44pxのタップ領域を推奨

### 例4: ホバーエフェクト

```css
/* タッチデバイス用（:activeを使用） */
@media (hover: none) {
  .button:active {
    background-color: #fbbf24;
    transform: scale(0.95);
  }
}

/* PC用（:hoverを使用） */
@media (hover: hover) {
  .button:hover {
    background-color: #fbbf24;
    transform: scale(1.05);
  }

  .button:active {
    transform: scale(0.95);
  }
}
```

**理由**:
- タッチデバイスは `:hover` が使えないので `:active` で代用
- PCは `:hover` と `:active` の両方が使える

---

## よくある間違い

### ❌ 間違い1: 画面サイズでデバイスを判定

```css
/* 悪い例 */
@media (max-width: 768px) {
  /* これはスマホかもしれないし、小さいPC画面かもしれない */
  .nav-arrow {
    display: none;
  }
}
```

**問題点**:
- タブレットを横向きにすると1024pxになる
- 小さいノートPCの画面は1366pxくらい
- ウィンドウを小さくしたPCもスマホ扱いになってしまう

### ✅ 正しい方法: 入力デバイスで判定

```css
/* 良い例 */
@media (hover: hover) and (pointer: fine) {
  /* 確実にマウスがあるデバイス */
  .nav-arrow {
    display: flex;
  }
}
```

### ❌ 間違い2: タッチデバイス判定で `and` を使う

```css
/* 悪い例 */
@media (hover: none) and (pointer: coarse) {
  /* 古いブラウザでは動かない可能性がある */
  .swipe-indicator {
    display: block;
  }
}
```

**問題点**:
- 古いブラウザで片方しかサポートされていない場合、判定に失敗する

### ✅ 正しい方法: `or` を使う

```css
/* 良い例 */
@media (hover: none) or (pointer: coarse) {
  /* どちらか一方でも検出できればタッチデバイスと判定 */
  .swipe-indicator {
    display: block;
  }
}
```

### ❌ 間違い3: モバイル専用CSSで画面サイズだけ使う

```css
/* 悪い例 */
@media (max-width: 768px) {
  .touch-only-feature {
    display: block;
  }
}
```

**問題点**:
- ウィンドウを小さくしたPCでもタッチ機能が表示されてしまう

### ✅ 正しい方法: 入力方法で判定

```css
/* 良い例 */
@media (hover: none) or (pointer: coarse) {
  .touch-only-feature {
    display: block;
  }
}
```

---

## まとめ

### デバイス判定の推奨パターン

| 目的 | メディアクエリ | 対象デバイス |
|------|--------------|------------|
| **PC専用UI** | `(hover: hover) and (pointer: fine)` | PC、マウス付きデバイス |
| **タッチ専用UI** | `(hover: none) or (pointer: coarse)` | スマホ、タブレット |
| **大きなタップ領域** | `(pointer: coarse)` | タッチデバイス |
| **ホバーエフェクト** | `(hover: hover)` | ホバー可能なデバイス |

### 重要なポイント

1. **画面サイズではなく入力方法で判定する**
   - `max-width` ではなく `hover` や `pointer` を使う

2. **PC判定には `and` を使う**
   - `(hover: hover) and (pointer: fine)` = 確実にPC

3. **タッチデバイス判定には `or` を使う**
   - `(hover: none) or (pointer: coarse)` = 互換性が高い

4. **タップ領域は最低 44px × 44px**
   - 指でタップしやすいサイズを確保

5. **ホバーエフェクトは慎重に**
   - タッチデバイスでは `:active` を使う
   - PCでは `:hover` と `:active` の両方を使う

### 参考リンク

- [MDN: @media (hover)](https://developer.mozilla.org/ja/docs/Web/CSS/@media/hover)
- [MDN: @media (pointer)](https://developer.mozilla.org/ja/docs/Web/CSS/@media/pointer)
- [Apple Human Interface Guidelines: Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Material Design: Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
