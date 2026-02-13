# Firebase Firestore 関数リファレンス

このドキュメントでは、Firebase Firestore SDKが提供する主要な関数について説明します。

## 目次
1. [Firestoreとは](#firestoreとは)
2. [関数のインポート](#関数のインポート)
3. [参照系関数](#参照系関数)
4. [クエリ系関数](#クエリ系関数)
5. [読み取り系関数](#読み取り系関数)
6. [書き込み系関数](#書き込み系関数)
7. [タイムスタンプ系](#タイムスタンプ系)
8. [実践例](#実践例)
9. [よくあるパターン](#よくあるパターン)

---

## Firestoreとは

**Cloud Firestore** = Googleが提供するNoSQLクラウドデータベース

### 特徴
- リアルタイムでデータ同期
- オフライン対応
- 自動スケーリング
- セキュリティルールで保護

### データ構造

```
コレクション
  └── ドキュメント
       ├── フィールド1: 値
       ├── フィールド2: 値
       └── サブコレクション
            └── サブドキュメント
```

**このアプリの構造**:
```
users (コレクション)
  └── user123 (ドキュメント)
       └── memos (サブコレクション)
            ├── memo001 (ドキュメント)
            │    ├── content: "メモの内容"
            │    ├── created_at: タイムスタンプ
            │    └── updated_at: タイムスタンプ
            └── memo002 (ドキュメント)
                 ├── content: "別のメモ"
                 ├── created_at: タイムスタンプ
                 └── updated_at: タイムスタンプ
```

---

## 関数のインポート

```typescript
import {
  // 参照系
  collection,    // コレクションへの参照
  doc,          // ドキュメントへの参照

  // クエリ系
  query,        // クエリの作成
  where,        // フィルター条件
  orderBy,      // ソート条件
  limit,        // 件数制限
  startAfter,   // ページネーション

  // 読み取り系
  getDoc,       // 1つのドキュメントを取得
  getDocs,      // 複数のドキュメントを取得
  onSnapshot,   // リアルタイム監視

  // 書き込み系
  addDoc,       // 新規作成（IDは自動生成）
  setDoc,       // 新規作成または上書き（IDを指定）
  updateDoc,    // 更新（一部フィールドのみ）
  deleteDoc,    // 削除

  // タイムスタンプ
  serverTimestamp, // サーバーの現在時刻
  Timestamp,       // Firestoreのタイムスタンプ型
} from 'firebase/firestore'
```

---

## 参照系関数

### `collection()` - コレクションへの参照

**コレクション（ドキュメントの集まり）への参照を取得**

```typescript
collection(firestore, path)
```

**パラメータ**:
- `firestore`: Firestoreインスタンス（`db`）
- `path`: コレクションへのパス（文字列）

**例**:
```typescript
import { db } from './firebase'

// トップレベルのコレクション
const usersRef = collection(db, 'users')

// サブコレクション
const memosRef = collection(db, 'users/user123/memos')
const memosRef2 = collection(db, `users/${userId}/memos`) // 変数も使える
```

**返り値**: `CollectionReference` オブジェクト

---

### `doc()` - ドキュメントへの参照

**特定のドキュメントへの参照を取得**

```typescript
doc(firestore, path)
// または
doc(collectionRef, documentId)
```

**例**:
```typescript
// パターン1: パス文字列で指定
const memoRef = doc(db, 'users/user123/memos/memo456')

// パターン2: コレクション参照 + ID
const memosRef = collection(db, 'users/user123/memos')
const memoRef = doc(memosRef, 'memo456')

// パターン3: 変数を使う
const memoRef = doc(db, `users/${userId}/memos/${memoId}`)
```

**返り値**: `DocumentReference` オブジェクト

---

## クエリ系関数

### `query()` - クエリの作成

**検索条件やソート順を指定してクエリを作成**

```typescript
query(collectionRef, ...queryConstraints)
```

**パラメータ**:
- `collectionRef`: コレクション参照
- `queryConstraints`: 検索条件（複数指定可能）

**例**:
```typescript
import { query, where, orderBy, limit } from 'firebase/firestore'

const memosRef = collection(db, 'users/user123/memos')

// 例1: ソートのみ
const q = query(memosRef, orderBy('updated_at', 'desc'))

// 例2: フィルター + ソート
const q = query(
  memosRef,
  where('content', '!=', ''),  // 空でないメモ
  orderBy('updated_at', 'desc')
)

// 例3: フィルター + ソート + 件数制限
const q = query(
  memosRef,
  where('created_at', '>', startDate),
  orderBy('created_at', 'desc'),
  limit(10)  // 最新10件
)
```

**返り値**: `Query` オブジェクト

---

### `orderBy()` - ソート条件

**取得するデータのソート順を指定**

```typescript
orderBy(fieldPath, directionStr)
```

**パラメータ**:
- `fieldPath`: ソートするフィールド名
- `directionStr`: ソート方向
  - `'asc'` = 昇順（古い → 新しい、小さい → 大きい）
  - `'desc'` = 降順（新しい → 古い、大きい → 小さい）

**例**:
```typescript
// 更新日時が新しい順
orderBy('updated_at', 'desc')
// 結果: 2024/01/03, 2024/01/02, 2024/01/01

// 作成日時が古い順
orderBy('created_at', 'asc')
// 結果: 2024/01/01, 2024/01/02, 2024/01/03

// 複数フィールドでソート
const q = query(
  memosRef,
  orderBy('category', 'asc'),   // カテゴリ順
  orderBy('updated_at', 'desc') // 各カテゴリ内で新しい順
)
```

---

### `where()` - フィルター条件

**特定の条件に合うデータだけを取得**

```typescript
where(fieldPath, opStr, value)
```

**パラメータ**:
- `fieldPath`: フィールド名
- `opStr`: 比較演算子
  - `'=='` = 等しい
  - `'!='` = 等しくない
  - `'<'` = より小さい
  - `'<='` = 以下
  - `'>'` = より大きい
  - `'>='` = 以上
  - `'in'` = 配列の中に含まれる
  - `'array-contains'` = 配列フィールドに含まれる
- `value`: 比較する値

**例**:
```typescript
// 空でないメモだけ
where('content', '!=', '')

// 2024年1月以降のメモ
where('created_at', '>=', new Date('2024-01-01'))

// 特定のカテゴリ
where('category', '==', 'work')

// 複数の値のいずれか
where('status', 'in', ['draft', 'published'])

// 配列に特定の値が含まれる
where('tags', 'array-contains', 'important')
```

**注意点**:
- `!=` や `in` を使う場合、インデックスが必要な場合がある
- 複数の `where` を組み合わせる場合、Firebaseが自動でインデックスを作成するよう促す

---

### `limit()` - 件数制限

**取得するドキュメント数を制限**

```typescript
limit(count)
```

**例**:
```typescript
// 最新10件だけ取得
const q = query(
  memosRef,
  orderBy('updated_at', 'desc'),
  limit(10)
)
```

---

### `startAfter()` - ページネーション

**特定のドキュメントの後から取得（ページング）**

```typescript
startAfter(snapshot)
```

**例**:
```typescript
// 1ページ目（最初の10件）
const firstPageQuery = query(
  memosRef,
  orderBy('updated_at', 'desc'),
  limit(10)
)
const firstPageSnapshot = await getDocs(firstPageQuery)

// 最後のドキュメントを取得
const lastDoc = firstPageSnapshot.docs[firstPageSnapshot.docs.length - 1]

// 2ページ目（次の10件）
const secondPageQuery = query(
  memosRef,
  orderBy('updated_at', 'desc'),
  startAfter(lastDoc),  // 最後のドキュメントの次から
  limit(10)
)
```

---

## 読み取り系関数

### `getDocs()` - 複数のドキュメントを取得

**クエリに合致する全ドキュメントを取得**

```typescript
getDocs(query)
```

**パラメータ**:
- `query`: クエリまたはコレクション参照

**返り値**: `QuerySnapshot` オブジェクト

**例**:
```typescript
const memosRef = collection(db, `users/${userId}/memos`)
const q = query(memosRef, orderBy('updated_at', 'desc'))

// データを取得
const snapshot = await getDocs(q)

// 取得したドキュメントを処理
snapshot.docs.forEach((doc) => {
  console.log(doc.id, doc.data())
})

// または、配列に変換
const memos = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data()
}))
```

**QuerySnapshotのプロパティ**:
- `snapshot.docs` = ドキュメントの配列
- `snapshot.size` = ドキュメント数
- `snapshot.empty` = 空かどうか（true/false）

---

### `getDoc()` - 1つのドキュメントを取得

**特定のドキュメントを1つ取得**

```typescript
getDoc(documentRef)
```

**パラメータ**:
- `documentRef`: ドキュメント参照

**返り値**: `DocumentSnapshot` オブジェクト

**例**:
```typescript
const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

// ドキュメントを取得
const snapshot = await getDoc(memoRef)

// 存在チェック
if (snapshot.exists()) {
  const data = snapshot.data()
  console.log('メモの内容:', data.content)
} else {
  console.log('メモが見つかりません')
}
```

**DocumentSnapshotのプロパティ**:
- `snapshot.exists()` = ドキュメントが存在するか
- `snapshot.data()` = ドキュメントのデータ
- `snapshot.id` = ドキュメントID

---

### `onSnapshot()` - リアルタイム監視

**データの変更をリアルタイムで監視**

```typescript
onSnapshot(query, callback)
```

**例**:
```typescript
const memosRef = collection(db, `users/${userId}/memos`)
const q = query(memosRef, orderBy('updated_at', 'desc'))

// リアルタイム監視を開始
const unsubscribe = onSnapshot(q, (snapshot) => {
  // データが変更されるたびに実行される
  const memos = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data()
  }))

  console.log('最新のメモ一覧:', memos)
})

// 監視を停止する時（コンポーネントのアンマウント時など）
unsubscribe()
```

**使用例（React）**:
```typescript
useEffect(() => {
  const q = query(memosRef, orderBy('updated_at', 'desc'))

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const memos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setMemos(memos)
  })

  // クリーンアップ
  return () => unsubscribe()
}, [])
```

---

## 書き込み系関数

### `addDoc()` - 新規作成（ID自動生成）

**新しいドキュメントを作成（IDは自動生成）**

```typescript
addDoc(collectionRef, data)
```

**パラメータ**:
- `collectionRef`: コレクション参照
- `data`: 保存するデータ（オブジェクト）

**返り値**: 作成されたドキュメントの参照

**例**:
```typescript
const memosRef = collection(db, `users/${userId}/memos`)

// 新しいメモを作成
const docRef = await addDoc(memosRef, {
  content: '新しいメモの内容',
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
})

console.log('作成されたメモID:', docRef.id)
// 例: "abc123xyz456" (Firestoreが自動生成)
```

---

### `setDoc()` - 新規作成または上書き（ID指定）

**ドキュメントを作成または上書き（IDを自分で指定）**

```typescript
setDoc(documentRef, data)
// または
setDoc(documentRef, data, { merge: true })
```

**パラメータ**:
- `documentRef`: ドキュメント参照
- `data`: 保存するデータ
- `options`: オプション
  - `{ merge: true }` = 既存データに追加・更新（削除しない）

**例**:
```typescript
const memoRef = doc(db, `users/${userId}/memos/my-custom-id`)

// 完全上書き（既存データは削除される）
await setDoc(memoRef, {
  content: '新しい内容',
  created_at: serverTimestamp(),
})

// マージ（既存データに追加・更新）
await setDoc(memoRef, {
  content: '更新された内容',
}, { merge: true })
```

**`addDoc()` vs `setDoc()`**:

| 関数 | ID | 既存データ | 用途 |
|------|-----|----------|------|
| `addDoc()` | 自動生成 | 常に新規作成 | 通常のメモ作成 |
| `setDoc()` | 自分で指定 | 上書き可能 | 固定IDが必要な場合 |

---

### `updateDoc()` - 更新（一部フィールドのみ）

**既存ドキュメントの一部フィールドを更新**

```typescript
updateDoc(documentRef, updates)
```

**パラメータ**:
- `documentRef`: ドキュメント参照
- `updates`: 更新するフィールド（オブジェクト）

**例**:
```typescript
const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

// contentだけ更新（他のフィールドはそのまま）
await updateDoc(memoRef, {
  content: '更新されたメモ内容',
  updated_at: serverTimestamp(),
})

// 複数フィールドを更新
await updateDoc(memoRef, {
  content: '新しい内容',
  category: 'work',
  updated_at: serverTimestamp(),
})
```

**注意**: ドキュメントが存在しない場合はエラーになる

---

### `deleteDoc()` - 削除

**ドキュメントを削除**

```typescript
deleteDoc(documentRef)
```

**パラメータ**:
- `documentRef`: ドキュメント参照

**例**:
```typescript
const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

// メモを削除
await deleteDoc(memoRef)
console.log('メモを削除しました')
```

**注意**:
- サブコレクションは自動削除されない（手動で削除が必要）
- 削除しても、既存の参照は有効のまま（再度`getDoc()`すると`exists() === false`）

---

## タイムスタンプ系

### `serverTimestamp()` - サーバーの現在時刻

**Firestoreサーバーの現在時刻を自動設定**

```typescript
serverTimestamp()
```

**使用例**:
```typescript
await addDoc(memosRef, {
  content: 'メモの内容',
  created_at: serverTimestamp(),  // サーバーの時刻
  updated_at: serverTimestamp(),
})
```

**メリット**:
- クライアント端末の時刻がずれていても正確
- タイムゾーンの問題を回避
- サーバー側で一貫した時刻管理

---

### `Timestamp` - Firestoreのタイムスタンプ型

**Firestoreで保存される日時データの型**

**変換方法**:
```typescript
import { Timestamp } from 'firebase/firestore'

// Firestoreから取得したデータ
const data = snapshot.data()
const createdAt = data.created_at // Timestamp型

// JavaScriptのDateに変換
const date = createdAt.toDate()
console.log(date) // Date オブジェクト

// 日付フォーマット
const year = date.getFullYear()
const month = date.getMonth() + 1
const day = date.getDate()
console.log(`${year}/${month}/${day}`)
```

**よく使う変換関数**:
```typescript
const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

// 使用例
const memos = snapshot.docs.map((doc) => {
  const data = doc.data()
  return {
    id: doc.id,
    content: data.content,
    created_at: convertTimestampToDate(data.created_at),
    updated_at: convertTimestampToDate(data.updated_at),
  }
})
```

---

## 実践例

### 例1: メモ一覧を取得

```typescript
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export async function getMemos(userId: string) {
  // 1. コレクション参照
  const memosRef = collection(db, `users/${userId}/memos`)

  // 2. クエリ作成（更新日時が新しい順）
  const q = query(memosRef, orderBy('updated_at', 'desc'))

  // 3. データ取得
  const snapshot = await getDocs(q)

  // 4. データを配列に変換
  const memos = snapshot.docs.map((doc) => ({
    id: doc.id,
    content: doc.data().content,
    created_at: doc.data().created_at.toDate(),
    updated_at: doc.data().updated_at.toDate(),
  }))

  return memos
}
```

---

### 例2: メモを新規作成

```typescript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function createMemo(userId: string, content: string) {
  const memosRef = collection(db, `users/${userId}/memos`)

  const docRef = await addDoc(memosRef, {
    content: content,
    imageUrls: [],
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  })

  return docRef.id // 作成されたメモのID
}
```

---

### 例3: メモを更新

```typescript
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function updateMemo(
  userId: string,
  memoId: string,
  content: string
) {
  const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

  await updateDoc(memoRef, {
    content: content,
    updated_at: serverTimestamp(),
  })
}
```

---

### 例4: メモを削除

```typescript
import { doc, deleteDoc } from 'firebase/firestore'

export async function deleteMemo(userId: string, memoId: string) {
  const memoRef = doc(db, `users/${userId}/memos/${memoId}`)
  await deleteDoc(memoRef)
}
```

---

### 例5: 特定のメモを1つ取得

```typescript
import { doc, getDoc } from 'firebase/firestore'

export async function getMemo(userId: string, memoId: string) {
  const memoRef = doc(db, `users/${userId}/memos/${memoId}`)
  const snapshot = await getDoc(memoRef)

  if (!snapshot.exists()) {
    return null // メモが見つからない
  }

  return {
    id: snapshot.id,
    content: snapshot.data().content,
    created_at: snapshot.data().created_at.toDate(),
    updated_at: snapshot.data().updated_at.toDate(),
  }
}
```

---

## よくあるパターン

### パターン1: エラーハンドリング

```typescript
export async function getMemos(userId: string) {
  try {
    const memosRef = collection(db, `users/${userId}/memos`)
    const q = query(memosRef, orderBy('updated_at', 'desc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('メモの取得に失敗しました:', error)
    throw new Error('メモの取得に失敗しました')
  }
}
```

---

### パターン2: 条件付き取得

```typescript
// 空でないメモだけ取得
export async function getNonEmptyMemos(userId: string) {
  const memosRef = collection(db, `users/${userId}/memos`)
  const q = query(
    memosRef,
    where('content', '!=', ''),
    orderBy('content', 'asc'),  // whereで使ったフィールドを最初にorderBy
    orderBy('updated_at', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}
```

**注意**: `where('content', '!=', '')` を使う場合、`orderBy('content')` が最初に必要

---

### パターン3: ページネーション

```typescript
// 最初の10件を取得
export async function getFirstPage(userId: string) {
  const memosRef = collection(db, `users/${userId}/memos`)
  const q = query(
    memosRef,
    orderBy('updated_at', 'desc'),
    limit(10)
  )

  const snapshot = await getDocs(q)

  return {
    memos: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1], // 次のページ用
  }
}

// 次の10件を取得
export async function getNextPage(userId: string, lastDoc: any) {
  const memosRef = collection(db, `users/${userId}/memos`)
  const q = query(
    memosRef,
    orderBy('updated_at', 'desc'),
    startAfter(lastDoc),
    limit(10)
  )

  const snapshot = await getDocs(q)

  return {
    memos: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    lastDoc: snapshot.docs[snapshot.docs.length - 1],
  }
}
```

---

### パターン4: バッチ処理

**複数のドキュメントを一度に更新・削除**

```typescript
import { writeBatch } from 'firebase/firestore'

// 複数のメモを一度に削除
export async function deleteMemos(userId: string, memoIds: string[]) {
  const batch = writeBatch(db)

  memoIds.forEach((memoId) => {
    const memoRef = doc(db, `users/${userId}/memos/${memoId}`)
    batch.delete(memoRef)
  })

  // 一度に実行
  await batch.commit()
}
```

---

## まとめ

### よく使う関数一覧

| 分類 | 関数 | 用途 |
|------|------|------|
| **参照** | `collection()` | コレクション参照 |
| **参照** | `doc()` | ドキュメント参照 |
| **クエリ** | `query()` | クエリ作成 |
| **クエリ** | `orderBy()` | ソート |
| **クエリ** | `where()` | フィルター |
| **クエリ** | `limit()` | 件数制限 |
| **読み取り** | `getDocs()` | 複数取得 |
| **読み取り** | `getDoc()` | 1つ取得 |
| **読み取り** | `onSnapshot()` | リアルタイム監視 |
| **書き込み** | `addDoc()` | 新規作成（ID自動） |
| **書き込み** | `setDoc()` | 新規作成（ID指定） |
| **書き込み** | `updateDoc()` | 更新 |
| **書き込み** | `deleteDoc()` | 削除 |
| **時刻** | `serverTimestamp()` | サーバー時刻 |

### 基本的な流れ

```typescript
// 1. 参照を取得
const collectionRef = collection(db, 'path/to/collection')

// 2. クエリを作成（必要に応じて）
const q = query(collectionRef, orderBy('field', 'desc'))

// 3. データを取得
const snapshot = await getDocs(q)

// 4. データを処理
const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

### 参考リンク

- [Firebase公式ドキュメント（日本語）](https://firebase.google.com/docs/firestore?hl=ja)
- [Firestore クエリ](https://firebase.google.com/docs/firestore/query-data/queries?hl=ja)
- [Firestoreデータの取得](https://firebase.google.com/docs/firestore/query-data/get-data?hl=ja)
- [Firestoreデータの追加](https://firebase.google.com/docs/firestore/manage-data/add-data?hl=ja)
