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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18, color: '#666' }}>
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
    <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>メールを確認してください</h1>

      {/* 説明文 */}
      <p style={{ fontSize: 14, color: '#555', marginBottom: '8px', lineHeight: 1.7 }}>
        <strong>{user?.email}</strong> に確認メールを送信しました。
      </p>
      <p style={{ fontSize: 14, color: '#555', marginBottom: '12px', lineHeight: 1.7 }}>
        メール内のリンクをクリックして、アカウント作成を完了してください。
      </p>

      {/* 迷惑メール案内 */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          backgroundColor: '#fffbeb',
          border: '1px solid #fde68a',
          marginBottom: '24px',
          fontSize: 13,
          color: '#92400e',
          lineHeight: 1.7,
        }}
      >
        メールが届かない場合は、<strong>迷惑メールフォルダ</strong>をご確認ください。
      </div>

      {/* 操作結果メッセージ */}
      {message && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 12px',
            borderRadius: 4,
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#ffe5e5',
            color: message.type === 'success' ? '#166534' : '#b00020',
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 再送信ボタン */}
      <button
        onClick={handleResend}
        disabled={isResending}
        style={{
          width: '100%',
          padding: '10px 0',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 9999,
          border: '1px solid #ccc',
          cursor: isResending ? 'not-allowed' : 'pointer',
          backgroundColor: 'white',
          color: '#555',
          marginBottom: '24px',
        }}
      >
        {isResending ? '送信中...' : '確認メールを再送信'}
      </button>

      {/* ログアウトリンク */}
      <p style={{ fontSize: 13, textAlign: 'center' }}>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: '#999',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          別のアカウントでログイン
        </button>
      </p>
    </div>
  )
}

export default EmailVerificationPage
