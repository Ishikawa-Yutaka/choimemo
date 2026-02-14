/**
 * メモ操作のカスタムフック
 *
 * メモの作成・削除などの操作ロジックをまとめたカスタムフックです。
 * MemoPageコンポーネントから操作ロジックを分離することで、
 * コードの見通しが良くなり、再利用性も高まります。
 */

import { useState } from 'react'
import { createMemo, deleteMemo } from '../lib/database'
import type { Memo } from '../lib/database'

/**
 * useMemoOperationsフックの引数
 */
interface UseMemoOperationsProps {
  /** 現在ログイン中のユーザーID */
  userId: string
  /** メモの配列 */
  memos: Memo[]
  /** メモの配列を更新する関数 */
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>
  /** 現在表示中のメモのインデックス */
  currentIndex: number
  /** 現在表示中のメモのインデックスを更新する関数 */
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
}

/**
 * メモ操作のカスタムフック
 *
 * @param props - フックの引数
 * @returns メモ操作関数のオブジェクト
 *
 * 使用例:
 * ```tsx
 * const { deleteMemoByIndex, createNewMemo } = useMemoOperations({
 *   userId: user.uid,
 *   memos,
 *   setMemos,
 *   currentIndex,
 *   setCurrentIndex,
 * })
 * ```
 */
export function useMemoOperations({
  userId,
  memos,
  setMemos,
  currentIndex,
  setCurrentIndex,
}: UseMemoOperationsProps) {
  // 操作中かどうかのフラグ（多重実行防止）
  const [isOperating, setIsOperating] = useState(false)

  /**
   * メモを削除する共通処理
   *
   * @param index - 削除するメモのインデックス
   * @param skipConfirm - 確認ダイアログをスキップするかどうか（デフォルト: false）
   * @returns 削除が成功したかどうか
   */
  const deleteMemoByIndex = async (
    index: number,
    skipConfirm = false
  ): Promise<boolean> => {
    // 操作中は多重実行を防ぐ
    if (isOperating) return false

    const memoToDelete = memos[index]
    if (!memoToDelete) return false

    setIsOperating(true)

    try {
      // Firestoreからメモを削除
      await deleteMemo(userId, memoToDelete.id)

      // ローカルStateからも削除
      const newMemos = memos.filter((_, i) => i !== index)

      if (newMemos.length === 0) {
        // すべてのメモを削除した場合は、新しい空メモを作成
        const newMemoId = await createMemo(userId, {
          content: '',
        })

        setMemos([
          {
            id: newMemoId,
            content: '',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        setCurrentIndex(0)
      } else {
        setMemos(newMemos)
        // メモ削除後は常に最初のメモ（インデックス0）を表示
        setCurrentIndex(0)
      }

      return true
    } catch (error) {
      console.error('メモの削除に失敗しました:', error)
      alert('メモの削除に失敗しました。もう一度お試しください。')
      return false
    } finally {
      setIsOperating(false)
    }
  }

  /**
   * 新規メモを作成する処理
   *
   * @returns 作成が成功したかどうか
   */
  const createNewMemo = async (): Promise<boolean> => {
    // 操作中は多重実行を防ぐ
    if (isOperating) return false

    setIsOperating(true)

    try {
      // Firestoreに新しい空メモを作成
      const newMemoId = await createMemo(userId, {
        content: '',
      })

      // 新しいメモをリストの先頭に追加（最新のメモとして）
      const newMemo: Memo = {
        id: newMemoId,
        content: '',
        created_at: new Date(),
        updated_at: new Date(),
      }

      setMemos([newMemo, ...memos])
      // 新しいメモを表示
      setCurrentIndex(0)

      return true
    } catch (error) {
      console.error('新規メモの作成に失敗しました:', error)
      alert('新規メモの作成に失敗しました。もう一度お試しください。')
      return false
    } finally {
      setIsOperating(false)
    }
  }

  return {
    /** メモを削除する関数 */
    deleteMemoByIndex,
    /** 新規メモを作成する関数 */
    createNewMemo,
    /** 操作中かどうかのフラグ */
    isOperating,
  }
}
