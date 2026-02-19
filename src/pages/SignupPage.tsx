/**
 * サインアップページコンポーネント
 *
 * メールアドレスとパスワードで新規アカウントを作成する画面です。
 * Firebase Authentication の `createUserWithEmailAndPassword` を使用して、
 * 登録に成功したらそのままログイン状態としてメモページ（/）に遷移します。
 */

import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { z } from 'zod'

/**
 * サインアップフォームの入力値を検証するためのZodスキーマ
 *
 * - email: 空ではない + メールアドレス形式
 * - password: 6文字以上（Firebaseの推奨に合わせる）
 */
const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('メールアドレスの形式が正しくありません'),
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください'),
})

/**
 * サインアップページを表示するコンポーネント
 *
 * @returns サインアップ画面のJSX要素
 */
const SignupPage: React.FC = () => {
  // フォーム入力値（メールアドレス・パスワード）を管理するState
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // サインアップ処理中かどうか
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 各フィールドごとのバリデーションエラー（Zod用）
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})

  // 日本語で表示するエラーメッセージ
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Firebaseから返ってきたエラーコード（開発用）
  const [errorCode, setErrorCode] = useState<string | null>(null)

  // 登録成功後にページ遷移するためのフック
  const navigate = useNavigate()

  /**
   * サインアップフォーム送信時の処理
   *
   * @param event - フォーム送信イベント
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      // まずはZodで入力値の検証を行う
      const result = signupSchema.safeParse({ email, password })

      if (!result.success) {
        /**
         * flatten() でフィールドごとのエラー配列を取得し、
         * 先頭のメッセージだけを画面に表示します。
         */
        const formErrors = result.error.flatten().fieldErrors
        setFieldErrors({
          email: formErrors.email?.[0],
          password: formErrors.password?.[0],
        })

        // クライアント側のバリデーションエラーなので、Firebaseには問い合わせない
        return
      }

      // バリデーションを通過したので、過去のフィールドエラーをクリア
      setFieldErrors({})

      setIsSubmitting(true)
      setErrorMessage(null)
      setErrorCode(null)

      // Firebase Authentication を使って新規ユーザーを作成
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // 作成したユーザーに確認メールを送信
      // ユーザーがメールのリンクをクリックすることで、メールアドレスが確認済みになる
      await sendEmailVerification(userCredential.user)

      // メール確認待ち画面へ遷移（メモページへはまだ行けない）
      navigate('/verify-email', { replace: true })
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any
      setErrorCode(err.code ?? null)

      switch (err.code) {
        case 'auth/email-already-in-use':
          setErrorMessage('このメールアドレスはすでに登録されています。')
          break
        case 'auth/invalid-email':
          setErrorMessage('メールアドレスの形式が正しくありません。')
          break
        case 'auth/operation-not-allowed':
          setErrorMessage(
            'メール/パスワードでの登録が有効になっていません。管理者に確認してください。'
          )
          break
        case 'auth/weak-password':
          setErrorMessage('パスワードが弱すぎます。もう少し複雑にしてください。')
          break
        default:
          setErrorMessage(
            'アカウントの作成に失敗しました。時間をおいて再度お試しください。'
          )
          break
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '16px' }}>アカウント作成</h1>

      {/* エラーメッセージ（日本語） */}
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
          {errorCode && (
            <div
              style={{
                marginTop: 4,
                fontSize: '11px',
                opacity: 0.8,
              }}
            >
              エラーコード: <code>{errorCode}</code>
            </div>
          )}
        </div>
      )}

      {/* サインアップフォーム */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
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
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          {/* メールアドレス入力欄の直下に、Zodのバリデーションエラーを表示 */}
          {fieldErrors.email && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#b00020',
              }}
            >
              {fieldErrors.email}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: 4, fontSize: 14 }}
          >
            パスワード
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 14,
              borderRadius: 4,
              border: '1px solid #ccc',
              boxSizing: 'border-box',
            }}
          />
          {/* パスワード入力欄の直下に、Zodのバリデーションエラーを表示 */}
          {fieldErrors.password && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: '#b00020',
              }}
            >
              {fieldErrors.password}
            </div>
          )}
        </div>

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
          }}
        >
          {isSubmitting ? '作成中...' : 'アカウントを作成'}
        </button>
      </form>

      {/* ログインページへのリンク */}
      <p style={{ marginTop: 16, fontSize: 13 }}>
        すでにアカウントをお持ちの方は <Link to="/login">こちらからログイン</Link>
      </p>
    </div>
  )
}

export default SignupPage

