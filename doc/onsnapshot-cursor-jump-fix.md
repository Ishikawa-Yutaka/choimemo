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
