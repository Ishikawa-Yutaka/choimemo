/**
 * メモ編集と自動保存を管理するカスタムフック
 *
 * - デバウンス付き自動保存機能
 * - ローカルStateの即座更新 + Firestoreへの遅延保存
 */

import { useRef, useEffect } from 'react'
import { updateMemo } from '../lib/database'
import type { Memo } from '../types'

/**
 * useMemoEditingフックのパラメータ型定義
 */
interface UseMemoEditingParams {
  /** ログイン中のユーザーID */
  userId: string | undefined
  /** メモ一覧 */
  memos: Memo[]
  /** メモ一覧を更新する関数 */
  setMemos: React.Dispatch<React.SetStateAction<Memo[]>>
  /** 現在表示中のメモのインデックス */
  currentIndex: number
}

/**
 * useMemoEditingフックの戻り値型定義
 */
interface UseMemoEditingReturn {
  /** メモ内容が変更された時のハンドラー */
  handleMemoChange: (newContent: string) => void
}

/**
 * メモ編集と自動保存を管理するカスタムフック
 *
 * @param params - フックのパラメータ
 * @returns メモ変更ハンドラー
 *
 * 使用例:
 * ```tsx
 * const { handleMemoChange } = useMemoEditing({
 *   userId: user?.uid,
 *   memos,
 *   setMemos,
 *   currentIndex,
 * })
 * ```
 */
export const useMemoEditing = ({
  userId,
  memos,
  setMemos,
  currentIndex,
}: UseMemoEditingParams): UseMemoEditingReturn => {
  /**
   * デバウンス処理用のタイマーIDを保持
   *
   * useRefを使う理由:
   * - useStateだと値が変わるたびに再レンダリングが発生してしまう
   * - useRefは値が変わっても再レンダリングされない（タイマーIDの保持に最適）
   * - コンポーネントのライフサイクル全体で同じ値を保持できる
   */
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * コンポーネントがアンマウントされる時に、
   * デバウンスタイマーをクリーンアップ
   *
   * これをしないと、コンポーネントが破棄された後にタイマーが実行されて
   * エラーやメモリリークが発生する可能性があります。
   */
  useEffect(() => {
    return () => {
      // コンポーネントがアンマウントされる時に実行される
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * メモの内容が変更された時の処理（デバウンス付き自動保存）
   *
   * @param newContent - 新しいメモの内容
   *
   * 処理の流れ:
   * 1. まず画面表示を即座に更新（ユーザーの入力がすぐ反映される）
   * 2. 前回のタイマーをキャンセル（連続入力の場合、保存をキャンセル）
   * 3. 500ms後にFirestoreに保存するタイマーをセット
   * 4. ユーザーが入力を止めて500ms経過したら、初めて保存実行
   */
  const handleMemoChange = (newContent: string) => {
    if (!userId) return

    const currentMemo = memos[currentIndex]
    if (!currentMemo) return

    // 1. まず画面表示を即座に更新（ローカルState）
    // これにより、ユーザーの入力がすぐに画面に反映される
    setMemos((prevMemos) =>
      prevMemos.map((memo, index) =>
        index === currentIndex
          ? { ...memo, content: newContent, updated_at: new Date() }
          : memo
      )
    )

    // 2. 前回のタイマーが残っていればキャンセル
    // 「こ」→「こん」→「こんに」と入力された場合、
    // 「こ」と「こん」の保存はキャンセルされる
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // 3. 新しいタイマーをセット（500ms後に保存）
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // 4. 500ms経過後、Firestoreに保存
        await updateMemo(userId, currentMemo.id, {
          content: newContent,
        })
        console.log('メモを自動保存しました')
      } catch (error) {
        console.error('メモの更新に失敗しました:', error)
      }
    }, 500) // 500ms（0.5秒）のデバウンス
  }

  return {
    handleMemoChange,
  }
}
