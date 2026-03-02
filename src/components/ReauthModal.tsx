/**
 * 再認証モーダルコンポーネント
 *
 * アカウント削除時に Firebase が「再ログインが必要」エラーを返した場合に表示されます。
 * ユーザーの認証方法（パスワード or Google）に応じて適切な再認証UIを表示し、
 * 再認証が成功したら onSuccess コールバックを呼び出します。
 *
 * 使用例:
 * <ReauthModal
 *   user={user}
 *   onSuccess={handleReauthSuccess}
 *   onCancel={handleReauthCancel}
 * />
 */

import React, { useState } from 'react'
import {
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  GoogleAuthProvider,
} from 'firebase/auth'
import {
  getAuthErrorMessage,
  type FirebaseAuthError,
} from '../lib/errorHandlers'
import type { User } from 'firebase/auth'
import './ReauthModal.css'

/**
 * ReauthModalコンポーネントのprops
 */
interface ReauthModalProps {
  /** 現在ログイン中のユーザーオブジェクト */
  user: User
  /** 再認証成功時に呼ばれるコールバック */
  onSuccess: () => void
  /** キャンセル時に呼ばれるコールバック */
  onCancel: () => void
}

/**
 * ユーザーの認証方法を判定する関数
 *
 * user.providerData からサインイン方法を確認します。
 * - 'password' → メール/パスワード認証
 * - 'google.com' → Google認証
 *
 * @param user - ログイン中のユーザーオブジェクト
 * @returns 'password' | 'google' | 'unknown'
 */
const getAuthMethod = (user: User): 'password' | 'google' | 'unknown' => {
  // providerData はユーザーがリンクしている認証プロバイダの配列
  const providers = user.providerData.map(p => p.providerId)

  if (providers.includes('password')) {
    return 'password'
  }
  if (providers.includes('google.com')) {
    return 'google'
  }
  return 'unknown'
}

/**
 * 再認証モーダルを表示するコンポーネント
 *
 * @param props.user - ログイン中のユーザー
 * @param props.onSuccess - 再認証成功時のコールバック
 * @param props.onCancel - キャンセル時のコールバック
 * @returns 再認証モーダルのJSX要素
 */
const ReauthModal: React.FC<ReauthModalProps> = ({
  user,
  onSuccess,
  onCancel,
}) => {
  // パスワード入力値を管理するState
  const [password, setPassword] = useState('')

  // エラーメッセージを管理するState
  const [error, setError] = useState('')

  // 再認証処理中かどうかを管理するState（二重送信防止）
  const [isLoading, setIsLoading] = useState(false)

  // ユーザーの認証方法を判定
  const authMethod = getAuthMethod(user)

  /**
   * パスワードで再認証する処理
   *
   * EmailAuthProvider.credential でクレデンシャルを作成し、
   * reauthenticateWithCredential で Firebase に再認証リクエストを送る
   */
  const handlePasswordReauth = async (e: React.FormEvent) => {
    // フォームのデフォルト送信（ページリロード）を防止
    e.preventDefault()

    // パスワードが空の場合はエラー表示
    if (!password.trim()) {
      setError('パスワードを入力してください')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // メールアドレスとパスワードからクレデンシャルを作成
      const credential = EmailAuthProvider.credential(user.email!, password)

      // Firebase に再認証リクエストを送信
      await reauthenticateWithCredential(user, credential)

      // 再認証成功 → コールバックを呼び出し
      onSuccess()
    } catch (err) {
      console.error('再認証に失敗しました:', err)
      const firebaseErr = err as FirebaseAuthError

      // パスワード間違いの場合は分かりやすいメッセージを表示
      if (firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/invalid-credential') {
        setError('パスワードが正しくありません')
      } else {
        setError(getAuthErrorMessage(firebaseErr))
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Googleで再認証する処理
   *
   * reauthenticateWithPopup でGoogleのポップアップ認証画面を表示し、
   * ユーザーがGoogleアカウントで認証すると再認証が完了する
   */
  const handleGoogleReauth = async () => {
    setIsLoading(true)
    setError('')

    try {
      // Googleプロバイダーを作成
      const provider = new GoogleAuthProvider()

      // ポップアップでGoogle再認証
      await reauthenticateWithPopup(user, provider)

      // 再認証成功 → コールバックを呼び出し
      onSuccess()
    } catch (err) {
      console.error('Google再認証に失敗しました:', err)
      const firebaseErr = err as FirebaseAuthError

      // ポップアップがブロックされた場合
      if (firebaseErr.code === 'auth/popup-blocked') {
        setError('ポップアップがブロックされました。ブラウザの設定を確認してください。')
      } else if (firebaseErr.code === 'auth/popup-closed-by-user') {
        // ユーザーがポップアップを閉じた場合はエラーを表示しない
        setError('')
      } else {
        setError(getAuthErrorMessage(firebaseErr))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // 画面全体を覆うオーバーレイ
    <div className="reauth-overlay">
      {/* 中央のカード */}
      <div className="reauth-card">
        {/* タイトル */}
        <h2 className="reauth-title">再認証が必要です</h2>

        {/* 説明テキスト */}
        <p className="reauth-description">
          セキュリティのため、アカウント削除には再度認証が必要です。
        </p>

        {/* パスワード認証の場合：パスワード入力フォームを表示 */}
        {authMethod === 'password' && (
          <form className="reauth-form" onSubmit={handlePasswordReauth}>
            {/* パスワード入力フィールド */}
            <input
              type="password"
              className="reauth-password-input"
              placeholder="パスワードを入力"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              disabled={isLoading}
            />

            {/* エラーメッセージ（エラーがある場合のみ表示） */}
            {error && <p className="reauth-error">{error}</p>}

            {/* 認証ボタン */}
            <button
              type="submit"
              className="reauth-submit-button reauth-submit-button-password"
              disabled={isLoading}
            >
              {isLoading ? '認証中...' : 'パスワードで認証してアカウントを削除'}
            </button>
          </form>
        )}

        {/* Google認証の場合：Google再認証ボタンを表示 */}
        {authMethod === 'google' && (
          <div className="reauth-form">
            {/* エラーメッセージ（エラーがある場合のみ表示） */}
            {error && <p className="reauth-error">{error}</p>}

            {/* Google再認証ボタン */}
            <button
              type="button"
              className="reauth-submit-button reauth-submit-button-google"
              onClick={handleGoogleReauth}
              disabled={isLoading}
            >
              {/* Google アイコン（SVG） */}
              <svg className="reauth-google-icon" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {isLoading ? '認証中...' : 'Googleで認証してアカウントを削除'}
            </button>
          </div>
        )}

        {/* 認証方法が不明な場合 */}
        {authMethod === 'unknown' && (
          <p className="reauth-error">
            認証方法を判定できませんでした。一度ログアウトして再ログインしてください。
          </p>
        )}

        {/* キャンセルボタン */}
        <button
          type="button"
          className="reauth-cancel-button"
          onClick={onCancel}
          disabled={isLoading}
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

export default ReauthModal
