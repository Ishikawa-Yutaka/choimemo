/**
 * メモデータの取得と初期化を管理するカスタムフック
 *
 * - Firestoreからメモ一覧を取得
 * - メモが存在しない場合は空メモを自動作成
 * - 最新メモが空でない場合は、新しい空メモを追加
 */

import { useState, useEffect } from 'react'
import { getMemos, createMemo } from '../lib/database'
import type { Memo } from '../types'

/**
 * useMemoDataフックのパラメータ型定義
 */
interface UseMemoDataParams {
  /** ログイン中のユーザーID */
  userId: string | undefined
}

/**
 * useMemoDataフックの戻り値型定義
 */
interface UseMemoDataReturn {
  /** メモ一覧 */
  memos: Memo[]
  /** メモ一覧を更新する関数 */
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>
  /** データ読み込み中かどうか */
  loading: boolean
}

/**
 * メモデータの取得と初期化を管理するカスタムフック
 *
 * @param params - フックのパラメータ
 * @returns メモデータとローディング状態
 *
 * 使用例:
 * ```tsx
 * const { memos, setMemos, loading } = useMemoData({ userId: user?.uid })
 * ```
 */
export const useMemoData = ({ userId }: UseMemoDataParams): UseMemoDataReturn => {
  // 全メモのリストを管理するState
  const [memos, setMemos] = useState<Memo[]>([])

  // データ読み込み中かどうか
  const [loading, setLoading] = useState(true)

  /**
   * コンポーネントマウント時にFirestoreからメモ一覧を取得
   */
  useEffect(() => {
    const loadMemos = async () => {
      if (!userId) return

      try {
        setLoading(true)
        // Firestoreからユーザーのメモ一覧を取得（作成日時が新しい順）
        const fetchedMemos = await getMemos(userId)

        if (fetchedMemos.length === 0) {
          // メモが1つもない場合は、空の新規メモを作成
          const newMemoId = await createMemo(userId, {
            content: '',
          })

          // 作成したメモをStateに追加
          setMemos([
            {
              id: newMemoId,
              content: '',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ])
        } else {
          // 一番新しいメモ（配列の先頭）を取得
          const latestMemo = fetchedMemos[0]

          // 一番新しいメモが空でない場合、新しい空メモを作成
          if (latestMemo.content.trim() !== '') {
            // Firestoreに新しい空メモを作成
            const newMemoId = await createMemo(userId, {
              content: '',
            })

            // 新しい空メモを一番上に追加
            setMemos([
              {
                id: newMemoId,
                content: '',
                created_at: new Date(),
                updated_at: new Date(),
              },
              ...fetchedMemos,
            ])
          } else {
            // 一番新しいメモが既に空の場合は、そのまま使う
            setMemos(fetchedMemos)
          }
        }
      } catch (error) {
        console.error('メモの読み込みに失敗しました:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMemos()
  }, [userId])

  return {
    memos,
    setMemos,
    loading,
  }
}
