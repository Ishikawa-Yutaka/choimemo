/**
 * メモデータの取得とリアルタイム同期を管理するカスタムフック
 *
 * - Firestoreの onSnapshot でメモ一覧をリアルタイムに監視
 * - 別デバイスでの変更が自動的に反映される
 * - メモが存在しない場合は空メモを自動作成
 * - 最新メモが空でない場合は、新しい空メモを追加
 * - ローカルで編集中のメモは、リアルタイム更新で上書きしない（競合回避）
 */

import { useState, useEffect, useRef } from 'react'
import { subscribeToMemos, createMemo } from '../lib/database'
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
 * メモデータの取得とリアルタイム同期を管理するカスタムフック
 *
 * @param params - フックのパラメータ
 * @returns メモデータとローディング状態
 *
 * 使用例:
 * ```tsx
 * const { memos, setMemos, loading } = useMemoData({ userId: user?.uid })
 * ```
 */
export const useMemoData = ({
  userId,
}: UseMemoDataParams): UseMemoDataReturn => {
  // 全メモのリストを管理するState
  const [memos, setMemos] = useState<Memo[]>([])

  // データ読み込み中かどうか
  const [loading, setLoading] = useState(true)

  /**
   * 初回データ受信フラグ
   *
   * onSnapshotは、データが変更されるたびにコールバックを呼ぶため、
   * 空メモの自動作成ロジックが何度も実行されないように、
   * 初回のデータ受信時のみ実行するためのフラグ
   */
  const isInitializedRef = useRef(false)

  /**
   * onSnapshotでメモ一覧をリアルタイム監視
   *
   * - 初回: メモの読み込み + 空メモ自動作成ロジック
   * - 2回目以降: リアルタイム同期（編集中のメモは上書きしない）
   */
  useEffect(() => {
    if (!userId) return

    // ユーザーが変わった場合にフラグをリセット
    isInitializedRef.current = false
    setLoading(true)

    // Firestoreのリアルタイムリスナーを開始
    const unsubscribe = subscribeToMemos(
      userId,
      async (fetchedMemos) => {
        // ---- 初回データ受信: 空メモ自動作成ロジック ----
        if (!isInitializedRef.current) {
          isInitializedRef.current = true

          if (fetchedMemos.length === 0) {
            // メモが1つもない場合は、空の新規メモを作成
            const newMemoId = await createMemo(userId, {
              content: '',
            })

            // 作成したメモをStateに追加
            // ※ onSnapshotが次回の通知で自動的に同期するが、
            //   即座にUIに反映するためにここでもsetMemosを呼ぶ
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

          setLoading(false)
          return
        }

        // ---- 2回目以降: リアルタイム同期 ----
        // ローカルで編集中のメモは上書きしない（競合回避）
        //
        // 仕組み:
        // useMemoEditingがメモを編集すると、ローカルStateの updated_at が
        // new Date() で即座に更新される。
        // デバウンス保存がFirestoreに反映されるまでの間、
        // サーバー側の updated_at はまだ古いままなので、
        // 「ローカルの方が新しい = 編集中」と判断し、ローカルの内容を維持する。
        setMemos(prevMemos => {
          return fetchedMemos.map(serverMemo => {
            const localMemo = prevMemos.find(m => m.id === serverMemo.id)

            if (localMemo) {
              // ローカルの updated_at がサーバーより新しい場合、
              // ユーザーが編集中（デバウンス未完了）と判断してローカルを維持
              if (localMemo.updated_at > serverMemo.updated_at) {
                return localMemo
              }

              // contentが同じ場合はローカルのオブジェクトをそのまま返す
              // （オブジェクト参照を維持して不要な再レンダリングを防止し、
              //  カーソル位置がリセットされるのを防ぐ）
              if (localMemo.content === serverMemo.content) {
                return localMemo
              }
            }

            // それ以外はサーバーのデータで更新（別デバイスからの変更など）
            return serverMemo
          })
        })
      },
      (error) => {
        console.error('メモの読み込みに失敗しました:', error)
        setLoading(false)
      }
    )

    // クリーンアップ: コンポーネントのアンマウント時やuserIdが変わった時に
    // リスナーを解除してメモリリークを防止
    return () => {
      unsubscribe()
    }
  }, [userId])

  return {
    memos,
    setMemos,
    loading,
  }
}
