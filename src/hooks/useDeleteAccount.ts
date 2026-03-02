/**
 * アカウント削除処理を管理するカスタムフック
 *
 * - 進捗バーを表示しながらアカウント削除
 * - メモを1件ずつ削除
 * - Firebaseアカウントを削除
 * - 再認証が必要な場合はモーダルを表示してリトライ
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteUser } from 'firebase/auth'
import { getMemos, deleteMemo } from '../lib/database'
import {
  getAuthErrorMessage,
  type FirebaseAuthError,
} from '../lib/errorHandlers'
import type { User } from 'firebase/auth'

/**
 * useDeleteAccountフックの戻り値型定義
 */
interface UseDeleteAccountReturn {
  /** アカウント削除の進捗（0〜100、null = 削除中でない） */
  deleteProgress: number | null
  /** 削除中に表示するステータスメッセージ */
  deleteStatusMessage: string
  /** アカウント削除処理を実行する関数 */
  handleDeleteAccount: () => Promise<void>
  /** 再認証モーダルの表示が必要かどうか */
  needsReauth: boolean
  /** 再認証成功後にアカウント削除をリトライする関数 */
  handleReauthSuccess: () => Promise<void>
  /** 再認証をキャンセルした時の処理 */
  handleReauthCancel: () => void
}

/**
 * アカウント削除処理を管理するカスタムフック
 *
 * @param user - ログイン中のユーザーオブジェクト
 * @returns 削除進捗とハンドラー
 *
 * 使用例:
 * ```tsx
 * const {
 *   deleteProgress, deleteStatusMessage, handleDeleteAccount,
 *   needsReauth, handleReauthSuccess, handleReauthCancel,
 * } = useDeleteAccount(user)
 * ```
 */
export const useDeleteAccount = (user: User | null): UseDeleteAccountReturn => {
  const navigate = useNavigate()

  /**
   * アカウント削除の進捗（0〜100）を管理するState
   *
   * null     = 削除中でない（通常状態・オーバーレイ非表示）
   * 0〜100   = 削除進捗（パーセント・オーバーレイ表示中）
   */
  const [deleteProgress, setDeleteProgress] = useState<number | null>(null)

  /**
   * 削除中に表示するステータスメッセージを管理するState
   */
  const [deleteStatusMessage, setDeleteStatusMessage] = useState('')

  /**
   * 再認証モーダルの表示が必要かどうかを管理するState
   *
   * auth/requires-recent-login エラーが発生した時に true になり、
   * 再認証モーダルが表示される
   */
  const [needsReauth, setNeedsReauth] = useState(false)

  /**
   * アカウント削除のみを実行する内部関数
   *
   * メモ削除は既に完了している可能性があるため、
   * この関数ではアカウント削除（deleteUser）のみを実行します。
   * 再認証成功後のリトライ時に使用します。
   */
  const deleteAccountOnly = useCallback(async () => {
    if (!user) return

    try {
      // プログレスバーを表示（90%からスタート＝メモ削除済み）
      setDeleteProgress(90)
      setDeleteStatusMessage('アカウントを削除しています...')

      // Firebaseアカウントを削除
      await deleteUser(user)

      // 完了（100%）
      setDeleteProgress(100)
      setDeleteStatusMessage('削除が完了しました')

      // 少し待ってからリダイレクト（100%を画面で確認できるように）
      await new Promise(resolve => setTimeout(resolve, 800))

      // ログイン画面にリダイレクト
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('アカウント削除リトライに失敗しました:', error)

      const err = error as FirebaseAuthError

      // エラーが発生したらプログレスバーを非表示に戻す
      setDeleteProgress(null)
      setDeleteStatusMessage('')

      // エラーメッセージを表示
      const message = getAuthErrorMessage(err)
      alert(message)
    }
  }, [user, navigate])

  /**
   * 再認証成功後にアカウント削除をリトライする関数
   *
   * ReauthModal から onSuccess コールバックとして呼ばれます。
   * 再認証モーダルを閉じてから、アカウント削除のみを実行します。
   */
  const handleReauthSuccess = useCallback(async () => {
    // 再認証モーダルを閉じる
    setNeedsReauth(false)

    // アカウント削除をリトライ（メモは既に削除済みなのでスキップ）
    await deleteAccountOnly()
  }, [deleteAccountOnly])

  /**
   * 再認証をキャンセルした時の処理
   *
   * 再認証モーダルを閉じるだけ。
   * メモは既に削除されている可能性があるが、アカウント自体は残る。
   */
  const handleReauthCancel = useCallback(() => {
    setNeedsReauth(false)
  }, [])

  /**
   * アカウント削除処理（クライアント側実装）
   *
   * 処理の流れ:
   * 1. 確認ダイアログを表示
   * 2. プログレスバーを表示（0%）
   * 3. すべてのメモを取得（10%）
   * 4. メモを1件ずつ削除しながら進捗を更新（10〜80%）
   * 5. Firebaseアカウントを削除（90%）
   * 6. ログイン画面へリダイレクト（100%）
   *
   * ※ auth/requires-recent-login エラーの場合は再認証モーダルを表示
   *
   * 注: 将来的にはCloud Functionsで自動削除する予定
   * 現在はBlazeプランが必要なため、クライアント側で実装
   *
   * TODO: Blazeプランにアップグレード後の対応
   * 1. Cloud Functionsをデプロイ: firebase deploy --only functions
   * 2. 以下のメモ削除処理を削除（Cloud Functionsが自動的に削除するため）
   *    - getMemos(user.uid)
   *    - メモを1件ずつ削除するループ処理
   * 3. アカウント削除のみ残す: await deleteUser(user)
   */
  const handleDeleteAccount = async () => {
    // アカウント削除の確認ダイアログを表示
    const confirmed = window.confirm(
      'アカウントを削除しますか？\n\nこの操作は取り消せません。すべてのメモが削除されます。'
    )
    if (!confirmed) return

    try {
      if (!user) return

      // プログレスバーを表示開始（0%）
      setDeleteProgress(0)
      setDeleteStatusMessage('削除を開始しています...')

      // TODO: Blazeプランアップグレード後は、この処理を削除
      // すべてのメモを取得（10%）
      setDeleteProgress(10)
      setDeleteStatusMessage('メモを確認しています...')
      const allMemos = await getMemos(user.uid)

      // メモを1件ずつ削除しながら進捗を更新（10〜80%）
      // メモが0件の場合はこのループをスキップ
      for (let i = 0; i < allMemos.length; i++) {
        // 削除開始前にメッセージだけ更新（何件目を削除中か表示）
        setDeleteStatusMessage(
          `メモを削除しています... (${i + 1}/${allMemos.length})`
        )

        // 1件削除（実際にFirestoreから削除される）
        await deleteMemo(user.uid, allMemos[i].id)

        // 削除完了後に進捗を更新
        // 進捗を計算: 10%〜80%の範囲でメモの削除進捗を表示
        // 例: メモが10件なら、1件削除するごとに7%ずつ増える
        const progress = 10 + Math.round(((i + 1) / allMemos.length) * 70)
        setDeleteProgress(progress)
      }

      // Firebaseアカウントを削除（90%）
      setDeleteProgress(90)
      setDeleteStatusMessage('アカウントを削除しています...')
      await deleteUser(user)

      // 完了（100%）
      setDeleteProgress(100)
      setDeleteStatusMessage('削除が完了しました')

      // 少し待ってからリダイレクト（100%を画面で確認できるように）
      await new Promise(resolve => setTimeout(resolve, 800))

      // ログイン画面にリダイレクト
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('アカウント削除に失敗しました:', error)

      // Firebase のエラーオブジェクトを型安全に扱う
      const err = error as FirebaseAuthError

      // エラーが発生したらプログレスバーを非表示に戻す
      setDeleteProgress(null)
      setDeleteStatusMessage('')

      // 再認証が必要な場合 → 再認証モーダルを表示
      // メモは既に削除済みの可能性があるため、リトライ時はアカウント削除のみ実行
      if (err.code === 'auth/requires-recent-login') {
        setNeedsReauth(true)
      } else {
        // その他のエラーは集約したエラーハンドラーを使用
        const message = getAuthErrorMessage(err)
        alert(message)
      }
    }
  }

  return {
    deleteProgress,
    deleteStatusMessage,
    handleDeleteAccount,
    needsReauth,
    handleReauthSuccess,
    handleReauthCancel,
  }
}
