# JavaScript/TypeScript 関数の引数とオブジェクトの完全ガイド

このドキュメントでは、JavaScriptとTypeScriptの関数の引数とオブジェクトについて、初心者向けに詳しく解説します。

## 目次
1. [関数の引数の基本](#関数の引数の基本)
2. [引数の順番と名前](#引数の順番と名前)
3. [オブジェクトとは](#オブジェクトとは)
4. [オブジェクトを引数に渡す](#オブジェクトを引数に渡す)
5. [TypeScriptの型定義](#typescriptの型定義)
6. [このプロジェクトでの実例](#このプロジェクトでの実例)

---

## 関数の引数の基本

### 引数とは

**引数 = 関数に渡すデータ**

```javascript
// 関数定義
function greet(name) {
  //         ↑
  //      引数（パラメータ）
  console.log('こんにちは、' + name + 'さん')
}

// 関数呼び出し
greet('太郎')
//    ↑
// 引数（実際の値）
```

**実行結果**:
```
こんにちは、太郎さん
```

### 複数の引数

```javascript
// 2つの引数を取る関数
function add(a, b) {
  return a + b
}

// 呼び出し
const result = add(5, 3)
console.log(result)  // 8
```

---

## 引数の順番と名前

### 重要ルール1: 順番で対応する

引数は**順番**で対応します：

```javascript
// 関数定義
function introduce(name, age, city) {
  //              ↑     ↑    ↑
  //            1番目 2番目 3番目
  console.log(`${name}さん、${age}歳、${city}在住`)
}

// 呼び出し
introduce('太郎', 20, '東京')
//        ↑      ↑    ↑
//      1番目  2番目 3番目
```

**実行結果**:
```
太郎さん、20歳、東京在住
```

**対応関係**:
- 1番目の引数（`'太郎'`） → `name`に入る
- 2番目の引数（`20`） → `age`に入る
- 3番目の引数（`'東京'`） → `city`に入る

### 重要ルール2: 引数の名前は自由に決められる

引数の名前は、関数を定義する人が**自由に決められます**：

```javascript
// パターン1
function greet(name) {
  console.log('こんにちは、' + name)
}

// パターン2（nameをpersonNameに変更）
function greet(personName) {
  console.log('こんにちは、' + personName)
}

// パターン3（nameをxに変更）
function greet(x) {
  console.log('こんにちは、' + x)
}

// すべて同じように動く
greet('太郎')  // こんにちは、太郎
```

**重要**: 引数名は関数の**中だけ**で使う名前なので、外から見えません。

### Reactや特別なルールは関係ない

これは**JavaScriptの基本的な仕組み**であり、Reactや特別なフレームワークのルールではありません：

```javascript
// 普通のJavaScript
function add(a, b) {
  return a + b
}

// Reactでも同じ
function MyComponent(props) {
  return <div>{props.name}</div>
}

// Node.jsでも同じ
function readFile(path, callback) {
  // ...
}
```

---

## オブジェクトとは

### オブジェクトの基本

**オブジェクト = 関連するデータをまとめたもの**

```javascript
// 例1: 人の情報をまとめる
const person = {
  name: '太郎',
  age: 20,
  email: 'taro@example.com'
}

// 例2: メモの情報をまとめる
const memo = {
  content: 'メモの内容',
  created_at: '2026-02-14'
}
```

### `{}`の意味

**`{}` = オブジェクトを作る記号**

```javascript
// 空のオブジェクト
const empty = {}

// プロパティ1つ
const obj1 = { name: '太郎' }

// プロパティ複数
const obj2 = {
  name: '太郎',
  age: 20,
  city: '東京'
}
```

### オブジェクトの中身を取り出す

**ドット（`.`）を使って取り出します**：

```javascript
const person = {
  name: '太郎',
  age: 20
}

// 取り出し方
console.log(person.name)  // '太郎'
console.log(person.age)   // 20
```

### オブジェクトのプロパティを追加・変更

```javascript
const person = {
  name: '太郎'
}

// 追加
person.age = 20
console.log(person)  // { name: '太郎', age: 20 }

// 変更
person.name = '花子'
console.log(person)  // { name: '花子', age: 20 }
```

### ネスト（入れ子）構造

```javascript
const user = {
  name: '太郎',
  address: {
    city: '東京',
    zip: '100-0001'
  }
}

// 取り出し方
console.log(user.name)           // '太郎'
console.log(user.address)        // { city: '東京', zip: '100-0001' }
console.log(user.address.city)   // '東京'
```

---

## オブジェクトを引数に渡す

### パターン1: 変数に入れてから渡す

```javascript
function printPerson(person) {
  console.log(`${person.name}さん、${person.age}歳`)
}

// まず変数に入れる
const data = {
  name: '太郎',
  age: 20
}

// それを渡す
printPerson(data)  // 太郎さん、20歳
```

### パターン2: その場で作って渡す

```javascript
function printPerson(person) {
  console.log(`${person.name}さん、${person.age}歳`)
}

// その場で作って渡す
printPerson({
  name: '太郎',
  age: 20
})  // 太郎さん、20歳
```

**パターン1とパターン2は同じ意味です！**

### 複数の引数（オブジェクト含む）

```javascript
function createUser(id, userInfo) {
  //              ↑   ↑
  //            文字列 オブジェクト
  console.log('ID:', id)
  console.log('名前:', userInfo.name)
  console.log('年齢:', userInfo.age)
}

// 呼び出し
createUser('user123', {
  name: '太郎',
  age: 20
})
//     ↑        ↑
//   1番目    2番目
```

**実行結果**:
```
ID: user123
名前: 太郎
年齢: 20
```

---

## TypeScriptの型定義

### 値と型の違い

```typescript
// 値（実際のデータ）
const memo = { content: 'メモの内容' }

// 型（データの形の定義）
type MemoData = { content: string }
```

### 関数の引数に型を付ける

```typescript
// JavaScriptの場合（型なし）
function createMemo(userId, data) {
  console.log(data.content)
}

// TypeScriptの場合（型あり）
function createMemo(
  userId: string,
  data: { content: string }
) {
  console.log(data.content)
}
```

**型定義の効果**:
- 間違った型の値を渡すとエラーになる
- エディタが自動補完してくれる
- バグを未然に防げる

### 型チェックの例

```typescript
function createMemo(
  userId: string,
  data: { content: string; imageUrls?: string[] }
) {
  // ...
}

// ✅ OK: contentがある
createMemo('user123', { content: '' })

// ✅ OK: 両方ある
createMemo('user123', { content: '', imageUrls: [] })

// ❌ エラー: contentがない
createMemo('user123', { imageUrls: [] })
// Property 'content' is missing

// ❌ エラー: contentが文字列じゃない
createMemo('user123', { content: 123 })
// Type 'number' is not assignable to type 'string'
```

### オプショナルプロパティ（`?`）

```typescript
type UserData = {
  name: string      // 必須
  age?: number      // オプション（省略可能）
}

// ✅ OK: nameだけ
const user1: UserData = { name: '太郎' }

// ✅ OK: 両方
const user2: UserData = { name: '太郎', age: 20 }

// ❌ エラー: nameがない
const user3: UserData = { age: 20 }
```

---

## このプロジェクトでの実例

### createMemo関数の定義

`src/lib/database.ts`:

```typescript
export async function createMemo(
  userId: string,
  data: { content: string; imageUrls?: string[] }
): Promise<string> {
  //       ↑
  // 返り値の型は「string」（メモのID）

  const docRef = await addDoc(
    collection(db, `users/${userId}/memos`),
    {
      content: data.content,      // dataからcontentを取り出す
      imageUrls: data.imageUrls || [],
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    }
  )

  return docRef.id  // メモのIDを返す（文字列）
}
```

### createMemo関数の呼び出し

`src/pages/MemoPage.tsx`:

```typescript
const newMemoId = await createMemo(user.uid, {
  content: '',
})
//         ↑              ↑
//      1番目の引数    2番目の引数
```

**対応関係**:

| 呼び出し側 | 引数名 | 型 | 説明 |
|-----------|--------|-----|------|
| `user.uid` | `userId` | `string` | ユーザーID |
| `{ content: '' }` | `data` | `{ content: string; imageUrls?: string[] }` | メモのデータ |

### データの流れ

```typescript
// ステップ1: 関数呼び出し
const newMemoId = await createMemo(user.uid, { content: '' })

// ステップ2: 関数の中
function createMemo(userId, data) {
  // userId = "user123"
  // data = { content: '' }

  // data.contentを取り出す
  console.log(data.content)  // ''
}

// ステップ3: Firestoreに保存
{
  content: '',              // data.contentから
  imageUrls: [],
  created_at: Timestamp,
  updated_at: Timestamp,
}

// ステップ4: IDが返る
// newMemoId = "abc123xyz"
```

### なぜ `{ content: '' }` を引数に取るのか？

**理由**: createMemo関数は**汎用的な関数**だから

```typescript
// 使用例1: 空のメモを作成
await createMemo(user.uid, {
  content: '',
})

// 使用例2: 内容があるメモを作成
await createMemo(user.uid, {
  content: 'これは新しいメモです',
})

// 使用例3: 画像付きメモを作成（将来の機能）
await createMemo(user.uid, {
  content: '今日の写真',
  imageUrls: ['https://...'],
})
```

もし`user.uid`だけの関数にすると、空メモしか作れなくなります：

```typescript
// ❌ こうなってしまう
function createMemo(userId: string): Promise<string> {
  // 常に空のメモしか作れない
  await addDoc(collection(db, `users/${userId}/memos`), {
    content: '',  // 固定
  })
}
```

---

## まとめ

### 関数の引数

| 項目 | 説明 |
|------|------|
| **対応の仕組み** | 順番で決まる（1番目、2番目...） |
| **引数の名前** | 関数を定義する人が自由に決める |
| **Reactのルール？** | いいえ、JavaScriptの基本 |
| **複数の引数** | カンマ（`,`）で区切る |

### オブジェクト

| 項目 | 説明 |
|------|------|
| **オブジェクトとは** | 関連するデータをまとめたもの |
| **記号** | `{}`で作る |
| **中身の取り出し** | ドット（`.`）を使う |
| **引数として渡す** | その場で作るか、変数に入れてから渡す |

### TypeScriptの型

| 項目 | 説明 |
|------|------|
| **型とは** | データの形を定義するもの |
| **値と型の違い** | 値は実際のデータ、型は形の定義 |
| **オプショナル** | `?`を付けると省略可能 |
| **型チェック** | 間違った型を渡すとエラー |

### 引数の名前の自由度

```typescript
// すべて同じ動作
function createMemo(userId, data) { }
function createMemo(userId, memoData) { }
function createMemo(userId, info) { }
function createMemo(id, obj) { }
```

**重要**: 引数名は関数の中だけで使う名前なので、自由に決められます。

### オブジェクトの記号

| 記号 | 意味 | 例 |
|------|------|-----|
| `{}` | オブジェクト | `{ name: '太郎', age: 20 }` |
| `[]` | 配列 | `[1, 2, 3]` |
| `()` | 関数呼び出し、グループ化 | `func()`, `(a + b)` |

---

## 実践例

### 例1: ユーザー登録関数

```typescript
// 関数定義
function registerUser(
  email: string,
  userData: { name: string; age: number }
): void {
  console.log('メール:', email)
  console.log('名前:', userData.name)
  console.log('年齢:', userData.age)
}

// 呼び出し
registerUser('taro@example.com', {
  name: '太郎',
  age: 20
})
```

### 例2: 商品作成関数

```typescript
// 関数定義
function createProduct(
  productId: string,
  productInfo: {
    name: string
    price: number
    description?: string  // オプション
  }
): void {
  console.log('ID:', productId)
  console.log('商品名:', productInfo.name)
  console.log('価格:', productInfo.price)

  if (productInfo.description) {
    console.log('説明:', productInfo.description)
  }
}

// 呼び出し1: 説明なし
createProduct('prod123', {
  name: 'ノートPC',
  price: 100000
})

// 呼び出し2: 説明あり
createProduct('prod456', {
  name: 'マウス',
  price: 3000,
  description: 'ワイヤレスマウス'
})
```

### 例3: メモ更新関数（このプロジェクト）

```typescript
// src/lib/database.ts
export async function updateMemo(
  userId: string,
  memoId: string,
  data: { content: string }
): Promise<void> {
  const docRef = doc(db, `users/${userId}/memos/${memoId}`)
  await updateDoc(docRef, {
    content: data.content,
    updated_at: serverTimestamp(),
  })
}

// 呼び出し
await updateMemo(user.uid, currentMemo.id, {
  content: '更新されたメモの内容'
})
```

---

## 参考リンク

- [MDN - 関数](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Functions)
- [MDN - オブジェクト](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Working_with_Objects)
- [TypeScript公式 - 関数](https://www.typescriptlang.org/docs/handbook/2/functions.html)
