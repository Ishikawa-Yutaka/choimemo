/**
 * データベース抽象化レイヤー
 *
 * このファイルでは、Firestoreの操作をラップした関数を提供します。
 * 将来Supabaseに移行する場合、このファイルだけを書き換えれば
 * 他のコンポーネントには影響を与えずに済みます。
 *
 * データ構造（Firestore）:
 * users/{userId}/memos/{memoId}
 *   ├── content: string
 *   ├── imageUrls: string[]
 *   ├── created_at: Timestamp
 *   └── updated_at: Timestamp
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Memo, MemoDocument, CreateMemoInput, UpdateMemoInput } from '../types'

/**
 * FirestoreのTimestampをJavaScriptのDateオブジェクトに変換する関数
 *
 * @param timestamp - FirestoreのTimestamp
 * @returns JavaScriptのDateオブジェクト
 */
const convertTimestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate()
}

/**
 * ユーザーの全メモを取得する関数
 *
 * @param userId - メモを取得したいユーザーのID
 * @returns メモの配列（更新日時が新しい順にソート、編集したメモが一番上に来る）
 *
 * 使用例:
 * ```typescript
 * const memos = await getMemos(user.uid)
 * console.log(memos) // [{ id: '...', content: '...', ... }]
 * ```
 */
export async function getMemos(userId: string): Promise<Memo[]> {
  try {
    // Firestoreのコレクション参照を取得
    // users/{userId}/memos というパスのコレクションを指定
    const memosRef = collection(db, `users/${userId}/memos`)

    // クエリを作成（updated_atで降順ソート = 最近編集・作成されたメモが先）
    const q = query(memosRef, orderBy('updated_at', 'desc'))

    // データを取得
    const snapshot = await getDocs(q)

    // Firestoreのドキュメントを、アプリで使いやすいMemo型に変換
    const memos: Memo[] = snapshot.docs.map((doc) => {
      const data = doc.data() as MemoDocument

      return {
        id: doc.id, // ドキュメントIDをメモのIDとして使用
        content: data.content,
        imageUrls: data.imageUrls,
        created_at: convertTimestampToDate(data.created_at),
        updated_at: convertTimestampToDate(data.updated_at),
      }
    })

    return memos
  } catch (error) {
    console.error('メモの取得に失敗しました:', error)
    throw new Error('メモの取得に失敗しました')
  }
}

/**
 * 特定のメモを1つ取得する関数
 *
 * @param userId - ユーザーのID
 * @param memoId - 取得したいメモのID
 * @returns メモオブジェクト、存在しない場合はnull
 *
 * 使用例:
 * ```typescript
 * const memo = await getMemo(user.uid, 'memo123')
 * if (memo) {
 *   console.log(memo.content)
 * }
 * ```
 */
export async function getMemo(
  userId: string,
  memoId: string
): Promise<Memo | null> {
  try {
    // 特定のドキュメントへの参照を取得
    const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

    // ドキュメントを取得
    const snapshot = await getDoc(memoRef)

    // ドキュメントが存在しない場合はnullを返す
    if (!snapshot.exists()) {
      return null
    }

    // データを取得してMemo型に変換
    const data = snapshot.data() as MemoDocument

    return {
      id: snapshot.id,
      content: data.content,
      imageUrls: data.imageUrls,
      created_at: convertTimestampToDate(data.created_at),
      updated_at: convertTimestampToDate(data.updated_at),
    }
  } catch (error) {
    console.error('メモの取得に失敗しました:', error)
    throw new Error('メモの取得に失敗しました')
  }
}

/**
 * 新しいメモを作成する関数
 *
 * @param userId - ユーザーのID
 * @param input - メモの内容（content、imageUrlsなど）
 * @returns 作成されたメモのID
 *
 * 使用例:
 * ```typescript
 * const memoId = await createMemo(user.uid, {
 *   content: 'これは新しいメモです',
 * })
 * console.log('作成されたメモID:', memoId)
 * ```
 */
export async function createMemo(
  userId: string,
  input: CreateMemoInput
): Promise<string> {
  try {
    // コレクション参照を取得
    const memosRef = collection(db, `users/${userId}/memos`)

    // 新しいドキュメントを作成
    // serverTimestamp()は、Firestoreサーバーの現在時刻を自動設定
    const docRef = await addDoc(memosRef, {
      content: input.content,
      imageUrls: input.imageUrls || [], // 未指定の場合は空配列
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    // 作成されたドキュメントのIDを返す
    return docRef.id
  } catch (error) {
    console.error('メモの作成に失敗しました:', error)
    throw new Error('メモの作成に失敗しました')
  }
}

/**
 * 既存のメモを更新する関数
 *
 * @param userId - ユーザーのID
 * @param memoId - 更新したいメモのID
 * @param updates - 更新する内容（content、imageUrlsなど）
 *
 * 使用例:
 * ```typescript
 * await updateMemo(user.uid, 'memo123', {
 *   content: '更新されたメモ内容',
 * })
 * ```
 */
export async function updateMemo(
  userId: string,
  memoId: string,
  updates: UpdateMemoInput
): Promise<void> {
  try {
    // ドキュメント参照を取得
    const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

    // ドキュメントを更新
    // updated_atは自動的に現在時刻に更新
    await updateDoc(memoRef, {
      ...updates,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error('メモの更新に失敗しました:', error)
    throw new Error('メモの更新に失敗しました')
  }
}

/**
 * メモを削除する関数
 *
 * @param userId - ユーザーのID
 * @param memoId - 削除したいメモのID
 *
 * 使用例:
 * ```typescript
 * await deleteMemo(user.uid, 'memo123')
 * console.log('メモを削除しました')
 * ```
 */
export async function deleteMemo(
  userId: string,
  memoId: string
): Promise<void> {
  try {
    // ドキュメント参照を取得
    const memoRef = doc(db, `users/${userId}/memos/${memoId}`)

    // ドキュメントを削除
    await deleteDoc(memoRef)
  } catch (error) {
    console.error('メモの削除に失敗しました:', error)
    throw new Error('メモの削除に失敗しました')
  }
}

/**
 * メモの件数を取得する関数（将来的に使用予定）
 *
 * @param userId - ユーザーのID
 * @returns メモの総数
 */
export async function getMemoCount(userId: string): Promise<number> {
  try {
    const memosRef = collection(db, `users/${userId}/memos`)
    const snapshot = await getDocs(memosRef)

    // ドキュメント数を返す
    return snapshot.size
  } catch (error) {
    console.error('メモ件数の取得に失敗しました:', error)
    throw new Error('メモ件数の取得に失敗しました')
  }
}
