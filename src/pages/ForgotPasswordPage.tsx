/**
 * パスワードリセットページコンポーネント
 *
 * パスワードを忘れたユーザーが、登録済みのメールアドレスを入力すると
 * Firebase からパスワードリセット用のメールが送信される画面です。
 *
 * 使用するFirebase機能:
 * - sendPasswordResetEmail() : リセットメールを送信する関数
 */

import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { z } from 'zod'

/**
 * メールアドレス入力欄のバリデーションスキーマ（Zod）
 *
 * - 空ではない
 * - メールアドレスの形式が正しい
 */
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
})

/**
 * パスワードリセットページを表示するコンポーネント
 *
 * @returns パスワードリセット画面のJSX要素
 */
const ForgotPasswordPage: React.FC = () => {
  // メールアドレスの入力値を管理するState
  const [email, setEmail] = useState('')

  // 送信処理中かどうか（多重送信防止・ボタン無効化に使用）
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Zodのバリデーションエラーを管理するState
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({})

  // 画面に表示するエラーメッセージ（日本語）
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // メール送信成功かどうかを管理するState
  // trueになると「メールを送信しました」の画面に切り替わる
  const [isSent, setIsSent] = useState(false)

  /**
   * フォーム送信時の処理
   *
   * @param event - フォーム送信イベント
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // デフォルトのフォーム送信（ページリロード）を防ぐ
    event.preventDefault()

    try {
      // Zodでメールアドレスのバリデーション
      const result = forgotPasswordSchema.safeParse({ email })

      if (!result.success) {
        // バリデーションエラーがある場合はエラーメッセージを表示して終了
        const formErrors = result.error.flatten().fieldErrors
        setFieldErrors({ email: formErrors.email?.[0] })
        return
      }

      // バリデーションを通過したので、過去のエラーをクリア
      setFieldErrors({})
      setIsSubmitting(true)
      setErrorMessage(null)

      // Firebase Authentication でパスワードリセットメールを送信
      // メールアドレスが登録されていない場合もエラーを出さない（セキュリティのため）
      await sendPasswordResetEmail(auth, email)

      // 送信成功 → 「送信完了」の表示に切り替える
      setIsSent(true)
    } catch (error) {
      const err = error as any

      // エラーコードごとに日本語メッセージを出し分け
      switch (err.code) {
        case 'auth/invalid-email':
          setErrorMessage('メールアドレスの形式が正しくありません。')
          break
        case 'auth/too-many-requests':
          setErrorMessage(
            'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。'
          )
          break
        default:
          setErrorMessage(
            'メールの送信に失敗しました。時間をおいて再度お試しください。'
          )
          break
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // メール送信完了後の画面
  if (isSent) {
    return (
      <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
        <h1 style={{ marginBottom: '16px' }}>メールを送信しました</h1>

        {/* 送信完了メッセージ */}
        <div
          style={{
            padding: '16px',
            borderRadius: 8,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            marginBottom: '24px',
          }}
        >
          <p style={{ margin: '0 0 8px', fontSize: 14, color: '#166534', fontWeight: 600 }}>
            送信完了
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#15803d' }}>
            <strong>{email}</strong> にパスワードリセット用のメールを送信しました。
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#16a34a' }}>
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
        </div>

        {/* ログインページへのリンク */}
        <Link
          to="/login"
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 0',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 9999,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: '#facc15',
            color: '#222',
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          ログインページへ戻る
        </Link>
      </div>
    )
  }

  // メール入力フォームの画面
  return (
    <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>パスワードをお忘れですか？</h1>

      {/* 説明文 */}
      <p style={{ fontSize: 14, color: '#555', marginBottom: '20px' }}>
        登録済みのメールアドレスを入力してください。
        パスワードリセット用のメールをお送りします。
      </p>

      {/* エラーメッセージ */}
      {errorMessage && (
        <div
          style={{
            marginBottom: '12px',
            padding: '8px 12px',
            borderRadius: 4,
            backgroundColor: '#ffe5e5',
            color: '#b00020',
            fontSize: '14px',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* メールアドレス入力フォーム */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: 4, fontSize: 14 }}
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="example@email.com"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          {/* Zodのバリデーションエラー */}
          {fieldErrors.email && (
            <div style={{ marginTop: 4, fontSize: 12, color: '#b00020' }}>
              {fieldErrors.email}
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '10px 0',
            fontSize: 15,
            fontWeight: 600,
            borderRadius: 9999,
            border: 'none',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            backgroundColor: isSubmitting ? '#ccc' : '#facc15',
            color: '#222',
            marginBottom: '16px',
          }}
        >
          {isSubmitting ? '送信中...' : 'リセットメールを送信'}
        </button>
      </form>

      {/* ログインページへ戻るリンク */}
      <p style={{ fontSize: 13, textAlign: 'center' }}>
        <Link to="/login">ログインページへ戻る</Link>
      </p>
    </div>
  )
}

export default ForgotPasswordPage
