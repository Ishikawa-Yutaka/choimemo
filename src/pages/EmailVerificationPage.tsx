/**
 * メール確認待ちページコンポーネント
 *
 * アカウント作成後、確認メールを送信した旨を伝える画面です。
 * ユーザーがメールのリンクをクリックするまでこの画面に留まります。
 *
 * 機能:
 * - 確認メールの再送信（再送ボタン）
 * - ログアウトボタン（別のアカウントで試したい場合）
 */

import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { sendEmailVerification, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'
import './EmailVerificationPage.css'

/**
 * メール確認待ちページを表示するコンポーネント
 *
 * @returns メール確認待ち画面のJSX要素
 */
const EmailVerificationPage: React.FC = () => {
  // 現在ログインしているユーザー情報を取得
  const { user, loading } = useAuth()

  // 再送信中かどうか（ボタン連打防止）
  const [isResending, setIsResending] = useState(false)

  // 操作結果のメッセージ（成功・エラー）
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  /**
   * 確認メールを再送信する処理
   *
   * Firebaseには送信レート制限があるため、短時間に何度も送ると
   * 'auth/too-many-requests' エラーが発生する
   */
  const handleResend = async () => {
    if (!user) return

    try {
      setIsResending(true)
      setMessage(null)

      // 確認メールを再送信
      await sendEmailVerification(user)

      setMessage({ text: '確認メールを再送信しました。メールをご確認ください。', type: 'success' })
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        setMessage({ text: 'しばらく時間をおいてから再送信してください。', type: 'error' })
      } else {
        setMessage({ text: 'メールの送信に失敗しました。', type: 'error' })
      }
    } finally {
      setIsResending(false)
    }
  }

  /**
   * ログアウト処理
   * 別のアカウントで試したい場合などに使用
   *
   * signOut() 後は onAuthStateChanged が発火して user が null になり、
   * このページの「if (!user)」チェックが <Navigate to="/login" /> を返す
   * → 自動でログインページへリダイレクトされる
   */
  const handleLogout = async () => {
    await signOut(auth)
    // navigate不要：signOut後にuserがnullになり、下の<Navigate>が自動でリダイレクト
  }

  // 認証状態の確認中は何も表示しない
  if (loading) {
    return (
      <div className="verify-loading">
        読み込み中...
      </div>
    )
  }

  // 未ログインならログインページへリダイレクト
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // メール確認済みならメモページへリダイレクト
  if (user.emailVerified) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="verify-container">
      <h1 className="verify-title">メールを確認してください</h1>

      {/* 説明文 */}
      <p className="verify-description">
        <strong>{user?.email}</strong> に確認メールを送信しました。
      </p>
      <p className="verify-description-last">
        メール内のリンクをクリックして、アカウント作成を完了してください。
      </p>

      {/* 迷惑メール案内 */}
      <div className="verify-notice">
        メールが届かない場合は、<strong>迷惑メールフォルダ</strong>をご確認ください。
      </div>

      {/* 操作結果メッセージ */}
      {message && (
        <div
          className={`verify-message ${
            message.type === 'success' ? 'verify-message-success' : 'verify-message-error'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* 再送信ボタン */}
      <button
        onClick={handleResend}
        disabled={isResending}
        className="verify-resend-button"
      >
        {isResending ? '送信中...' : '確認メールを再送信'}
      </button>

      {/* ログアウトリンク */}
      <p className="verify-logout-link">
        <button onClick={handleLogout} className="verify-logout-button">
          別のアカウントでログイン
        </button>
      </p>
    </div>
  )
}

export default EmailVerificationPage
