# リアルタイム同期: Firebase vs Supabase 比較ガイド

## この文書について

Firestoreの `onSnapshot` と Supabaseの `Realtime` を比較し、リアルタイム同期の仕組みを学ぶ。
ちょいMEMOの実装を具体例として使用。

---

## 1. 基本概念の比較

| 項目 | Firebase (Firestore) | Supabase (Realtime) |
|---|---|---|
| プロトコル | 独自プロトコル（gRPC/WebChannel） | WebSocket |
| リスナー登録 | `onSnapshot()` | `channel.on('postgres_changes', ...)` |
| リスナー解除 | 戻り値の関数を呼ぶ | `supabase.removeChannel(channel)` |
| データ受信単位 | コレクション全体 or ドキュメント単体 | 変更があった行（INSERT/UPDATE/DELETE） |
| 初回データ | 最初のコールバックで全データが届く | 初回データは**届かない**（別途SELECTが必要） |
| サーバー側設定 | 不要（デフォルトで有効） | テーブルごとにReplication設定が必要 |

### 最大の違い: 初回データの扱い

```
Firebase:
  onSnapshot開始 → 即座に現在の全データが届く → 以降は差分が届く

Supabase:
  subscribe開始 → 何も届かない（変更があるまで待機）
  → 初回データは自分で SELECT する必要がある
```

---

## 2. コード比較: データベース層（database.ts / database.ts）

### Firebase版（現在のちょいMEMOの実装）

```typescript
import { onSnapshot, query, orderBy, collection } from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'

/**
 * メモをリアルタイム監視する関数
 * - onSnapshotは初回に全データ、以降は変更があるたびにコールバックを呼ぶ
 * - 戻り値の関数を呼ぶとリスナー解除
 */
export function subscribeToMemos(
  userId: string,
  onUpdate: (memos: Memo[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const memosRef = collection(db, `users/${userId}/memos`)
  const q = query(memosRef, orderBy('updated_at', 'desc'))

  // onSnapshotの戻り値 = リスナー解除関数
  return onSnapshot(
    q,
    (snapshot) => {
      // snapshot.docs に全ドキュメントが入っている
      const memos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      onUpdate(memos)
    },
    (error) => {
      onError?.(error)
    }
  )
}
```

**ポイント:**
- `onSnapshot` 1つで「初回取得」と「リアルタイム監視」を兼ねる
- コールバックには毎回**コレクション全体**のスナップショットが届く
- 戻り値がそのままリスナー解除関数

### Supabase版（同等の実装）

```typescript
import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * メモをリアルタイム監視する関数
 * - Supabaseでは初回データ取得とリアルタイム監視が別々
 * - channelオブジェクトを使ってリスナーを管理
 */
export function subscribeToMemos(
  userId: string,
  onUpdate: (memos: Memo[]) => void,
  onError?: (error: Error) => void
): () => void {

  // ---- 初回: SELECTで全データを取得（Supabaseは自動で届かない） ----
  const loadInitial = async () => {
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      onError?.(new Error(error.message))
      return
    }
    onUpdate(data as Memo[])
  }
  loadInitial()

  // ---- リアルタイム監視: postgres_changes をリッスン ----
  const channel: RealtimeChannel = supabase
    .channel(`memos:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',         // INSERT, UPDATE, DELETE すべて監視
        schema: 'public',
        table: 'memos',
        filter: `user_id=eq.${userId}`,  // このユーザーのメモだけ
      },
      (payload) => {
        // 変更があるたびに全データを再取得
        // （Supabaseは変更行だけ届くので、全体を再構築する必要がある）
        loadInitial()
      }
    )
    .subscribe()

  // リスナー解除関数を返す
  return () => {
    supabase.removeChannel(channel)
  }
}
```

**ポイント:**
- 初回データは `select()` で自分で取得する必要がある
- リアルタイム通知は**変更行のみ**（`payload.new` / `payload.old`）
- 全体の最新状態が欲しい場合は、通知をトリガーにして再SELECTする
- `filter` でユーザーのデータだけに絞れる（RLS併用推奨）

---

## 3. コード比較: Reactフック層（useMemoData.ts）

### Firebase版

```typescript
useEffect(() => {
  if (!userId) return

  // onSnapshotが初回データも返すので、これだけでOK
  const unsubscribe = subscribeToMemos(
    userId,
    (fetchedMemos) => {
      // 初回もリアルタイム更新も同じコールバックで処理
      setMemos(fetchedMemos)
      setLoading(false)
    }
  )

  // クリーンアップ: リスナー解除
  return () => unsubscribe()
}, [userId])
```

### Supabase版

```typescript
useEffect(() => {
  if (!userId) return

  // subscribeToMemos内部で初回SELECT + リアルタイム監視を行う
  // 構造はFirebase版と同じにできる（database層で吸収）
  const unsubscribe = subscribeToMemos(
    userId,
    (fetchedMemos) => {
      setMemos(fetchedMemos)
      setLoading(false)
    }
  )

  return () => unsubscribe()
}, [userId])
```

**結論:** database層で差異を吸収すれば、**フック層のコードはほぼ同じ**になる。
これがCLAUDE.mdで推奨している「データベース抽象化レイヤー」の利点。

---

## 4. 競合回避の比較

### 問題（両方共通）

```
ユーザー入力 → ローカルState更新 → デバウンス(500ms) → DB保存
                                     ↑
                この間にリアルタイム通知が来ると、
                ローカルの未保存データが古いサーバーデータで上書きされる
```

### Firebase版の競合回避

```typescript
setMemos(prevMemos => {
  return fetchedMemos.map(serverMemo => {
    const localMemo = prevMemos.find(m => m.id === serverMemo.id)
    // ローカルのupdated_atが新しい = 編集中（デバウンス未完了）
    if (localMemo && localMemo.updated_at > serverMemo.updated_at) {
      return localMemo  // ローカルを維持
    }
    return serverMemo
  })
})
```

### Supabase版の競合回避

```typescript
// Supabaseは変更行だけ届くので、
// payload.new の updated_at とローカルを比較
.on('postgres_changes', { event: 'UPDATE', ... }, (payload) => {
  const serverMemo = payload.new as Memo

  setMemos(prevMemos =>
    prevMemos.map(localMemo => {
      if (localMemo.id !== serverMemo.id) return localMemo
      // 同じタイムスタンプ比較で競合回避
      if (localMemo.updated_at > serverMemo.updated_at) {
        return localMemo
      }
      return serverMemo
    })
  )
})
```

**結論:** 競合回避のロジック（タイムスタンプ比較）は**どちらもまったく同じ考え方**。

---

## 5. サーバー側の設定比較

### Firebase

**追加設定不要。** Firestoreはデフォルトでリアルタイム対応。
セキュリティルールだけ設定すればOK。

### Supabase

**2つの設定が必要:**

#### (1) テーブルのReplication設定

Supabase Dashboard → Database → Replication で、監視したいテーブルを有効にする。

```sql
-- または SQLで設定
ALTER PUBLICATION supabase_realtime ADD TABLE memos;
```

#### (2) Row Level Security (RLS)

```sql
-- ユーザーが自分のメモだけ読み書きできるポリシー
-- （Firestoreのセキュリティルールに相当）
CREATE POLICY "Users can access own memos"
  ON memos
  FOR ALL
  USING (auth.uid() = user_id);
```

---

## 6. コスト・パフォーマンス比較

| 項目 | Firebase | Supabase |
|---|---|---|
| 課金対象 | リスナー接続中の読み取り回数 | 接続数（同時接続200まで無料） |
| 初回読み込み | ドキュメント数 × 1読み取り | 1クエリ |
| リアルタイム更新 | 変更ドキュメント × 1読み取り | 無料（WebSocketメッセージ） |
| コスト傾向 | データ変更が多いと高くなる | 同時接続が多いと高くなる |

### コスト例: 100メモを持つユーザーが1日使う場合

```
Firebase:
  初回読み込み: 100読み取り
  メモ10回編集: 10読み取り（変更分のみ）
  合計: 110読み取り/日

Supabase:
  初回読み込み: 1クエリ
  リアルタイム接続: 1接続（ずっと維持）
  メモ10回編集: 追加コストなし
  合計: 1クエリ + 1接続
```

---

## 7. まとめ: どちらを選ぶか

| 判断基準 | Firebase向き | Supabase向き |
|---|---|---|
| セットアップの手軽さ | ◎ 設定不要 | △ Replication設定が必要 |
| コスト（少人数） | ◎ 無料枠で十分 | ◎ 無料枠で十分 |
| コスト（大規模） | △ 読み取り課金が高い | ◎ 接続ベースで予測しやすい |
| データの柔軟性 | △ NoSQLの制約 | ◎ SQLで自由にクエリ |
| リアルタイムの粒度 | コレクション全体 | 行単位（INSERT/UPDATE/DELETE） |
| 移行の手間 | — | database層だけ書き換えればOK |

**現在のちょいMEMO（個人用・少量データ）**: Firebase が最適
**将来ユーザーが増えた場合**: Supabaseへの移行を検討（CLAUDE.md Phase 4）
